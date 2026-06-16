<?php
/**
 * DONNA Logic - Modern AI Assistant with Clerk Integration
 * Combines robust prompting with user profiles and voice system integration
 */

require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_rate_limit.php';

// Set CORS and require auth (Clerk JWT or API_SECRET)
$auth = donna_cors_and_auth();

// Basic rate limiting (per IP)
$limitPerMinute = intval(getenv('API_RATE_LIMIT_PER_MINUTE') ?: 60);
donna_rate_limit('donna_logic', $limitPerMinute, 60);

header('Content-Type: application/json');


// Try to load Composer autoloader if available (for OpenAI PHP SDK, etc.)
// We know vendor is alongside public_html at the site root.
$__site_root = null;
if (!empty($_SERVER['DOCUMENT_ROOT'])) {
    // e.g., /home/user/public_html -> site root: /home/user
    $__site_root = realpath(dirname($_SERVER['DOCUMENT_ROOT']));
}
if (!$__site_root) {
    // Fallback from this file location: public_html/donna/api -> go up 3 levels
    $__site_root = realpath(__DIR__ . '/../../../');
}
$__autoload_candidates = [
    $__site_root ? ($__site_root . '/vendor/autoload.php') : null,
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
    __DIR__ . '/../../../vendor/autoload.php'
];
$__autoload_used = null;
foreach ($__autoload_candidates as $__autoload) {
    if ($__autoload && file_exists($__autoload)) {
        require_once $__autoload;
        $__autoload_used = $__autoload;
        break;
    }
}
if (!$__autoload_used) {
    error_log('[DONNA][autoload] vendor/autoload.php not found in expected locations');
}

// Error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/donna_errors.log');

// Get OpenAI API key from environment
$api_key = getenv('OPENAI_API_KEY') ?: '';
if (!$api_key) {

// Load .env directly (prefer Dotenv from Composer; fallback to simple parser)
$__env_loaded = false;
$__env_roots = [
    realpath(__DIR__ . '/../../../'), // e.g., vendor/.env alongside public_html
    realpath(__DIR__ . '/../../'),    // one level higher just in case
    realpath(__DIR__ . '/..'),        // two levels inside projects
];
foreach ($__env_roots as $__root) {
    if (!($__root && is_dir($__root))) { continue; }
    // Try Dotenv first
    if (class_exists('Dotenv\Dotenv')) {
        try {
            Dotenv\Dotenv::createImmutable($__root, ['.env', '.env.local'])->safeLoad();
            $__env_loaded = true;
            break;
        } catch (Throwable $e) {
            // Continue to fallback parser
        }
    }
    // Fallback minimal parser for .env (only first existing)
    $candidates = [$__root . '/.env', $__root . '/.env.local'];
    foreach ($candidates as $envPath) {
        if (is_file($envPath) && is_readable($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') { continue; }
                if (strpos($line, '=') === false) { continue; }
                [$k, $v] = array_map('trim', explode('=', $line, 2));
                if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                    $v = substr($v, 1, -1);
                }
                putenv("$k=$v");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
            $__env_loaded = true;
            break 2; // done
        }
    }
}
if (!$__env_loaded) {
    error_log('[DONNA][env] .env not loaded from expected locations');
}

    // Re-check the key after attempted load
    $api_key = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
    if (!$api_key) {
        // Emit detailed context for debugging
        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? 'unset';
        $cwd = getcwd();
        error_log('[DONNA][env] OPENAI_API_KEY still missing after .env load. ' . 
                  'docRoot=' . $docRoot . ' cwd=' . $cwd . ' autoload=' . ($__autoload_used ?? 'none'));
        echo json_encode(["error" => "OpenAI API key missing.", "reply" => "❌ System configuration error."]);
        exit;
    }
}


// Load mail helper for SMTP sending (if available)
require_once __DIR__ . '/lib/mail.php';
if (function_exists('donna_load_env')) { donna_load_env(); }

// Parse input (support both POST and JSON)
$input = json_decode(file_get_contents("php://input"), true) ?: $_POST;
$message = $input['message'] ?? '';
$chat_id = $input['chat_id'] ?? 'guest-' . time();
$user_id = null;
$user_email = null;
if ($auth['auth'] === 'clerk' && isset($auth['claims']['sub'])) {
    $user_id = $auth['claims']['sub'];
    $user_email = $auth['claims']['email'] ?? null;
}
$user_profile = $input['user_profile'] ?? 'general'; // general, sales, receptionist, marketing

