<?php
/**
 * Chatbot Settings API - Manage chatbot configuration
 * Updated to use DataAccessInterface instead of direct file operations
 */

require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/lib/response-cache.php';
require_once __DIR__ . '/../lib/DataAccessFactory.php';

$auth = donna_cors_and_auth();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $dal = DataAccessFactory::create();

    switch ($method) {
        case 'GET':
            handleGetSettings($dal, $auth);
            break;

        case 'POST':
            handleUpdateSettings($dal, $auth);
            break;

        case 'PUT':
            handleUpdateSettings($dal, $auth);
            break;

        case 'DELETE':
            handleResetSettings($dal, $auth);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed',
                'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE']
            ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function handleGetSettings($dal, $auth) {
    respond_with_cache('chatbot_settings_' . $auth['user_id'], function() use ($dal, $auth) {
        try {
            // Get user-specific settings
            $userSettings = $dal->getUserMemory($auth['user_id'], 'chatbot_settings');

            // Get global/system settings
            $globalSettings = $dal->getUserMemory('system', 'chatbot_global_settings');

            // Merge settings with user settings taking precedence
            $defaultSettings = [
                'theme' => 'light',
                'language' => 'en',
                'auto_save' => true,
                'notifications' => true,
                'response_style' => 'professional',
                'max_context_length' => 4000,
                'temperature' => 0.7,
                'model' => 'gpt-4',
                'features' => [
                    'email_integration' => true,
                    'calendar_integration' => false,
                    'file_upload' => true,
                    'voice_input' => false
                ]
            ];

            $settings = array_merge(
                $defaultSettings,
                is_array($globalSettings) ? $globalSettings : [],
                is_array($userSettings) ? $userSettings : []
            );

            return [
                'success' => true,
                'data' => $settings,
                'user_id' => $auth['user_id'],
                'has_user_settings' => !empty($userSettings),
                'has_global_settings' => !empty($globalSettings)
            ];

        } catch (Exception $e) {
            // Fallback to file-based settings if database fails
            return handleGetSettingsFromFile($auth);
        }
    }, 300);
}

function handleGetSettingsFromFile($auth) {
    $settingsFile = __DIR__ . '/../data/chatbot_settings.json';

    if (file_exists($settingsFile)) {
        $json = file_get_contents($settingsFile);
        $settings = json_decode($json, true);

        return [
            'success' => true,
            'data' => $settings,
            'source' => 'file_fallback'
        ];
    } else {
        return [
            'success' => true,
            'data' => null,
            'source' => 'file_fallback'
        ];
    }
}

function handleUpdateSettings($dal, $auth) {
    invalidate_cache('chatbot_settings_' . $auth['user_id']);

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON input'
        ]);
        return;
    }

    try {
        // Validate settings
        $validatedSettings = validateSettings($input);

        // Store user-specific settings
        $success = $dal->setUserMemory(
            $auth['user_id'],
            'chatbot_settings',
            $validatedSettings,
            'chatbot_config'
        );

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => $validatedSettings
            ]);
        } else {
            throw new Exception('Failed to save settings to database');
        }

    } catch (Exception $e) {
        // Fallback to file storage
        try {
            $settingsFile = __DIR__ . '/../data/chatbot_settings.json';
            if (!file_exists(dirname($settingsFile))) {
                mkdir(dirname($settingsFile), 0777, true);
            }

            file_put_contents($settingsFile, json_encode($input, JSON_PRETTY_PRINT));

            echo json_encode([
                'success' => true,
                'message' => 'Settings updated successfully (file fallback)',
                'source' => 'file_fallback'
            ]);

        } catch (Exception $fileError) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to save settings',
                'message' => $e->getMessage(),
                'fallback_error' => $fileError->getMessage()
            ]);
        }
    }
}

function handleResetSettings($dal, $auth) {
    invalidate_cache('chatbot_settings_' . $auth['user_id']);

    try {
        $success = $dal->deleteUserMemory($auth['user_id'], 'chatbot_settings');

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Settings reset to defaults'
            ]);
        } else {
            throw new Exception('Failed to reset settings');
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to reset settings',
            'message' => $e->getMessage()
        ]);
    }
}

