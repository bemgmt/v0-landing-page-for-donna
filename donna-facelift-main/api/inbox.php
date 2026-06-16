<?php
/**
 * DONNA INBOX API
 *
 * This file acts as the central backend for all email-related functionality.
 * It uses the Gmail API for reading/sending emails and OpenAI for AI-powered replies.
 *
 * Actions are specified via a URL parameter: ?action=ACTION
 *
 * Available Actions:
 * - read_inbox: Fetches the last 5 email threads.
 * - send_email: Sends a new email. (Requires POST data: to, subject, body)
 * - reply_to_email: Sends a reply to an existing thread. (Requires POST data: threadId, body)
 * - draft_ai_reply: Analyzes a thread and drafts a reply using AI. (Requires POST data: threadId, goal, full_name)
 */

// --- GEMINI PROPOSED CHANGE START ---
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../bootstrap_env.php';
require_once __DIR__ . '/lib/ApiResponder.php';
require_once __DIR__ . '/lib/cors.php';

ApiResponder::initTraceId();
CORSHelper::enforceCORS();

header('Content-Type: application/json');
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// header('Content-Type: application/json');
// require_once __DIR__ . '/../vendor/autoload.php';
// require_once __DIR__ . '/../bootstrap_env.php';
// require_once __DIR__ . '/lib/ApiResponder.php';

// ApiResponder::initTraceId();
// --- OLD CODE TO BE DELETED END ---


// Main request router
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'read_inbox':
        read_inbox();
        break;
    case 'send_email':
        send_email();
        break;
    case 'reply_to_email':
        reply_to_email();
        break;
    case 'draft_ai_reply':
        draft_ai_reply();
        break;
    default:
        ApiResponder::jsonError('Invalid action specified.', 400);
        break;
}

/**
 * Initializes and returns an authenticated Google API client.
 * Uses the refresh token to get a new access token.
 * @return Google_Client
 */
// --- GEMINI PROPOSED CHANGE START ---
function get_google_client(): Google_Client
{
    $client = new Google_Client();
    $client->setApplicationName('Donna Email Assistant');
    $client->setScopes(Google_Service_Gmail::GMAIL_MODIFY);

    $clientId = getenv('GMAIL_CLIENT_ID') ?: ($_ENV['GMAIL_CLIENT_ID'] ?? null);
    $clientSecret = getenv('GMAIL_CLIENT_SECRET') ?: ($_ENV['GMAIL_CLIENT_SECRET'] ?? null);
    $refreshToken = getenv('GMAIL_REFRESH_TOKEN') ?: ($_ENV['GMAIL_REFRESH_TOKEN'] ?? null);

    if (!$clientId || !$clientSecret) {
        throw new Exception("GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET not found in environment variables.");
    }

    $client->setClientId($clientId);
    $client->setClientSecret($clientSecret);
    $client->setAccessType('offline');
    $client->setPrompt('select_account consent');

    if (!$refreshToken) {
        throw new Exception("GMAIL_REFRESH_TOKEN not found in environment variables.");
    }
    $client->fetchAccessTokenWithRefreshToken($refreshToken);

    return $client;
}
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// function get_google_client(): Google_Client
// {
//     $client = new Google_Client();
//     $client->setApplicationName('Donna Email Assistant');
//     $client->setScopes(Google_Service_Gmail::GMAIL_MODIFY);
//     $client->setClientId(getenv('GMAIL_CLIENT_ID'));
//     $client->setClientSecret(getenv('GMAIL_CLIENT_SECRET'));
//     $client->setAccessType('offline');
//     $client->setPrompt('select_account consent');

//     // Use the refresh token from .env to get a new access token
//     $refreshToken = getenv('GMAIL_REFRESH_TOKEN');
//     if (!$refreshToken) {
//         throw new Exception("GMAIL_REFRESH_TOKEN not found in environment variables.");
//     }
//     $client->fetchAccessTokenWithRefreshToken($refreshToken);

//     return $client;
// }
// --- OLD CODE TO BE DELETED END ---


/**
 * Fetches the last 5 email threads from the Gmail inbox.
 */
function read_inbox()
{
    try {
        $client = get_google_client();
        $gmail = new Google_Service_Gmail($client);
        $user = 'me';

        $list = $gmail->users_messages->listUsersMessages($user, ['maxResults' => 5, 'q' => 'in:inbox']);
        $messages = $list->getMessages();

        $threads = [];
        foreach ($messages as $message) {
            $msg = $gmail->users_messages->get($user, $message->getId());
            $payload = $msg->getPayload();
            $headers = $payload->getHeaders();

            $subject = '';
            $from = '';
            $date = '';

            foreach ($headers as $header) {
                if ($header->getName() == 'Subject') $subject = $header->getValue();
                if ($header->getName() == 'From') $from = $header->getValue();
                if ($header->getName() == 'Date') $date = $header->getValue();
            }

            $threads[] = [
                "id" => $msg->getThreadId(),
                "sender" => $from,
                "subject" => $subject,
                "snippet" => substr($msg->getSnippet(), 0, 100) . '...', 
                "latest" => date("c", strtotime($date)),
            ];
        }

        ApiResponder::jsonSuccess(['threads' => $threads]);

    } catch (Exception $e) {
        if (getenv('SENTRY_DSN')) { try { \Sentry\captureException($e); } catch (\Throwable $t) {} }
        ApiResponder::jsonServerError('Failed to read inbox');
    }
}