if (empty($message)) {
    echo json_encode(["reply" => "❌ No message received."]);
    exit;
}

// NOTE: Chat history and user memory are now primarily managed by the Next.js frontend
// and persisted via the /api/db/chat endpoint. This script is becoming stateless.
$chat_history = $input['chat_history'] ?? []; // Expect frontend to send history
$user_memory = $input['user_memory'] ?? [];   // Expect frontend to send relevant memory

// Limit history to prevent token overflow (keep last 20 messages)
$chat_history = array_slice($chat_history, -20);
$chat_history[] = ["role" => "user", "content" => $message];


// Abuse detection
$abuse_detected = detectAbuse($message);
if ($abuse_detected) {
    logAbuse($chat_id, $message, $user_id, $user_email);
}

// Intent detection for tours and onboarding
$tour_intent = null;
$onboarding_intent = null;

if ($user_id) {
    // Load intent detection and tour controller
    require_once __DIR__ . '/../lib/IntentDetector.php';
    require_once __DIR__ . '/../lib/TourController.php';
    require_once __DIR__ . '/../lib/OnboardingStateManager.php';
    require_once __DIR__ . '/../lib/ConversationalIntakeHandler.php';
    
    // Check for tour intents
    $tour_intent = IntentDetector::detectIntent($message);
    
    // Check if user needs onboarding
    $onboardingManager = new OnboardingStateManager();
    $clerkId = $auth['claims']['sub'] ?? $user_id;
    
    if (!$onboardingManager->isOnboardingCompleted($user_id, $clerkId)) {
        // Check if message is part of onboarding conversation
        $intakeHandler = new ConversationalIntakeHandler();
        $state = $onboardingManager->getOnboardingState($user_id, $clerkId);
        $currentStep = $state['current_step'] ?? null;
        
        // Process onboarding response
        $onboarding_result = $intakeHandler->processResponse($user_id, $message, $currentStep, $clerkId);
        
        // If this is an onboarding response, return it directly
        if (isset($onboarding_result['action']) && in_array($onboarding_result['action'], ['ask_field', 'field_completed', 'clarify', 'skip'])) {
            echo json_encode([
                "success" => true,
                "reply" => $onboarding_result['message'] ?? "Let's continue with your onboarding.",
                "action" => "onboarding",
                "onboarding" => $onboarding_result,
                "metadata" => [
                    "profile" => $user_profile,
                    "chat_id" => $chat_id,
                    "authenticated" => true
                ]
            ]);
            exit;
        }
    }
    
    // Handle tour intents
    if ($tour_intent) {
        $tourController = new TourController();
        $commandType = IntentDetector::getCommandType($tour_intent);
        $moduleId = IntentDetector::getTourModuleId($tour_intent);
        
        if ($commandType && $moduleId) {
            $tour_result = $tourController->processCommand($user_id, $commandType, ['module_id' => $moduleId], $clerkId);
            
            // Log command
            $activeTour = $tourController->getActiveTour($user_id, $clerkId);
            $tourController->logCommand(
                $user_id,
                $commandType,
                $message,
                $tour_intent,
                $tour_result,
                $activeTour['id'] ?? null,
                $clerkId
            );
            
            // Return tour response
            if ($tour_result['success']) {
                $tour_message = "Great! Let me show you around. ";
                if (isset($tour_result['current_step']['text'])) {
                    $tour_message .= $tour_result['current_step']['text'];
                } else {
                    $tour_message .= "Starting the tour now!";
                }
                
                echo json_encode([
                    "success" => true,
                    "reply" => $tour_message,
                    "action" => "tour",
                    "tour" => $tour_result,
                    "metadata" => [
                        "profile" => $user_profile,
                        "chat_id" => $chat_id,
                        "authenticated" => true
                    ]
                ]);
                exit;
            }
        }
    }
}

// Build system prompt based on profile
$system_prompt = buildSystemPrompt($user_profile, $user_memory, $abuse_detected, $user_id, $clerkId ?? null);

// Prepare messages for OpenAI
$messages = [["role" => "system", "content" => $system_prompt]];
foreach ($chat_history as $entry) {
    $messages[] = ["role" => $entry['role'], "content" => $entry['content']];
}

