<?php
require_once __DIR__ . '/../MCPTool.php';
require_once __DIR__ . '/../../logic/email_logic.php';

/**
 * Email MCP Tool
 * Handles email sending, parsing, and management
 */
class EmailTool extends BaseMCPTool {
    private $emailHandler;
    
    public function __construct() {
        parent::__construct([
            'name' => 'email',
            'description' => 'Send emails, parse email commands, and manage email communications',
            'category' => 'communication',
            'version' => '1.0.0',
            'parameters' => [
                'action' => [
                    'type' => 'string',
                    'required' => true,
                    'description' => 'Action to perform: send, parse, test_connection',
                    'enum' => ['send', 'parse', 'test_connection']
                ],
                'to' => [
                    'type' => 'email',
                    'required' => false,
                    'description' => 'Recipient email address'
                ],
                'subject' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Email subject'
                ],
                'body' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Email body content'
                ],
                'message' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Natural language email command to parse'
                ],
                'html' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Whether email body is HTML',
                    'default' => true
                ]
            ]
        ]);
        
        $this->emailHandler = new EmailHandler();
    }
    
    public function execute($parameters, $context = []) {
        $action = $parameters['action'];
        
        try {
            switch ($action) {
                case 'send':
                    return $this->sendEmail($parameters, $context);
                    
                case 'parse':
                    return $this->parseEmailCommand($parameters, $context);
                    
                case 'test_connection':
                    return $this->testConnection($context);
                    
                default:
                    throw new Exception("Unknown email action: $action");
            }
            
        } catch (Exception $e) {
            $this->log('error', 'Email tool execution failed', [
                'action' => $action,
                'parameters' => $parameters,
                'error' => $e->getMessage()
            ]);
            
            return $this->createResponse(false, null, $e->getMessage());
        }
    }
    
    private function sendEmail($parameters, $context) {
        // Validate required parameters for sending
        $required = ['to', 'subject', 'body'];
        foreach ($required as $param) {
            if (empty($parameters[$param])) {
                throw new Exception("Missing required parameter for email sending: $param");
            }
        }
        
        $to = $parameters['to'];
        $subject = $parameters['subject'];
        $body = $parameters['body'];
        $isHTML = $parameters['html'] ?? true;
        
        $result = $this->emailHandler->sendEmail($to, $subject, $body, $isHTML);
        
        if ($result['success']) {
            $this->log('info', 'Email sent successfully', [
                'to' => $to,
                'subject' => $subject,
                'session_id' => $context['session_id'] ?? null
            ]);
            
            // Update context with email history
            $contextUpdate = [
                'last_email_sent' => [
                    'to' => $to,
                    'subject' => $subject,
                    'timestamp' => date('Y-m-d H:i:s'),
                    'success' => true
                ],
                'email_count' => ($context['email_count'] ?? 0) + 1
            ];
            
            return $this->createResponse(true, $result, null, $contextUpdate);
        } else {
            $this->log('error', 'Email sending failed', [
                'to' => $to,
                'subject' => $subject,
                'error' => $result['error'],
                'session_id' => $context['session_id'] ?? null
            ]);
            
            return $this->createResponse(false, null, $result['error']);
        }
    }
    
    private function parseEmailCommand($parameters, $context) {
        if (empty($parameters['message'])) {
            throw new Exception("Missing message parameter for email parsing");
        }
        
        $message = $parameters['message'];
        $parsed = $this->emailHandler->parseEmailCommand($message);
        
        $this->log('info', 'Email command parsed', [
            'message' => $message,
            'parsed' => $parsed,
            'session_id' => $context['session_id'] ?? null
        ]);
        
        // Check if we have enough info to send email
        $canSend = !empty($parsed['to']) && !empty($parsed['subject']) && !empty($parsed['body']);
        
        $response = [
            'parsed' => $parsed,
            'can_send' => $canSend,
            'missing_fields' => []
        ];
        
        if (!$canSend) {
            if (empty($parsed['to'])) $response['missing_fields'][] = 'recipient email';
            if (empty($parsed['subject'])) $response['missing_fields'][] = 'subject';
            if (empty($parsed['body'])) $response['missing_fields'][] = 'message content';
        }
        
        return $this->createResponse(true, $response);
    }
    
    private function testConnection($context) {
        $result = $this->emailHandler->testConnection();
        
        $this->log('info', 'Email connection tested', [
            'result' => $result,
            'session_id' => $context['session_id'] ?? null
        ]);
        
        return $this->createResponse($result['success'], $result, 
            $result['success'] ? null : $result['error']);
    }
    
    protected function getCapabilities() {
        return array_merge(parent::getCapabilities(), [
            'async' => false,
            'streaming' => false,
            'context_aware' => true,
            'stateful' => true,
            'actions' => ['send', 'parse', 'test_connection'],
            'supports_html' => true,
            'supports_attachments' => false, // Could be added later
            'smtp_provider' => 'SiteGround'
        ]);
    }
}