/**
 * Sends a new email.
 */
function send_email()
{
    $to = $_POST['to'] ?? null;
    $subject = $_POST['subject'] ?? '';
    $body = $_POST['body'] ?? '';

    $validation = ApiResponder::validateRequired(['to' => $to, 'body' => $body], ['to', 'body']);
    if (!$validation['valid']) {
        ApiResponder::jsonValidationError($validation['message']);
        return;
    }

    try {
        $client = get_google_client();
        $gmail = new Google_Service_Gmail($client);
        $user = 'me';

        $message = new Google_Service_Gmail_Message();
        $rawMsgStr = "To: {$to}\r\n";
        $rawMsgStr .= "MIME-Version: 1.0\r\n";
        $rawMsgStr .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $rawMsgStr .= "Subject: {$subject}\r\n";
        $rawMsgStr .= "\r\n";
        $rawMsgStr .= $body;

        $raw = base64_encode($rawMsgStr);
        $message->setRaw(rtrim(strtr($raw, '+/', '-_'), '='));
        $gmail->users_messages->send($user, $message);

        ApiResponder::jsonSuccess(['status' => 'sent']);

    } catch (Exception $e) {
        if (getenv('SENTRY_DSN')) { try { \Sentry\captureException($e); } catch (\Throwable $t) {} }
        ApiResponder::jsonServerError('Failed to send email');
    }
}

/**
 * Replies to an email thread.
 */
function reply_to_email()
{
    $threadId = $_POST['threadId'] ?? null;
    $body = $_POST['body'] ?? '';

    $validation = ApiResponder::validateRequired(['threadId' => $threadId, 'body' => $body], ['threadId', 'body']);
    if (!$validation['valid']) {
        ApiResponder::jsonValidationError($validation['message']);
        return;
    }

    try {
        $client = get_google_client();
        $gmail = new Google_Service_Gmail($client);
        $user = 'me';

        // Get the thread to find the last message's details
        $thread = $gmail->users_threads->get($user, $threadId);
        $msgs = $thread->getMessages();
        if (!$msgs || count($msgs) === 0) {
            ApiResponder::jsonError('Thread has no messages', 400);
            return;
        }
        $lastMessage = $msgs[count($msgs) - 1];
        $lastPayload = $lastMessage->getPayload();
        $lastHeaders = $lastPayload->getHeaders();

        $to = '';
        $subject = '';
        $messageId = '';
        $references = '';

        foreach ($lastHeaders as $header) {
            if ($header->getName() == 'From') $to = $header->getValue();
            if ($header->getName() == 'Subject') $subject = $header->getValue();
            if ($header->getName() == 'Message-ID') $messageId = $header->getValue();
            if ($header->getName() == 'References') $references = $header->getValue();
        }
        
        // Ensure subject is a reply
        if (stripos($subject, 'Re:') !== 0) {
            $subject = 'Re: ' . $subject;
        }

        $message = new Google_Service_Gmail_Message();
        $rawMsgStr = "To: {$to}\r\n";
        $rawMsgStr .= "References: {$references} {$messageId}\r\n";
        $rawMsgStr .= "In-Reply-To: {$messageId}\r\n";
        $rawMsgStr .= "Subject: {$subject}\r\n";
        $rawMsgStr .= "\r\n";
        $rawMsgStr .= $body;

        $raw = base64_encode($rawMsgStr);
        $message->setRaw(rtrim(strtr($raw, '+/', '-_'), '='));
        $message->setThreadId($threadId);
        $gmail->users_messages->send($user, $message);

        ApiResponder::jsonSuccess(['status' => 'replied']);

    } catch (Exception $e) {
        if (getenv('SENTRY_DSN')) { try { \Sentry\captureException($e); } catch (\Throwable $t) {} }
        ApiResponder::jsonServerError('Failed to send reply');
    }
}

/**
 * Uses OpenAI to analyze an email thread and draft a reply.
 */