try {
    // Call OpenAI API
    $response = callOpenAI($api_key, $messages, $user_profile);

    // Log backend path used (SDK vs cURL) and autoloader path if any
    $backend = $response['__backend'] ?? 'unknown';
    $autoloadPath = isset($__autoload_used) ? $__autoload_used : 'none';
    error_log('[DONNA][OpenAI] backend=' . $backend . ' autoload=' . $autoloadPath . ' profile=' . $user_profile);

    $reply = $response['choices'][0]['message']['content'] ?? "⚠️ Sorry, I didn't understand that.";

    // Process any commands or actions in the response
    $action_result = processCommands($message, $reply, $user_id, $chat_id);

    // Update chat history for this request cycle
    $chat_history[] = ["role" => "assistant", "content" => $reply];

    // Add system flags if needed
    if ($abuse_detected) {
        $chat_history[] = ["role" => "system", "content" => "🚩 Conversation flagged for review."];
    }

    // Persist the conversation to Supabase via Next.js API
    if ($user_id) { // Only persist for authenticated users
        persist_chat_via_api($chat_id, $chat_history, $user_id, $user_email);
    }

    // Return response
    echo json_encode([
        "success" => true,
        "reply" => $reply,
        "action" => $action_result['action'] ?? null,
        "metadata" => [
            "profile" => $user_profile,
            "abuse_detected" => $abuse_detected,
            "chat_id" => $chat_id,
            "authenticated" => !empty($user_id)
        ]
    ]);

} catch (Exception $e) {
    if (getenv('SENTRY_DSN')) { try { \Sentry\captureException($e); } catch (\Throwable $t) {} }
    error_log("DONNA API Error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "reply" => "❌ I'm experiencing technical difficulties. Please try again in a moment.",
        "error" => "API_ERROR"
    ]);
}

/**
 * Persist chat history to the database via the Next.js API
 */
function persist_chat_via_api($chat_id, $messages, $user_id, $user_email) {
    $nextjs_host = getenv('NEXTJS_HOST') ?: 'http://localhost:3000';
    $api_secret = getenv('API_SECRET');
    if (!$api_secret) {
        error_log("[DONNA][persist_chat] API_SECRET is not configured. Cannot persist chat.");
        return;
    }
    $url = $nextjs_host . '/api/db/chat';

    $data = [
        'chat_id' => $chat_id,
        'messages' => $messages,
        // The user_id and email are now derived from the Clerk token in the Next.js endpoint
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_secret,
    ]);
    // Best-effort, short timeout without blocking main request
    curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, 750);


    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 300) {
        error_log("[DONNA][persist_chat_via_api] Error: HTTP {" . $http_code . "} - " . $response);
    }
}


/**
 * Call OpenAI API using PHP SDK when available, fallback to cURL
 */