/**
 * Contact Management MCP Tool
 */
class ContactTool extends BaseMCPTool {
    public function __construct() {
        parent::__construct([
            'name' => 'contact',
            'description' => 'Manage contacts, search contact database, and handle contact operations',
            'category' => 'data',
            'version' => '1.0.0',
            'parameters' => [
                'action' => [
                    'type' => 'string',
                    'required' => true,
                    'description' => 'Action to perform: search, add, update, delete, list',
                    'enum' => ['search', 'add', 'update', 'delete', 'list']
                ],
                'query' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Search query for finding contacts'
                ],
                'email' => [
                    'type' => 'email',
                    'required' => false,
                    'description' => 'Contact email address'
                ],
                'name' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Contact name'
                ],
                'phone' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Contact phone number'
                ],
                'company' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Contact company'
                ],
                'limit' => [
                    'type' => 'integer',
                    'required' => false,
                    'description' => 'Maximum number of results to return',
                    'default' => 10
                ]
            ]
        ]);
    }
    
    public function execute($parameters, $context = []) {
        $action = $parameters['action'];
        
        try {
            switch ($action) {
                case 'search':
                    return $this->searchContacts($parameters, $context);
                    
                case 'add':
                    return $this->addContact($parameters, $context);
                    
                case 'list':
                    return $this->listContacts($parameters, $context);
                    
                default:
                    return $this->createResponse(false, null, "Contact action '$action' not yet implemented");
            }
            
        } catch (Exception $e) {
            $this->log('error', 'Contact tool execution failed', [
                'action' => $action,
                'parameters' => $parameters,
                'error' => $e->getMessage()
            ]);
            
            return $this->createResponse(false, null, $e->getMessage());
        }
    }
    
    private function searchContacts($parameters, $context) {
        // Mock implementation - in real system would query database
        $mockContacts = [
            [
                'id' => 1,
                'name' => 'Derek Smith',
                'email' => 'derek@birdseyemanagementservices.com',
                'phone' => '+1-555-0123',
                'company' => 'Birds Eye Management Services'
            ],
            [
                'id' => 2,
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '+1-555-0456',
                'company' => 'Example Corp'
            ]
        ];
        
        $query = strtolower($parameters['query'] ?? '');
        $results = [];
        
        if (empty($query)) {
            $results = $mockContacts;
        } else {
            foreach ($mockContacts as $contact) {
                if (strpos(strtolower($contact['name']), $query) !== false ||
                    strpos(strtolower($contact['email']), $query) !== false ||
                    strpos(strtolower($contact['company']), $query) !== false) {
                    $results[] = $contact;
                }
            }
        }
        
        $limit = $parameters['limit'] ?? 10;
        $results = array_slice($results, 0, $limit);
        
        return $this->createResponse(true, [
            'contacts' => $results,
            'count' => count($results),
            'query' => $query
        ]);
    }
    
    private function addContact($parameters, $context) {
        // Mock implementation
        $requiredFields = ['name', 'email'];
        foreach ($requiredFields as $field) {
            if (empty($parameters[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
        
        $contact = [
            'id' => rand(1000, 9999),
            'name' => $parameters['name'],
            'email' => $parameters['email'],
            'phone' => $parameters['phone'] ?? '',
            'company' => $parameters['company'] ?? '',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->createResponse(true, [
            'contact' => $contact,
            'message' => 'Contact added successfully'
        ]);
    }
    
    private function listContacts($parameters, $context) {
        // Mock implementation
        return $this->searchContacts(['query' => ''], $context);
    }
}
?>