function validateSettings($settings) {
    $validated = [];

    // Legacy settings support (backward compatibility)
    if (isset($settings['theme'])) {
        $validated['theme'] = in_array($settings['theme'], ['light', 'dark', 'auto'])
            ? $settings['theme'] : 'light';
    }

    if (isset($settings['language'])) {
        $validated['language'] = preg_match('/^[a-z]{2}$/', $settings['language'])
            ? $settings['language'] : 'en';
    }

    // Validate Profile & Identity
    if (isset($settings['profile']) && is_array($settings['profile'])) {
        $validated['profile'] = [];
        $profile = $settings['profile'];
        
        if (isset($profile['donnaName'])) {
            $validated['profile']['donnaName'] = substr(trim($profile['donnaName']), 0, 100);
        }
        if (isset($profile['businessName'])) {
            $validated['profile']['businessName'] = substr(trim($profile['businessName']), 0, 200);
        }
        if (isset($profile['primaryContact'])) {
            $validated['profile']['primaryContact'] = substr(trim($profile['primaryContact']), 0, 200);
        }
        if (isset($profile['industry'])) {
            $validated['profile']['industry'] = substr(trim($profile['industry']), 0, 100);
        }
        if (isset($profile['vertical'])) {
            $allowedVerticals = ['hospitality', 'real_estate', 'professional_services'];
            $validated['profile']['vertical'] = in_array($profile['vertical'], $allowedVerticals)
                ? $profile['vertical'] : null;
        }
        if (isset($profile['timezone'])) {
            $validated['profile']['timezone'] = preg_match('/^[A-Za-z\/_]+$/', $profile['timezone'])
                ? $profile['timezone'] : 'America/New_York';
        }
        if (isset($profile['language'])) {
            $validated['profile']['language'] = preg_match('/^[a-z]{2}$/', $profile['language'])
                ? $profile['language'] : 'en';
        }
        if (isset($profile['brandVoice'])) {
            $allowedVoices = ['professional', 'friendly', 'donna', 'custom'];
            $validated['profile']['brandVoice'] = in_array($profile['brandVoice'], $allowedVoices)
                ? $profile['brandVoice'] : 'professional';
        }
        if (isset($profile['customBrandVoice'])) {
            $validated['profile']['customBrandVoice'] = substr(trim($profile['customBrandVoice']), 0, 2000);
        }
    }

    // Validate Behavior & Personality
    if (isset($settings['behavior']) && is_array($settings['behavior'])) {
        $validated['behavior'] = [];
        $behavior = $settings['behavior'];
        
        if (isset($behavior['responseStyle'])) {
            $allowed = ['concise', 'balanced', 'detailed'];
            $validated['behavior']['responseStyle'] = in_array($behavior['responseStyle'], $allowed)
                ? $behavior['responseStyle'] : 'balanced';
        }
        if (isset($behavior['confidenceLevel'])) {
            $allowed = ['conservative', 'balanced', 'assertive'];
            $validated['behavior']['confidenceLevel'] = in_array($behavior['confidenceLevel'], $allowed)
                ? $behavior['confidenceLevel'] : 'balanced';
        }
        if (isset($behavior['escalationThreshold'])) {
            $validated['behavior']['escalationThreshold'] = substr(trim($behavior['escalationThreshold']), 0, 50);
        }
        if (isset($behavior['autonomyLevel'])) {
            $allowed = ['inform', 'suggest', 'execute'];
            $validated['behavior']['autonomyLevel'] = in_array($behavior['autonomyLevel'], $allowed)
                ? $behavior['autonomyLevel'] : 'suggest';
        }
    }

    // Validate Knowledge & Memory
    if (isset($settings['knowledge']) && is_array($settings['knowledge'])) {
        $validated['knowledge'] = [];
        $knowledge = $settings['knowledge'];
        
        if (isset($knowledge['uploadedDocuments']) && is_array($knowledge['uploadedDocuments'])) {
            $validated['knowledge']['uploadedDocuments'] = array_slice($knowledge['uploadedDocuments'], 0, 100);
        }
        if (isset($knowledge['websiteSources']) && is_array($knowledge['websiteSources'])) {
            $validated['knowledge']['websiteSources'] = array_slice($knowledge['websiteSources'], 0, 50);
        }
        if (isset($knowledge['crmDataFeeds'])) {
            $validated['knowledge']['crmDataFeeds'] = (bool)$knowledge['crmDataFeeds'];
        }
        if (isset($knowledge['manualNotes'])) {
            $validated['knowledge']['manualNotes'] = substr(trim($knowledge['manualNotes']), 0, 10000);
        }
        if (isset($knowledge['memoryScope'])) {
            $allowed = ['conversation', 'user', 'global'];
            $validated['knowledge']['memoryScope'] = in_array($knowledge['memoryScope'], $allowed)
                ? $knowledge['memoryScope'] : 'user';
        }
    }

    // Validate Integrations (including Telnyx)
    if (isset($settings['integrations']) && is_array($settings['integrations'])) {
        $validated['integrations'] = [];
        $integrations = $settings['integrations'];
        
        // Validate each integration type
        $integrationTypes = ['email', 'calendar', 'crm', 'payments', 'forms', 'zapier'];
        foreach ($integrationTypes as $type) {
            if (isset($integrations[$type]) && is_array($integrations[$type])) {
                $validated['integrations'][$type] = [
                    'enabled' => isset($integrations[$type]['enabled']) ? (bool)$integrations[$type]['enabled'] : false,
                    'readPermission' => isset($integrations[$type]['readPermission']) ? (bool)$integrations[$type]['readPermission'] : true,
                    'writePermission' => isset($integrations[$type]['writePermission']) ? (bool)$integrations[$type]['writePermission'] : false,
                    'humanApprovalRequired' => isset($integrations[$type]['humanApprovalRequired']) ? (bool)$integrations[$type]['humanApprovalRequired'] : true,
                    'connectionStatus' => isset($integrations[$type]['connectionStatus']) ? $integrations[$type]['connectionStatus'] : 'disconnected',
                ];
                
                // Email-specific
                if ($type === 'email' && isset($integrations[$type]['provider'])) {
                    $allowed = ['smtp', 'gmail', 'exchange'];
                    $validated['integrations'][$type]['provider'] = in_array($integrations[$type]['provider'], $allowed)
                        ? $integrations[$type]['provider'] : 'gmail';
                }
                
                // CRM-specific
                if ($type === 'crm' && isset($integrations[$type]['provider'])) {
                    $allowed = ['salesforce', 'hubspot', 'custom', null];
                    $validated['integrations'][$type]['provider'] = in_array($integrations[$type]['provider'], $allowed, true)
                        ? $integrations[$type]['provider'] : null;
                }
            }
        }
        
        // Validate Telnyx settings
        if (isset($integrations['telnyx']) && is_array($integrations['telnyx'])) {
            $validated['integrations']['telnyx'] = [];
            $telnyx = $integrations['telnyx'];
            
            // Voice settings
            if (isset($telnyx['voice']) && is_array($telnyx['voice'])) {
                $validated['integrations']['telnyx']['voice'] = [
                    'apiKey' => isset($telnyx['voice']['apiKey']) ? substr(trim($telnyx['voice']['apiKey']), 0, 200) : null,
                    'connectionId' => isset($telnyx['voice']['connectionId']) ? substr(trim($telnyx['voice']['connectionId']), 0, 100) : null,
                    'phoneNumber' => isset($telnyx['voice']['phoneNumber']) ? substr(trim($telnyx['voice']['phoneNumber']), 0, 20) : null,
                    'webhookUrl' => isset($telnyx['voice']['webhookUrl']) ? filter_var($telnyx['voice']['webhookUrl'], FILTER_VALIDATE_URL) : null,
                    'callRecording' => isset($telnyx['voice']['callRecording']) ? (bool)$telnyx['voice']['callRecording'] : false,
                ];
            }
            
            // SMS settings
            if (isset($telnyx['sms']) && is_array($telnyx['sms'])) {
                $validated['integrations']['telnyx']['sms'] = [
                    'messagingProfileId' => isset($telnyx['sms']['messagingProfileId']) ? substr(trim($telnyx['sms']['messagingProfileId']), 0, 100) : null,
                    'phoneNumber' => isset($telnyx['sms']['phoneNumber']) ? substr(trim($telnyx['sms']['phoneNumber']), 0, 20) : null,
                    'deliveryStatusTracking' => isset($telnyx['sms']['deliveryStatusTracking']) ? (bool)$telnyx['sms']['deliveryStatusTracking'] : true,
                    'mmsSupport' => isset($telnyx['sms']['mmsSupport']) ? (bool)$telnyx['sms']['mmsSupport'] : false,
                    'webhookUrl' => isset($telnyx['sms']['webhookUrl']) ? filter_var($telnyx['sms']['webhookUrl'], FILTER_VALIDATE_URL) : null,
                ];
            }
            
            $validated['integrations']['telnyx']['connectionStatus'] = isset($telnyx['connectionStatus'])
                ? $telnyx['connectionStatus'] : 'disconnected';
        }
    }

    // Validate Communication Channels
    if (isset($settings['channels']) && is_array($settings['channels'])) {
        $validated['channels'] = [];
        $channels = $settings['channels'];
        
        $channelTypes = ['websiteChat', 'sms', 'email', 'voice', 'dashboard'];
        foreach ($channelTypes as $type) {
            if (isset($channels[$type]) && is_array($channels[$type])) {
                $validated['channels'][$type] = [
                    'enabled' => isset($channels[$type]['enabled']) ? (bool)$channels[$type]['enabled'] : false,
                    'toneOverride' => isset($channels[$type]['toneOverride']) ? substr(trim($channels[$type]['toneOverride']), 0, 500) : null,
                    'autoReplyRules' => isset($channels[$type]['autoReplyRules']) ? substr(trim($channels[$type]['autoReplyRules']), 0, 2000) : '',
                    'escalationPath' => isset($channels[$type]['escalationPath']) ? substr(trim($channels[$type]['escalationPath']), 0, 500) : '',
                    'signature' => isset($channels[$type]['signature']) ? substr(trim($channels[$type]['signature']), 0, 500) : '',
                ];
            }
        }
        
        // WebRTC settings
        if (isset($channels['webrtc']) && is_array($channels['webrtc'])) {
            $validated['channels']['webrtc'] = [
                'vadEnabled' => isset($channels['webrtc']['vadEnabled']) ? (bool)$channels['webrtc']['vadEnabled'] : true,
                'reconnection' => [
                    'maxRetries' => isset($channels['webrtc']['reconnection']['maxRetries'])
                        ? max(1, min(10, (int)$channels['webrtc']['reconnection']['maxRetries'])) : 5,
                    'backoffStrategy' => isset($channels['webrtc']['reconnection']['backoffStrategy'])
                        ? (in_array($channels['webrtc']['reconnection']['backoffStrategy'], ['exponential', 'linear'])
                            ? $channels['webrtc']['reconnection']['backoffStrategy'] : 'exponential') : 'exponential',
                    'timeout' => isset($channels['webrtc']['reconnection']['timeout'])
                        ? max(1000, min(60000, (int)$channels['webrtc']['reconnection']['timeout'])) : 30000,
                ],
            ];
        }
    }

    // Validate Automations & Workflows
    if (isset($settings['automations']) && is_array($settings['automations'])) {
        $validated['automations'] = [];
        if (isset($settings['automations']['workflows']) && is_array($settings['automations']['workflows'])) {
            $validated['automations']['workflows'] = array_slice($settings['automations']['workflows'], 0, 50);
        }
        if (isset($settings['automations']['verticalSpecificTemplates'])) {
            $validated['automations']['verticalSpecificTemplates'] = (bool)$settings['automations']['verticalSpecificTemplates'];
        }
    }

    // Validate Privacy & Security
    if (isset($settings['privacy']) && is_array($settings['privacy'])) {
        $validated['privacy'] = [];
        $privacy = $settings['privacy'];
        
        if (isset($privacy['dataRetentionPolicy'])) {
            $allowed = ['30days', '90days', '1year', 'indefinite', 'custom'];
            $validated['privacy']['dataRetentionPolicy'] = in_array($privacy['dataRetentionPolicy'], $allowed)
                ? $privacy['dataRetentionPolicy'] : '90days';
        }
        if (isset($privacy['accessLogsEnabled'])) {
            $validated['privacy']['accessLogsEnabled'] = (bool)$privacy['accessLogsEnabled'];
        }
        if (isset($privacy['compliance']) && is_array($privacy['compliance'])) {
            $validated['privacy']['compliance'] = [
                'gdpr' => isset($privacy['compliance']['gdpr']) ? (bool)$privacy['compliance']['gdpr'] : false,
                'ccpa' => isset($privacy['compliance']['ccpa']) ? (bool)$privacy['compliance']['ccpa'] : false,
                'hipaa' => isset($privacy['compliance']['hipaa']) ? (bool)$privacy['compliance']['hipaa'] : false,
            ];
        }
        if (isset($privacy['aiUsageTransparencyLog'])) {
            $validated['privacy']['aiUsageTransparencyLog'] = (bool)$privacy['aiUsageTransparencyLog'];
        }
    }

    // Validate Notifications
    if (isset($settings['notifications']) && is_array($settings['notifications'])) {
        $validated['notifications'] = [];
        $notificationTypes = ['escalationAlerts', 'taskCompletion', 'errorsFailures', 'newPatterns', 'weeklySummaries'];
        foreach ($notificationTypes as $type) {
            if (isset($settings['notifications'][$type]) && is_array($settings['notifications'][$type])) {
                $validated['notifications'][$type] = [
                    'enabled' => isset($settings['notifications'][$type]['enabled']) ? (bool)$settings['notifications'][$type]['enabled'] : false,
                    'deliveryMethods' => isset($settings['notifications'][$type]['deliveryMethods']) && is_array($settings['notifications'][$type]['deliveryMethods'])
                        ? array_intersect($settings['notifications'][$type]['deliveryMethods'], ['email', 'sms', 'dashboard', 'silent'])
                        : [],
                ];
            }
        }
        if (isset($settings['notifications']['telnyxSMSDelivery'])) {
            $validated['notifications']['telnyxSMSDelivery'] = (bool)$settings['notifications']['telnyxSMSDelivery'];
        }
    }

    // Validate Billing & Plan
    if (isset($settings['billing']) && is_array($settings['billing'])) {
        $validated['billing'] = [];
        $billing = $settings['billing'];
        
        if (isset($billing['planTier'])) {
            $allowed = ['free', 'pro', 'enterprise'];
            $validated['billing']['planTier'] = in_array($billing['planTier'], $allowed)
                ? $billing['planTier'] : 'free';
        }
    }

    // Validate Advanced / Developer
    if (isset($settings['advanced']) && is_array($settings['advanced'])) {
        $validated['advanced'] = [];
        $advanced = $settings['advanced'];
        
        if (isset($advanced['sandboxMode'])) {
            $validated['advanced']['sandboxMode'] = (bool)$advanced['sandboxMode'];
        }
        if (isset($advanced['debugLogsEnabled'])) {
            $validated['advanced']['debugLogsEnabled'] = (bool)$advanced['debugLogsEnabled'];
        }
        
        // Performance settings
        if (isset($advanced['performance']) && is_array($advanced['performance'])) {
            $validated['advanced']['performance'] = [];
            if (isset($advanced['performance']['redis']) && is_array($advanced['performance']['redis'])) {
                $validated['advanced']['performance']['redis'] = [
                    'enabled' => isset($advanced['performance']['redis']['enabled']) ? (bool)$advanced['performance']['redis']['enabled'] : false,
                    'cacheTTL' => isset($advanced['performance']['redis']['cacheTTL'])
                        ? max(60, min(86400, (int)$advanced['performance']['redis']['cacheTTL'])) : 3600,
                ];
            }
        }
        
        // Analytics settings
        if (isset($advanced['analytics']) && is_array($advanced['analytics'])) {
            $validated['advanced']['analytics'] = [];
            if (isset($advanced['analytics']['tracing']) && is_array($advanced['analytics']['tracing'])) {
                $validated['advanced']['analytics']['tracing'] = [
                    'enabled' => isset($advanced['analytics']['tracing']['enabled']) ? (bool)$advanced['analytics']['tracing']['enabled'] : false,
                    'samplingRate' => isset($advanced['analytics']['tracing']['samplingRate'])
                        ? max(0, min(100, (int)$advanced['analytics']['tracing']['samplingRate'])) : 10,
                ];
            }
            if (isset($advanced['analytics']['sentry']) && is_array($advanced['analytics']['sentry'])) {
                $validated['advanced']['analytics']['sentry'] = [
                    'errorTracking' => isset($advanced['analytics']['sentry']['errorTracking']) ? (bool)$advanced['analytics']['sentry']['errorTracking'] : true,
                    'performanceMonitoring' => isset($advanced['analytics']['sentry']['performanceMonitoring']) ? (bool)$advanced['analytics']['sentry']['performanceMonitoring'] : true,
                ];
            }
        }
    }

    // Preserve any other top-level settings for backward compatibility
    $legacySettings = ['theme', 'language', 'auto_save', 'notifications', 'response_style', 
                       'max_context_length', 'temperature', 'model', 'features', 
                       'custom_prompts', 'shortcuts'];
    foreach ($legacySettings as $setting) {
        if (isset($settings[$setting]) && !isset($validated[$setting])) {
            $validated[$setting] = $settings[$setting];
        }
    }

    return $validated;
}
?>