function callOpenAI($api_key, $messages, $profile) {
    // Model/temperature by profile
    $model_config = [
        'general' => ['model' => 'gpt-4o', 'temperature' => 0.7],
        'sales' => ['model' => 'gpt-4o', 'temperature' => 0.8],
        'receptionist' => ['model' => 'gpt-4o', 'temperature' => 0.6],
        'marketing' => ['model' => 'gpt-4o', 'temperature' => 0.8]
    ];
    $config = $model_config[$profile] ?? $model_config['general'];

    // Prefer SDK if class exists
    if (class_exists('OpenAI') || class_exists('OpenAI\Factory')) {
        try {
            // Primary: OpenAI::client($api_key)
            if (class_exists('OpenAI')) {
                $client = \OpenAI::client($api_key);
            } elseif (class_exists('OpenAI\Factory')) {
                // Alternate factory API
                $client = (new \OpenAI\Factory())->withApiKey($api_key)->make();
            }
            $sdkResponse = $client->chat()->create([
                'model' => $config['model'],
                'messages' => $messages,
                'temperature' => $config['temperature'],
                'max_tokens' => 500,
            ]);

            // Normalize to array similar to cURL json_decode
            // Most versions allow array access via toArray(), else cast
            if (method_exists($sdkResponse, 'toArray')) {
                $arr = $sdkResponse->toArray();
            } else {
                $arr = is_array($sdkResponse) ? $sdkResponse : json_decode(json_encode($sdkResponse), true);
            }
            // Mark backend for logging upstream
            if (is_array($arr)) { $arr['__backend'] = 'sdk'; }
            return $arr;
        } catch (\Throwable $e) {
            // Fall through to cURL fallback below
            error_log('OpenAI SDK call failed, falling back to cURL: ' . $e->getMessage());
        }
    }

    // cURL fallback
    $data = [
        'model' => $config['model'],
        'messages' => $messages,
        'temperature' => $config['temperature'],
        'max_tokens' => 500
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_key
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err = curl_error($ch);
    curl_close($ch);

    if ($http_code !== 200 || $response === false) {
        throw new Exception("OpenAI API error: HTTP $http_code " . ($curl_err ? "- $curl_err" : ''));
    }

    $arr = json_decode($response, true);
    if (is_array($arr)) { $arr['__backend'] = 'curl'; }
    return $arr;
}

/**
 * Build dynamic system prompt based on profile
 */
function buildSystemPrompt($profile, $user_memory, $abuse_detected, $user_id = null, $clerk_id = null) {
    $profiles = [
        'general' => 'You are DONNA, a helpful AI assistant. Be friendly, professional, and concise. Help with general questions and tasks.',

        'sales' => 'You are DONNA, a sales-focused AI assistant for business development. Be enthusiastic, persuasive, and results-driven. Help with lead qualification, follow-ups, closing deals, and sales strategy. Channel confident energy while remaining professional.',

        'receptionist' => 'You are DONNA, a professional AI receptionist. Handle calls, schedule appointments, take messages, and provide excellent customer service. Be warm, efficient, and helpful. Keep responses concise and professional.',

        'marketing' => 'You are DONNA, a marketing-focused AI assistant. Help with campaigns, content creation, lead nurturing, email marketing, and marketing automation. Be creative, strategic, and data-driven.'
    ];

    $base_prompt = $profiles[$profile] ?? $profiles['general'];

    // Load personality configuration if available
    $personality_config = null;
    if ($user_id) {
        try {
            require_once __DIR__ . '/../lib/PersonalityConfigManager.php';
            $personalityManager = new PersonalityConfigManager();
            $personality_config = $personalityManager->getPersonalityForDONNA($user_id, $clerk_id);
            
            if ($personality_config && isset($personality_config['name'])) {
                // Override base prompt with personality configuration
                $traits = $personality_config['traits'] ?? [];
                $tone = $personality_config['tone'] ?? 'professional';
                $formality = $personality_config['formality'] ?? 'semi-formal';
                
                $personality_desc = "You are DONNA with a " . $personality_config['name'] . " personality. ";
                $personality_desc .= "Your traits: " . implode(', ', $traits) . ". ";
                $personality_desc .= "Tone: $tone. Formality: $formality. ";
                $personality_desc .= $personality_config['description'] ?? '';
                
                $base_prompt = $personality_desc;
            }
        } catch (Exception $e) {
            error_log("Error loading personality config: " . $e->getMessage());
        }
    }

    // Add user context if available
    $context = '';
    if (!empty($user_memory['name'])) {
        $context .= "\nUser's name: " . $user_memory['name'];
    }
    if (!empty($user_memory['company'])) {
        $context .= "\nUser's company: " . $user_memory['company'];
    }
    if (!empty($user_memory['preferences'])) {
        $context .= "\nUser preferences: " . implode(', ', $user_memory['preferences']);
    }

    // Add behavioral guidelines
    $guidelines = "\n\nGuidelines:\n";
    $guidelines .= "- Keep responses concise and actionable\n";
    $guidelines .= "- Ask follow-up questions when you need more information\n";
    $guidelines .= "- Stay professional and helpful\n";
    $guidelines .= "- If handling emails or leads, classify them appropriately\n";
    $guidelines .= "- If the user asks for a tour or help with navigation, you can suggest using the tour system\n";

    if ($abuse_detected) {
        $guidelines .= "- The user's message contains inappropriate language - respond professionally but briefly\n";
    }

    return $base_prompt . $context . $guidelines;
}

/**
 * Detect abusive content
 */
function detectAbuse($message) {
    $abuse_keywords = [
        'stupid', 'idiot', 'hate you', 'shut up', 'dumb', 'suck',
        'f***', 'bitch', 'abuse', 'kill', 'die', 'moron', 'loser'
    ];

    $message_lower = strtolower($message);
    foreach ($abuse_keywords as $keyword) {
        if (strpos($message_lower, $keyword) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Log abusive behavior
 */
function logAbuse($chat_id, $message, $user_id, $user_email) {
    $nextjs_host = getenv('NEXTJS_HOST') ?: 'http://localhost:3000';
    $api_secret = getenv('API_SECRET');
    if (!$api_secret) {
        error_log("[DONNA][logAbuse] API_SECRET is not configured. Cannot log abuse.");
        return;
    }
    $url = $nextjs_host . '/api/db/log/abuse';

    $data = [
        'chat_id' => $chat_id,
        'user_id' => $user_id,
        'message' => substr($message, 0, 200), // Truncate for privacy
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_secret,
    ]);
    // Best-effort, short timeout without blocking main request
    curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, 750);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 300) {
        error_log("[DONNA][logAbuse] Error: HTTP {$http_code} - " . $response);
    }
}

/**
 * Process commands and actions
 */
function processCommands($user_message, $ai_response, $user_id, $chat_id) {
    $message_lower = strtolower($user_message);

    // Email processing
    if (preg_match('/(subject|from|message|body)\s*:/i', $user_message)) {
        return processEmailCommand($user_message);
    }

    // Lead classification
    if (strpos($message_lower, 'classify lead') !== false || strpos($message_lower, 'evaluate prospect') !== false) {
        return ['action' => 'classify_lead', 'status' => 'processing'];
    }

    // Campaign management
    if (strpos($message_lower, 'start campaign') !== false || strpos($message_lower, 'launch campaign') !== false) {
        return ['action' => 'start_campaign', 'status' => 'initiated'];
    }

    // SMS/Email sending
    if (strpos($message_lower, 'send email') !== false) {
        // Try to parse a simple "to: x, subject: y, body: z" from the user message
        $to = '';$subject='';$body='';
        if (preg_match('/to\s*:\s*([^,\n]+)/i', $user_message, $m)) { $to = trim($m[1]); }
        if (preg_match('/subject\s*:\s*([^\n]+)/i', $user_message, $m)) { $subject = trim($m[1]); }
        if (preg_match('/(body|message)\s*:\s*(.+)$/is', $user_message, $m)) { $body = trim($m[2]); }

        if ($to && $subject && $body) {
            $res = null;
            $opts = ['to'=>$to,'subject'=>$subject,'body'=>$body, 'user_id' => $user_id];
            if (function_exists('donna_phpmailer_send')) {
                $res = donna_phpmailer_send($opts);
                if (!$res['success'] && function_exists('donna_smtp_send')) {
                    $res = donna_smtp_send($opts);
                }
            } elseif (function_exists('donna_smtp_send')) {
                $res = donna_smtp_send($opts);
            }
            if ($res && !empty($res['success'])) {
                return ['action' => 'email_sent', 'status' => 'sent', 'to' => $to];
            } elseif ($res) {
                return ['action' => 'email_error', 'status' => 'error', 'error' => $res['error'] ?? 'send failed'];
            }
        }
        return ['action' => 'send_message', 'status' => 'queued'];
    }
    if (strpos($message_lower, 'send sms') !== false) {
        return ['action' => 'send_message', 'status' => 'queued'];
    }

    return ['action' => 'chat', 'status' => 'completed'];
}

/**
 * Process email-related commands
 */
function processEmailCommand($message) {
    // Extract email components
    preg_match('/subject\s*:\s*(.*)/i', $message, $subject_match);
    preg_match('/from\s*:\s*(.*)/i', $message, $from_match);
    preg_match('/message\s*:\s*(.*)/is', $message, $body_match);

    $subject = trim($subject_match[1] ?? '');
    $from = trim($from_match[1] ?? '');
    $body = trim($body_match[1] ?? '');

    // Classify email
    $is_spam = preg_match('/(unsubscribe|lottery|crypto|free money|viagra|pills)/i', $body);
    $is_lead = preg_match('/(interested|quote|pricing|estimate|services|consultation)/i', $body);
    $is_urgent = preg_match('/(urgent|asap|emergency|immediate)/i', $body);

    if ($is_spam) {
        return ['action' => 'email_spam', 'classification' => 'spam'];
    }

    if ($is_lead) {
        $priority = $is_urgent ? 'urgent' : 'high';
        return ['action' => 'email_lead', 'classification' => 'lead', 'priority' => $priority];
    }

    return ['action' => 'email_general', 'classification' => 'general'];
}
?>