function draft_ai_reply()
{
    $threadId = $_POST['threadId'] ?? null;
    $goal = $_POST['goal'] ?? 'Understand the email and suggest a helpful reply.';
    $userName = $_POST['full_name'] ?? 'the user';


    $validation = ApiResponder::validateRequired(['threadId' => $threadId], ['threadId']);
    if (!$validation['valid']) {
        ApiResponder::jsonValidationError($validation['message']);
        return;
    }

    try {
        // 1. Fetch Email Thread
        $client = get_google_client();
        $gmail = new Google_Service_Gmail($client);
        $user = 'me';
        $thread = $gmail->users_threads->get($user, $threadId);
        $messages = $thread->getMessages();

        $emailContent = "";
        $senderEmail = '';
        foreach ($messages as $msg) {
            $payload = $msg->getPayload();
            $headers = $payload->getHeaders();
            $from = '';
            $date = '';
            foreach ($headers as $header) {
                if ($header->getName() == 'From') $from = $header->getValue();
                if ($header->getName() == 'Date') $date = $header->getValue();
            }
            if (empty($senderEmail)) { // Extract sender from the first email
                 preg_match('/<(.*?)>/', $from, $matches);
                 $senderEmail = $matches[1] ?? $from;
            }
            $body = get_body_from_payload($payload);
            $emailContent .= "From: {$from}\nDate: {$date}\n\n{$body}\n\n---\n\n";
        }

        // 2. Fetch Memory from Supabase
        $memory = fetch_memory($senderEmail);

        // 3. Construct OpenAI Prompt
        $prompt = "You are Donna, a highly capable AI assistant for {$userName}. Your mission is to manage this email inbox efficiently.\n\n";
        $prompt .= "Your current task for this email thread is: '{$goal}'.\n\n";
        $prompt .= "Here is what you remember about this contact ({$senderEmail}):\n{$memory}\n\n";
        $prompt .= "Analyze the following email thread and draft a concise, effective, and human-like reply to achieve the goal. Be ready to handle objections or escalate to a human if you are stuck. Do not include a subject line or greeting (like 'Hi John'), just write the body of the reply.\n\n";
        $prompt .= "EMAIL THREAD:\n==================\n{$emailContent}";

        // 4. Call OpenAI
        $draft = call_openai($prompt);

        // 5. Update Memory
        $new_memory_prompt = "Based on the following email thread and the AI's draft reply, extract any new key information about the contact or the situation that should be remembered for future interactions. Output only the new facts as a short, comma-separated list.\n\nTHREAD:\n{$emailContent}\n\nDRAFT:\n{$draft}";
        $new_memory = call_openai($new_memory_prompt);
        if (!empty($new_memory)) {
            save_memory($senderEmail, $memory . ", " . $new_memory);
        }

        // 6. Return Draft
        ApiResponder::jsonSuccess(['draft' => $draft]);

    } catch (Exception $e) {
        if (getenv('SENTRY_DSN')) { try { \Sentry\captureException($e); } catch (\Throwable $t) {} }
        ApiResponder::jsonServerError('Failed to draft AI reply');
    }
}

// --- HELPER FUNCTIONS ---

/**
 * Recursively decodes the body from a Gmail message payload.
 * @param Google_Service_Gmail_MessagePart $payload
 * @return string
 */
function get_body_from_payload($payload): string
{
    $body = '';
    if ($payload->getMimeType() == 'text/plain') {
        $body = $payload->getBody()->getData();
    } elseif ($payload->getMimeType() == 'text/html') {
        $body = $payload->getBody()->getData(); // Prefer plain text, but take html if it's all we have
    }

    if ($parts = $payload->getParts()) {
        foreach ($parts as $part) {
            $body .= get_body_from_payload($part);
        }
    }
    
    $normalized = strtr($body, '-_', '+/');
    $pad = strlen($normalized) % 4;
    if ($pad) {
        $normalized .= str_repeat('=', 4 - $pad);
    }
    return base64_decode($normalized);
}

/**
 * Calls the OpenAI API to get a completion.
 * @param string $prompt
 * @return string
 */
function call_openai(string $prompt): string
{
    $apiKey = getenv('OPENAI_API_KEY');
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => 'gpt-4o',
        'messages' => [['role' => 'user', 'content' => $prompt]],
        'max_tokens' => 500,
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    return $result['choices'][0]['message']['content'] ?? '';
}

/**
 * Fetches memory for a given contact from Supabase.
 * @param string $contactId (email address)
 * @return string
 */
function fetch_memory(string $contactId): string
{
    $supabaseUrl = getenv('SUPABASE_URL');
    $apiKey = getenv('SUPABASE_SERVICE_ROLE_KEY');
    
    $ch = curl_init("{$supabaseUrl}/rest/v1/donna_memory?select=memory_text&email=eq.{$contactId}&limit=1");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey,
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data[0]['memory_text'] ?? 'No previous interactions logged.';
}

/**
 * Saves memory for a given contact to Supabase.
 * @param string $contactId (email address)
 * @param string $memoryText
 */
function save_memory(string $contactId, string $memoryText)
{
    $supabaseUrl = getenv('SUPABASE_URL');
    $apiKey = getenv('SUPABASE_SERVICE_ROLE_KEY');

    $payload = json_encode(['email' => $contactId, 'memory_text' => $memoryText]);

    $ch = curl_init("{$supabaseUrl}/rest/v1/donna_memory?on_conflict=email");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey,
        'Prefer: resolution=merge-duplicates'
    ]);

    curl_exec($ch);
    curl_close($ch);
}
