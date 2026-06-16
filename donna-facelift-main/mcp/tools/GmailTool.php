<?php
require_once __DIR__ . '/../MCPTool.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Google\Client;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;

/**
 * Gmail API MCP Tool
 * Handles Gmail integration using Google Workspace OAuth2
 */
class GmailTool extends BaseMCPTool {
    private $client;
    private $service;
    
    public function __construct() {
        parent::__construct([
            'name' => 'gmail',
            'description' => 'Access Gmail using Google Workspace API with OAuth2 authentication',
            'category' => 'communication',
            'version' => '1.0.0',
            'parameters' => [
                'action' => [
                    'type' => 'string',
                    'required' => true,
                    'description' => 'Action to perform: list, read, send, search, mark_read',
                    'enum' => ['list', 'read', 'send', 'search', 'mark_read']
                ],
                'access_token' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'OAuth2 access token for user authentication'
                ],
                'limit' => [
                    'type' => 'integer',
                    'required' => false,
                    'description' => 'Maximum number of emails to return',
                    'default' => 20
                ],
                'unread_only' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Only return unread emails',
                    'default' => false
                ],
                'message_id' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Specific message ID to read'
                ],
                'query' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Gmail search query'
                ],
                'to' => [
                    'type' => 'email',
                    'required' => false,
                    'description' => 'Recipient email address for sending'
                ],
                'subject' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Email subject for sending'
                ],
                'body' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Email body for sending'
                ]
            ]
        ]);
    }
    
    public function execute($parameters, $context = []) {
        $action = $parameters['action'];
        
        try {
            $this->initializeGoogleClient($parameters, $context);
            
            switch ($action) {
                case 'list':
                    return $this->listEmails($parameters, $context);
                    
                case 'read':
                    return $this->readEmail($parameters, $context);
                    
                case 'send':
                    return $this->sendEmail($parameters, $context);
                    
                case 'search':
                    return $this->searchEmails($parameters, $context);
                    
                case 'mark_read':
                    return $this->markAsRead($parameters, $context);
                    
                default:
                    throw new Exception("Unknown Gmail action: $action");
            }
            
        } catch (Exception $e) {
            $this->log('error', 'Gmail tool execution failed', [
                'action' => $action,
                'error' => $e->getMessage()
            ]);
            
            return $this->createResponse(false, null, $e->getMessage());
        }
    }
    
    private function initializeGoogleClient($parameters, $context) {
        $this->client = new Client();

        // Priority order: Access Token > Service Account JSON > Service Account Env > OAuth2 File

        if (isset($parameters['access_token'])) {
            // Use OAuth2 access token
            $this->client->setAccessToken($parameters['access_token']);
            $this->log('info', 'Using OAuth2 access token for authentication');

        } elseif ($this->setupServiceAccountFromEnv()) {
            // Use service account from environment variables
            $this->log('info', 'Using service account from environment variables');

        } elseif ($serviceAccountPath = $_ENV['GOOGLE_SERVICE_ACCOUNT_PATH'] ?? null) {
            // Use service account JSON file
            if (file_exists($serviceAccountPath)) {
                $this->client->setAuthConfig($serviceAccountPath);
                $this->client->setScopes([Gmail::GMAIL_READONLY, Gmail::GMAIL_SEND, Gmail::GMAIL_MODIFY]);
                $this->client->setSubject($_ENV['GMAIL_USER'] ?? 'donna@bemdonna.com');
                $this->log('info', 'Using service account JSON file');
            } else {
                throw new Exception('Service account file not found: ' . $serviceAccountPath);
            }

        } elseif ($credentialsPath = $_ENV['GOOGLE_CREDENTIALS_PATH'] ?? null) {
            // Use OAuth2 credentials file (but this will cause the warnings we saw)
            if (file_exists($credentialsPath)) {
                $this->client->setAuthConfig($credentialsPath);
                $this->client->setScopes([Gmail::GMAIL_READONLY, Gmail::GMAIL_SEND, Gmail::GMAIL_MODIFY]);
                $this->client->setRedirectUri('https://donna-interactive-1.onrender.com/api/oauth2.php?action=callback');
                $this->log('info', 'Using OAuth2 credentials file');
            } else {
                throw new Exception('Credentials file not found: ' . $credentialsPath);
            }

        } else {
            throw new Exception('No Google authentication method configured. Please set up service account or OAuth2 credentials.');
        }

        $this->service = new Gmail($this->client);
    }

    private function setupServiceAccountFromEnv() {
        // Check if service account credentials are provided via environment variables
        $serviceAccountJson = $_ENV['GOOGLE_SERVICE_ACCOUNT_JSON'] ?? null;
        $serviceAccountEmail = $_ENV['GOOGLE_SERVICE_ACCOUNT_EMAIL'] ?? null;
        $privateKey = $_ENV['GOOGLE_PRIVATE_KEY'] ?? null;
        $projectId = $_ENV['GOOGLE_CLOUD_PROJECT'] ?? null;

        if ($serviceAccountJson) {
            // Use complete JSON credentials from environment
            try {
                $credentials = json_decode($serviceAccountJson, true);
                if (!$credentials) {
                    throw new Exception('Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON');
                }

                $this->client->setAuthConfig($credentials);
                $this->client->setScopes([Gmail::GMAIL_READONLY, Gmail::GMAIL_SEND, Gmail::GMAIL_MODIFY]);
                $this->client->setSubject($_ENV['GMAIL_USER'] ?? 'donna@bemdonna.com');

                return true;

            } catch (Exception $e) {
                $this->log('warning', 'Service account JSON setup failed', ['error' => $e->getMessage()]);
                return false;
            }
        }

        if ($serviceAccountEmail && $privateKey && $projectId) {
            // Build service account config from individual environment variables
            try {
                $credentials = [
                    'type' => 'service_account',
                    'project_id' => $projectId,
                    'private_key_id' => 'env-key',
                    'private_key' => str_replace('\\n', "\n", $privateKey),
                    'client_email' => $serviceAccountEmail,
                    'client_id' => '',
                    'auth_uri' => 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri' => 'https://oauth2.googleapis.com/token',
                    'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
                    'client_x509_cert_url' => "https://www.googleapis.com/robot/v1/metadata/x509/{$serviceAccountEmail}"
                ];

                $this->client->setAuthConfig($credentials);
                $this->client->setScopes([Gmail::GMAIL_READONLY, Gmail::GMAIL_SEND, Gmail::GMAIL_MODIFY]);
                $this->client->setSubject($_ENV['GMAIL_USER'] ?? 'donna@bemdonna.com');

                return true;

            } catch (Exception $e) {
                $this->log('warning', 'Service account env setup failed', ['error' => $e->getMessage()]);
                return false;
            }
        }

        return false;
    }
    
    private function listEmails($parameters, $context) {
        $limit = $parameters['limit'] ?? 20;
        $unreadOnly = $parameters['unread_only'] ?? false;
        
        $query = $unreadOnly ? 'is:unread' : '';
        
        $optParams = [
            'maxResults' => $limit,
            'q' => $query
        ];
        
        $messages = $this->service->users_messages->listUsersMessages('me', $optParams);
        
        if (!$messages->getMessages()) {
            return $this->createResponse(true, [
                'emails' => [],
                'count' => 0,
                'message' => 'No emails found'
            ]);
        }
        
        $emailList = [];
        foreach ($messages->getMessages() as $message) {
            $msg = $this->service->users_messages->get('me', $message->getId(), ['format' => 'metadata']);
            $headers = $msg->getPayload()->getHeaders();
            
            $from = $subject = $date = '';
            foreach ($headers as $header) {
                switch ($header->getName()) {
                    case 'From':
                        $from = $header->getValue();
                        break;
                    case 'Subject':
                        $subject = $header->getValue();
                        break;
                    case 'Date':
                        $date = $header->getValue();
                        break;
                }
            }
            
            $emailList[] = [
                'id' => $message->getId(),
                'thread_id' => $message->getThreadId(),
                'from' => $from,
                'from_email' => $this->extractEmailAddress($from),
                'subject' => $subject,
                'date' => date('Y-m-d H:i:s', strtotime($date)),
                'unread' => in_array('UNREAD', $msg->getLabelIds() ?? []),
                'preview' => $this->getEmailPreview($message->getId())
            ];
        }
        
        return $this->createResponse(true, [
            'emails' => $emailList,
            'count' => count($emailList),
            'total_estimated' => $messages->getResultSizeEstimate()
        ]);
    }
    
    private function readEmail($parameters, $context) {
        $messageId = $parameters['message_id'];
        
        if (!$messageId) {
            throw new Exception('Message ID required for reading email');
        }
        
        $message = $this->service->users_messages->get('me', $messageId, ['format' => 'full']);
        $headers = $message->getPayload()->getHeaders();
        
        $from = $to = $subject = $date = '';
        foreach ($headers as $header) {
            switch ($header->getName()) {
                case 'From':
                    $from = $header->getValue();
                    break;
                case 'To':
                    $to = $header->getValue();
                    break;
                case 'Subject':
                    $subject = $header->getValue();
                    break;
                case 'Date':
                    $date = $header->getValue();
                    break;
            }
        }
        
        $body = $this->getEmailBody($message->getPayload());
        
        return $this->createResponse(true, [
            'email' => [
                'id' => $messageId,
                'thread_id' => $message->getThreadId(),
                'from' => $from,
                'from_email' => $this->extractEmailAddress($from),
                'to' => $to,
                'subject' => $subject,
                'date' => date('Y-m-d H:i:s', strtotime($date)),
                'body' => $body,
                'labels' => $message->getLabelIds()
            ]
        ]);
    }
    
    private function sendEmail($parameters, $context) {
        $to = $parameters['to'];
        $subject = $parameters['subject'];
        $body = $parameters['body'];
        
        if (!$to || !$subject || !$body) {
            throw new Exception('To, subject, and body are required for sending email');
        }
        
        $rawMessage = $this->createRawMessage($to, $subject, $body);
        $message = new Message();
        $message->setRaw($rawMessage);
        
        $result = $this->service->users_messages->send('me', $message);
        
        return $this->createResponse(true, [
            'message_id' => $result->getId(),
            'thread_id' => $result->getThreadId(),
            'to' => $to,
            'subject' => $subject,
            'message' => "Email sent successfully to $to"
        ]);
    }
    
    private function searchEmails($parameters, $context) {
        $query = $parameters['query'] ?? '';
        $limit = $parameters['limit'] ?? 20;
        
        if (empty($query)) {
            return $this->listEmails($parameters, $context);
        }
        
        $optParams = [
            'maxResults' => $limit,
            'q' => $query
        ];
        
        $messages = $this->service->users_messages->listUsersMessages('me', $optParams);
        
        if (!$messages->getMessages()) {
            return $this->createResponse(true, [
                'emails' => [],
                'count' => 0,
                'query' => $query,
                'message' => 'No emails found matching search criteria'
            ]);
        }
        
        $emailList = [];
        foreach ($messages->getMessages() as $message) {
            $msg = $this->service->users_messages->get('me', $message->getId(), ['format' => 'metadata']);
            $headers = $msg->getPayload()->getHeaders();
            
            $from = $subject = $date = '';
            foreach ($headers as $header) {
                switch ($header->getName()) {
                    case 'From':
                        $from = $header->getValue();
                        break;
                    case 'Subject':
                        $subject = $header->getValue();
                        break;
                    case 'Date':
                        $date = $header->getValue();
                        break;
                }
            }
            
            $emailList[] = [
                'id' => $message->getId(),
                'from' => $from,
                'subject' => $subject,
                'date' => date('Y-m-d H:i:s', strtotime($date)),
                'preview' => $this->getEmailPreview($message->getId())
            ];
        }
        
        return $this->createResponse(true, [
            'emails' => $emailList,
            'count' => count($emailList),
            'query' => $query
        ]);
    }
    
    private function markAsRead($parameters, $context) {
        $messageId = $parameters['message_id'];
        
        if (!$messageId) {
            throw new Exception('Message ID required');
        }
        
        $modifyRequest = new \Google\Service\Gmail\ModifyMessageRequest();
        $modifyRequest->setRemoveLabelIds(['UNREAD']);
        
        $result = $this->service->users_messages->modify('me', $messageId, $modifyRequest);
        
        return $this->createResponse(true, [
            'message_id' => $messageId,
            'marked_read' => true
        ]);
    }
    
    private function getEmailBody($payload) {
        $body = '';
        
        if ($payload->getParts()) {
            foreach ($payload->getParts() as $part) {
                if ($part->getMimeType() === 'text/plain' || $part->getMimeType() === 'text/html') {
                    $data = $part->getBody()->getData();
                    $body = base64url_decode($data);
                    break;
                }
            }
        } else {
            $data = $payload->getBody()->getData();
            $body = base64url_decode($data);
        }
        
        return $body;
    }
    
    private function getEmailPreview($messageId, $length = 150) {
        try {
            $message = $this->service->users_messages->get('me', $messageId, ['format' => 'full']);
            $body = $this->getEmailBody($message->getPayload());
            $preview = strip_tags($body);
            $preview = preg_replace('/\s+/', ' ', $preview);
            return substr(trim($preview), 0, $length) . (strlen($preview) > $length ? '...' : '');
        } catch (Exception $e) {
            return 'Preview unavailable';
        }
    }
    
    private function extractEmailAddress($fromString) {
        if (preg_match('/<(.+?)>/', $fromString, $matches)) {
            return $matches[1];
        }
        return trim($fromString);
    }
    
    private function createRawMessage($to, $subject, $body) {
        $from = $_ENV['GMAIL_USER'] ?? 'donna@bemdonna.com';
        
        $rawMessage = "From: $from\r\n";
        $rawMessage .= "To: $to\r\n";
        $rawMessage .= "Subject: $subject\r\n";
        $rawMessage .= "Content-Type: text/html; charset=utf-8\r\n";
        $rawMessage .= "\r\n";
        $rawMessage .= $body;
        
        return base64url_encode($rawMessage);
    }
    
    protected function getCapabilities() {
        return array_merge(parent::getCapabilities(), [
            'oauth2_support' => true,
            'service_account_support' => true,
            'gmail_api' => true,
            'real_inbox_access' => true,
            'send_emails' => true,
            'search_support' => true,
            'thread_support' => true
        ]);
    }
}

// Helper function for base64url encoding/decoding
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}
?>
