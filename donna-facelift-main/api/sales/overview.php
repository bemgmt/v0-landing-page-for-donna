<?php
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../lib/ApiResponder.php';
$auth = donna_cors_and_auth();
ApiResponder::initTraceId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = [
        'contacts' => [],
        'leads' => [],
        'stats' => [
            'total_contacts' => 0,
            'hot_leads' => 0,
            'conversion_rate' => 0.0
        ]
    ];
    ApiResponder::jsonSuccess($data);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $input['action'] ?? '';

// Load mail helper for actions that need it
require_once __DIR__ . '/../lib/mail.php';
if (function_exists('donna_load_env')) { donna_load_env(); }

switch ($action) {
    case 'send_email':
        $email = $input['email'] ?? [];
        $to = trim($email['to'] ?? '');
        $subject = trim($email['subject'] ?? '');
        $body = trim($email['body'] ?? '');
        $from = trim($email['from'] ?? (getenv('EMAIL_FROM') ?: ''));
        $from_name = trim($email['from_name'] ?? (getenv('EMAIL_FROM_NAME') ?: 'DONNA'));

        $validation = ApiResponder::validateRequired(['to' => $to, 'subject' => $subject, 'body' => $body], ['to', 'subject', 'body']);
        if (!$validation['valid']) {
            ApiResponder::jsonValidationError($validation['message']);
        }

        try {
            // Prefer PHPMailer when available; fallback to raw SMTP
            if (function_exists('donna_phpmailer_send')) {
                $res = donna_phpmailer_send(['to'=>$to,'subject'=>$subject,'body'=>$body,'from'=>$from,'from_name'=>$from_name]);
                if (!$res['success'] && function_exists('donna_smtp_send')) {
                    $res = donna_smtp_send(['to'=>$to,'subject'=>$subject,'body'=>$body,'from'=>$from,'from_name'=>$from_name]);
                }
            } elseif (function_exists('donna_smtp_send')) {
                $res = donna_smtp_send(['to'=>$to,'subject'=>$subject,'body'=>$body,'from'=>$from,'from_name'=>$from_name]);
            } else {
                $res = ['success'=>false,'error'=>'mail helper missing'];
            }

            if ($res['success']) {
                ApiResponder::jsonSuccess(['message' => 'Email sent', 'to' => $to]);
            } else {
                ApiResponder::jsonError($res['error'] ?? 'send failed');
            }
        } catch (Exception $e) {
            ApiResponder::jsonServerError('Email sending failed: ' . $e->getMessage());
        }

    case 'send_text':
        $sms = $input['sms'] ?? [];
        $to = trim($sms['to'] ?? '');
        $message = trim($sms['message'] ?? '');

        $validation = ApiResponder::validateRequired(['to' => $to, 'message' => $message], ['to', 'message']);
        if (!$validation['valid']) {
            ApiResponder::jsonValidationError($validation['message']);
        }

        try {
            // Load provider factory
            require_once __DIR__ . '/../lib/ProviderFactory.php';
            
            $messagingProvider = ProviderFactory::createMessagingProvider();
            
            // Validate phone number
            if (!$messagingProvider->validatePhoneNumber($to)) {
                ApiResponder::jsonValidationError('Invalid phone number format. Please use E.164 format (e.g., +1234567890)');
            }
            
            // Format phone number
            $formattedTo = $messagingProvider->formatPhoneNumber($to);
            
            // Send SMS
            $result = $messagingProvider->sendSMS($formattedTo, $message, [
                'webhook_url' => getenv('TELNYX_WEBHOOK_URL') ?: null
            ]);
            
            if ($result['success']) {
                ApiResponder::jsonSuccess([
                    'message' => 'SMS sent successfully',
                    'to' => $formattedTo,
                    'message_id' => $result['message_id'] ?? null,
                    'status' => $result['status'] ?? 'queued'
                ]);
            } else {
                ApiResponder::jsonError($result['error'] ?? 'SMS sending failed');
            }
        } catch (Exception $e) {
            ApiResponder::jsonServerError('SMS sending failed: ' . $e->getMessage());
        }
        break;

    default:
        ApiResponder::jsonSuccess(['action' => $action]);
}

