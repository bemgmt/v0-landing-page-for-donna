<?php
require_once __DIR__ . '/../MCPTool.php';

/**
 * Inbox MCP Tool
 * Reads real emails from DONNA's inbox using IMAP
 */
class InboxTool extends BaseMCPTool {
    private $imapConnection;
    
    public function __construct() {
        parent::__construct([
            'name' => 'inbox',
            'description' => 'Read emails from DONNA\'s inbox, manage conversations, and handle email threads',
            'category' => 'communication',
            'version' => '1.0.0',
            'parameters' => [
                'action' => [
                    'type' => 'string',
                    'required' => true,
                    'description' => 'Action to perform: list, read, search, mark_read, get_thread',
                    'enum' => ['list', 'read', 'search', 'mark_read', 'get_thread']
                ],
                'folder' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Email folder to access',
                    'default' => 'INBOX',
                    'enum' => ['INBOX', 'SENT', 'TRASH', 'SPAM']
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
                'search_query' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Search query for emails'
                ],
                'thread_id' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Thread ID for conversation'
                ]
            ]
        ]);
    }
    
    public function execute($parameters, $context = []) {
        $action = $parameters['action'];
        
        try {
            $this->connectToIMAP();
            
            switch ($action) {
                case 'list':
                    return $this->listEmails($parameters, $context);
                    
                case 'read':
                    return $this->readEmail($parameters, $context);
                    
                case 'search':
                    return $this->searchEmails($parameters, $context);
                    
                case 'mark_read':
                    return $this->markAsRead($parameters, $context);
                    
                case 'get_thread':
                    return $this->getEmailThread($parameters, $context);
                    
                default:
                    throw new Exception("Unknown inbox action: $action");
            }
            
        } catch (Exception $e) {
            $this->log('error', 'Inbox tool execution failed', [
                'action' => $action,
                'parameters' => $parameters,
                'error' => $e->getMessage()
            ]);
            
            return $this->createResponse(false, null, $e->getMessage());
        } finally {
            $this->disconnectIMAP();
        }
    }
    
    private function connectToIMAP() {
        // Check if IMAP extension is available
        if (!function_exists('imap_open')) {
            throw new Exception('IMAP extension not available. Please install php-imap extension.');
        }

        $hostname = $_ENV['IMAP_HOST'] ?? 'gcam1143.siteground.biz';
        $port = $_ENV['IMAP_PORT'] ?? 993;
        $flags = $_ENV['IMAP_FLAGS'] ?? '/imap/ssl/validate-cert';
        $username = $_ENV['IMAP_USER'] ?? 'donna@bemdonna.com';
        $password = $_ENV['IMAP_PASS'] ?? '';

        $mailbox = "{{$hostname}:{$port}{$flags}}INBOX";

        $this->imapConnection = imap_open($mailbox, $username, $password);

        if (!$this->imapConnection) {
            throw new Exception('IMAP connection failed: ' . imap_last_error());
        }
    }
    
    private function disconnectIMAP() {
        if ($this->imapConnection) {
            imap_close($this->imapConnection);
            $this->imapConnection = null;
        }
    }
    
    private function listEmails($parameters, $context) {
        $limit = $parameters['limit'] ?? 20;
        $unreadOnly = $parameters['unread_only'] ?? false;
        
        // Search criteria
        $searchCriteria = $unreadOnly ? 'UNSEEN' : 'ALL';
        
        $emails = imap_search($this->imapConnection, $searchCriteria);
        
        if (!$emails) {
            return $this->createResponse(true, [
                'emails' => [],
                'count' => 0,
                'message' => 'No emails found'
            ]);
        }
        
        // Sort by newest first
        rsort($emails);
        
        // Limit results
        $emails = array_slice($emails, 0, $limit);
        
        $emailList = [];
        foreach ($emails as $emailId) {
            $header = imap_headerinfo($this->imapConnection, $emailId);
            $overview = imap_fetch_overview($this->imapConnection, $emailId);
            
            if ($header && $overview) {
                $emailList[] = [
                    'id' => $emailId,
                    'message_id' => $header->message_id ?? '',
                    'from' => $header->fromaddress ?? '',
                    'from_email' => $header->from[0]->mailbox . '@' . $header->from[0]->host,
                    'subject' => $header->subject ?? '',
                    'date' => date('Y-m-d H:i:s', $header->udate),
                    'unread' => $overview[0]->seen == 0,
                    'size' => $header->Size ?? 0,
                    'thread_id' => $this->extractThreadId($header),
                    'preview' => $this->getEmailPreview($emailId)
                ];
            }
        }
        
        return $this->createResponse(true, [
            'emails' => $emailList,
            'count' => count($emailList),
            'total_in_folder' => imap_num_msg($this->imapConnection)
        ]);
    }
    
    private function readEmail($parameters, $context) {
        $messageId = $parameters['message_id'];
        
        if (!$messageId) {
            throw new Exception('Message ID required for reading email');
        }
        
        $header = imap_headerinfo($this->imapConnection, $messageId);
        $body = $this->getEmailBody($messageId);
        
        if (!$header) {
            throw new Exception('Email not found');
        }
        
        $email = [
            'id' => $messageId,
            'message_id' => $header->message_id ?? '',
            'from' => $header->fromaddress ?? '',
            'from_email' => $header->from[0]->mailbox . '@' . $header->from[0]->host,
            'to' => $header->toaddress ?? '',
            'subject' => $header->subject ?? '',
            'date' => date('Y-m-d H:i:s', $header->udate),
            'body' => $body,
            'thread_id' => $this->extractThreadId($header),
            'in_reply_to' => $header->in_reply_to ?? '',
            'references' => $header->references ?? ''
        ];
        
        return $this->createResponse(true, [
            'email' => $email
        ]);
    }
    
    private function getEmailBody($messageId) {
        $structure = imap_fetchstructure($this->imapConnection, $messageId);
        
        if (!isset($structure->parts)) {
            // Simple message
            $body = imap_fetchbody($this->imapConnection, $messageId, 1);
            return $this->decodeBody($body, $structure->encoding ?? 0);
        }
        
        // Multipart message
        foreach ($structure->parts as $partNum => $part) {
            if ($part->subtype === 'PLAIN') {
                $body = imap_fetchbody($this->imapConnection, $messageId, $partNum + 1);
                return $this->decodeBody($body, $part->encoding);
            }
        }
        
        // Fallback to first part
        $body = imap_fetchbody($this->imapConnection, $messageId, 1);
        return $this->decodeBody($body, $structure->parts[0]->encoding ?? 0);
    }
    
    private function decodeBody($body, $encoding) {
        switch ($encoding) {
            case 1: // 8bit
                return $body;
            case 2: // binary
                return $body;
            case 3: // base64
                return base64_decode($body);
            case 4: // quoted-printable
                return quoted_printable_decode($body);
            default:
                return $body;
        }
    }
    
    private function getEmailPreview($messageId, $length = 150) {
        $body = $this->getEmailBody($messageId);
        $preview = strip_tags($body);
        $preview = preg_replace('/\s+/', ' ', $preview);
        return substr(trim($preview), 0, $length) . (strlen($preview) > $length ? '...' : '');
    }
    
    private function extractThreadId($header) {
        // Use message-id or in-reply-to to determine thread
        if (isset($header->in_reply_to)) {
            return md5($header->in_reply_to);
        }
        if (isset($header->message_id)) {
            return md5($header->message_id);
        }
        return null;
    }
    
    private function searchEmails($parameters, $context) {
        $query = $parameters['search_query'] ?? '';
        $limit = $parameters['limit'] ?? 20;
        
        if (empty($query)) {
            return $this->listEmails($parameters, $context);
        }
        
        // IMAP search
        $searchCriteria = "TEXT \"$query\"";
        $emails = imap_search($this->imapConnection, $searchCriteria);
        
        if (!$emails) {
            return $this->createResponse(true, [
                'emails' => [],
                'count' => 0,
                'query' => $query,
                'message' => 'No emails found matching search criteria'
            ]);
        }
        
        // Process results similar to listEmails
        rsort($emails);
        $emails = array_slice($emails, 0, $limit);
        
        $emailList = [];
        foreach ($emails as $emailId) {
            $header = imap_headerinfo($this->imapConnection, $emailId);
            if ($header) {
                $emailList[] = [
                    'id' => $emailId,
                    'from' => $header->fromaddress ?? '',
                    'subject' => $header->subject ?? '',
                    'date' => date('Y-m-d H:i:s', $header->udate),
                    'preview' => $this->getEmailPreview($emailId)
                ];
            }
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
        
        $result = imap_setflag_full($this->imapConnection, $messageId, "\\Seen");
        
        return $this->createResponse($result, [
            'message_id' => $messageId,
            'marked_read' => $result
        ]);
    }
    
    private function getEmailThread($parameters, $context) {
        $threadId = $parameters['thread_id'];
        
        if (!$threadId) {
            throw new Exception('Thread ID required');
        }
        
        // This is a simplified implementation
        // In a real system, you'd track threads more sophisticated
        return $this->createResponse(true, [
            'thread_id' => $threadId,
            'emails' => [],
            'message' => 'Thread functionality coming soon'
        ]);
    }
    
    protected function getCapabilities() {
        return array_merge(parent::getCapabilities(), [
            'imap_connection' => true,
            'real_inbox_access' => true,
            'thread_support' => true,
            'search_support' => true,
            'folders' => ['INBOX', 'SENT', 'TRASH', 'SPAM']
        ]);
    }
}
?>
