<?php
require_once __DIR__ . '/../MCPTool.php';
require_once __DIR__ . '/../../logic/email_logic.php';
require_once __DIR__ . '/../../lib/DataAccessFactory.php';

/**
 * Email Reply MCP Tool
 * Handles email replies, conversation threading, and smart reply generation
 */
class EmailReplyTool extends BaseMCPTool {
    private $emailHandler;
    private $dal;

    public function __construct() {
        parent::__construct([
            'name' => 'email_reply',
            'description' => 'Generate and send email replies, manage conversation threads, and handle email conversations',
            'category' => 'communication',
            'version' => '1.0.0',
            'parameters' => [
                'action' => [
                    'type' => 'string',
                    'required' => true,
                    'description' => 'Action to perform: generate_reply, send_reply, analyze_email, get_conversation',
                    'enum' => ['generate_reply', 'send_reply', 'analyze_email', 'get_conversation']
                ],
                'original_email' => [
                    'type' => 'object',
                    'required' => false,
                    'description' => 'Original email object with from, subject, body'
                ],
                'reply_text' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Reply text to send'
                ],
                'conversation_history' => [
                    'type' => 'array',
                    'required' => false,
                    'description' => 'Previous emails in the conversation thread'
                ],
                'reply_type' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Type of reply to generate',
                    'enum' => ['professional', 'friendly', 'brief', 'detailed'],
                    'default' => 'professional'
                ],
                'sender_email' => [
                    'type' => 'email',
                    'required' => false,
                    'description' => 'Email address of the sender to reply to'
                ]
            ]
        ]);

        $this->emailHandler = new EmailHandler();

        // Initialize data access layer for thread storage
        try {
            $this->dal = DataAccessFactory::create();
        } catch (Exception $e) {
            // Fallback to file storage if database fails
            $this->dal = null;
            error_log("EmailReplyTool: Database initialization failed, using file storage: " . $e->getMessage());
        }
    }
    
    public function execute($parameters, $context = []) {
        $action = $parameters['action'];
        
        try {
            switch ($action) {
                case 'generate_reply':
                    return $this->generateReply($parameters, $context);
                    
                case 'send_reply':
                    return $this->sendReply($parameters, $context);
                    
                case 'analyze_email':
                    return $this->analyzeEmail($parameters, $context);
                    
                case 'get_conversation':
                    return $this->getConversation($parameters, $context);
                    
                default:
                    throw new Exception("Unknown email reply action: $action");
            }
            
        } catch (Exception $e) {
            $this->log('error', 'Email reply tool execution failed', [
                'action' => $action,
                'parameters' => $parameters,
                'error' => $e->getMessage()
            ]);
            
            return $this->createResponse(false, null, $e->getMessage());
        }
    }
    
    private function generateReply($parameters, $context) {
        $originalEmail = $parameters['original_email'] ?? null;
        $conversationHistory = $parameters['conversation_history'] ?? [];
        $replyType = $parameters['reply_type'] ?? 'professional';
        
        if (!$originalEmail) {
            throw new Exception('Original email required for reply generation');
        }
        
        // Build conversation context
        $conversationText = $this->buildConversationContext($conversationHistory, $originalEmail);
        
        // Analyze sender type
        $senderAnalysis = $this->analyzeSender($originalEmail['from'], $originalEmail['body']);
        
        // Generate reply using OpenAI
        $replyText = $this->generateAIReply($conversationText, $senderAnalysis, $replyType);
        
        $this->log('info', 'Reply generated', [
            'from' => $originalEmail['from'],
            'subject' => $originalEmail['subject'],
            'reply_type' => $replyType,
            'sender_type' => $senderAnalysis['type']
        ]);
        
        return $this->createResponse(true, [
            'reply_text' => $replyText,
            'sender_analysis' => $senderAnalysis,
            'reply_type' => $replyType,
            'suggested_subject' => 'Re: ' . $originalEmail['subject'],
            'conversation_context' => count($conversationHistory) . ' previous messages'
        ]);
    }
    
    private function sendReply($parameters, $context) {
        $originalEmail = $parameters['original_email'] ?? null;
        $replyText = $parameters['reply_text'] ?? null;
        
        if (!$originalEmail || !$replyText) {
            throw new Exception('Original email and reply text required');
        }
        
        $to = $this->extractEmailAddress($originalEmail['from']);
        $subject = 'Re: ' . $originalEmail['subject'];
        
        // Send the reply
        $result = $this->emailHandler->sendEmail($to, $subject, $replyText, true);
        
        if ($result['success']) {
            // Save conversation thread
            $this->saveConversationThread($originalEmail, $replyText, $context);
            
            $this->log('info', 'Reply sent successfully', [
                'to' => $to,
                'subject' => $subject,
                'original_from' => $originalEmail['from']
            ]);
            
            return $this->createResponse(true, [
                'sent' => true,
                'to' => $to,
                'subject' => $subject,
                'message' => "Reply sent successfully to $to"
            ]);
        } else {
            return $this->createResponse(false, null, $result['error']);
        }
    }
    
    private function analyzeEmail($parameters, $context) {
        $originalEmail = $parameters['original_email'] ?? null;
        
        if (!$originalEmail) {
            throw new Exception('Email required for analysis');
        }
        
        $analysis = $this->analyzeSender($originalEmail['from'], $originalEmail['body']);
        
        // Add additional analysis
        $analysis['urgency'] = $this->detectUrgency($originalEmail['subject'], $originalEmail['body']);
        $analysis['sentiment'] = $this->detectSentiment($originalEmail['body']);
        $analysis['requires_reply'] = $this->requiresReply($originalEmail['body']);
        $analysis['lead_score'] = $this->calculateLeadScore($originalEmail['body']);
        
        return $this->createResponse(true, [
            'analysis' => $analysis,
            'recommendations' => $this->getReplyRecommendations($analysis)
        ]);
    }
    
    private function buildConversationContext($history, $currentEmail) {
        $context = "Email Conversation Thread:\n\n";
        
        // Add conversation history
        foreach ($history as $index => $email) {
            $context .= "Message " . ($index + 1) . ":\n";
            $context .= "From: " . $email['from'] . "\n";
            $context .= "Subject: " . $email['subject'] . "\n";
            $context .= "Body: " . $email['body'] . "\n\n";
        }
        
        // Add current email
        $context .= "Latest Message:\n";
        $context .= "From: " . $currentEmail['from'] . "\n";
        $context .= "Subject: " . $currentEmail['subject'] . "\n";
        $context .= "Body: " . $currentEmail['body'] . "\n";
        
        return $context;
    }
    
    private function analyzeSender($from, $body) {
        $email = $this->extractEmailAddress($from);
        $domain = substr(strrchr($email, "@"), 1);
        
        // Basic sender classification
        $type = 'unknown';
        $confidence = 0.5;
        
        // Check for common patterns
        if (strpos($body, 'quote') !== false || strpos($body, 'pricing') !== false) {
            $type = 'lead';
            $confidence = 0.8;
        } elseif (strpos($body, 'thank you') !== false || strpos($body, 'thanks') !== false) {
            $type = 'client';
            $confidence = 0.7;
        } elseif (strpos($body, 'unsubscribe') !== false || strpos($body, 'remove') !== false) {
            $type = 'unsubscribe';
            $confidence = 0.9;
        }
        
        return [
            'type' => $type,
            'confidence' => $confidence,
            'email' => $email,
            'domain' => $domain,
            'is_business' => !in_array($domain, ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'])
        ];
    }
    
    private function generateAIReply($conversationText, $senderAnalysis, $replyType) {
        // Check if OpenAI is available
        if (!isset($_ENV['OPENAI_API_KEY']) || empty($_ENV['OPENAI_API_KEY'])) {
            return $this->generateTemplateReply($senderAnalysis, $replyType);
        }
        
        try {
            $client = new \OpenAI\Client($_ENV['OPENAI_API_KEY']);
            
            $systemPrompt = $this->getSystemPrompt($replyType, $senderAnalysis);
            $userPrompt = "Please generate a reply to this email conversation:\n\n" . $conversationText;
            
            $response = $client->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt]
                ],
                'temperature' => 0.7,
                'max_tokens' => 500
            ]);
            
            return trim($response['choices'][0]['message']['content']);
            
        } catch (Exception $e) {
            $this->log('warning', 'OpenAI reply generation failed, using template', [
                'error' => $e->getMessage()
            ]);
            return $this->generateTemplateReply($senderAnalysis, $replyType);
        }
    }
    
    private function getSystemPrompt($replyType, $senderAnalysis) {
        $basePrompt = "You are DONNA, a professional AI assistant managing emails for a business. ";
        
        switch ($replyType) {
            case 'friendly':
                $basePrompt .= "Write warm, friendly replies that build relationships.";
                break;
            case 'brief':
                $basePrompt .= "Write concise, to-the-point replies.";
                break;
            case 'detailed':
                $basePrompt .= "Write comprehensive, detailed replies that address all points.";
                break;
            default:
                $basePrompt .= "Write professional, helpful replies.";
        }
        
        if ($senderAnalysis['type'] === 'lead') {
            $basePrompt .= " This appears to be a potential customer, so be helpful and encouraging.";
        } elseif ($senderAnalysis['type'] === 'client') {
            $basePrompt .= " This appears to be an existing client, so be supportive and professional.";
        }
        
        return $basePrompt;
    }
    
    private function generateTemplateReply($senderAnalysis, $replyType) {
        $templates = [
            'lead' => "Thank you for your inquiry! I've received your message and will make sure the appropriate team member gets back to you shortly. We appreciate your interest in our services.\n\nBest regards,\nDONNA",
            'client' => "Thank you for reaching out! I've received your message and will ensure it gets the attention it deserves. Someone from our team will follow up with you soon.\n\nBest regards,\nDONNA",
            'default' => "Thank you for your email. I've received your message and will make sure it's handled appropriately.\n\nBest regards,\nDONNA"
        ];
        
        return $templates[$senderAnalysis['type']] ?? $templates['default'];
    }
    
    private function extractEmailAddress($fromString) {
        if (preg_match('/<(.+?)>/', $fromString, $matches)) {
            return $matches[1];
        }
        return trim($fromString);
    }
    
    private function detectUrgency($subject, $body) {
        $urgentWords = ['urgent', 'asap', 'emergency', 'immediate', 'rush', 'critical'];
        $text = strtolower($subject . ' ' . $body);
        
        foreach ($urgentWords as $word) {
            if (strpos($text, $word) !== false) {
                return 'high';
            }
        }
        
        return 'normal';
    }
    
    private function detectSentiment($body) {
        $positiveWords = ['thank', 'great', 'excellent', 'love', 'amazing', 'perfect'];
        $negativeWords = ['problem', 'issue', 'complaint', 'disappointed', 'frustrated', 'angry'];
        
        $text = strtolower($body);
        $positive = $negative = 0;
        
        foreach ($positiveWords as $word) {
            if (strpos($text, $word) !== false) $positive++;
        }
        
        foreach ($negativeWords as $word) {
            if (strpos($text, $word) !== false) $negative++;
        }
        
        if ($positive > $negative) return 'positive';
        if ($negative > $positive) return 'negative';
        return 'neutral';
    }
    
    private function requiresReply($body) {
        $questionWords = ['?', 'when', 'what', 'how', 'where', 'why', 'can you', 'could you', 'would you'];
        $text = strtolower($body);
        
        foreach ($questionWords as $word) {
            if (strpos($text, $word) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    private function calculateLeadScore($body) {
        $score = 0;
        $text = strtolower($body);
        
        if (strpos($text, 'quote') !== false) $score += 3;
        if (strpos($text, 'pricing') !== false) $score += 3;
        if (strpos($text, 'budget') !== false) $score += 2;
        if (strpos($text, 'timeline') !== false) $score += 2;
        if (strlen($body) > 200) $score += 1;
        
        return min($score, 10); // Cap at 10
    }
    
    private function getReplyRecommendations($analysis) {
        $recommendations = [];
        
        if ($analysis['type'] === 'lead') {
            $recommendations[] = 'Respond quickly - this appears to be a potential customer';
            $recommendations[] = 'Include relevant service information';
        }
        
        if ($analysis['urgency'] === 'high') {
            $recommendations[] = 'This email appears urgent - prioritize response';
        }
        
        if ($analysis['sentiment'] === 'negative') {
            $recommendations[] = 'Negative sentiment detected - handle with care';
        }
        
        if ($analysis['requires_reply']) {
            $recommendations[] = 'This email contains questions that require answers';
        }
        
        return $recommendations;
    }
    
    private function saveConversationThread($originalEmail, $replyText, $context) {
        // Save conversation thread for future reference
        $threadData = [
            'original' => $originalEmail,
            'reply' => $replyText,
            'timestamp' => date('Y-m-d H:i:s'),
            'session_id' => $context['session_id'] ?? 'default'
        ];
        
        // Store thread data using database or file storage
        $this->saveThread($originalEmail['from'], $threadData);
    }
    
    private function getConversation($parameters, $context) {
        $senderEmail = $parameters['sender_email'] ?? null;

        if (!$senderEmail) {
            throw new Exception('Sender email required to get conversation');
        }

        $conversation = $this->loadThread($senderEmail);

        return $this->createResponse(true, [
            'conversation' => $conversation,
            'count' => count($conversation),
            'sender_email' => $senderEmail
        ]);
    }

    /**
     * Save thread data to database or file storage
     */
    private function saveThread($senderEmail, $threadData) {
        if ($this->dal) {
            try {
                // Store in database using user_memory
                $threadKey = 'email_thread_' . md5($senderEmail);

                // Load existing thread
                $existingThread = $this->dal->getUserMemory('email_system', $threadKey) ?? [];
                if (is_string($existingThread)) {
                    $existingThread = json_decode($existingThread, true) ?? [];
                }

                // Add new entry
                $existingThread[] = $threadData;

                // Keep only last 50 entries
                if (count($existingThread) > 50) {
                    $existingThread = array_slice($existingThread, -50);
                }

                // Store back to database
                $this->dal->setUserMemory('email_system', $threadKey, json_encode($existingThread), 'email_thread');

            } catch (Exception $e) {
                error_log("EmailReplyTool: Failed to save thread to database: " . $e->getMessage());
                // Fallback to file storage
                $this->saveThreadToFile($senderEmail, $threadData);
            }
        } else {
            $this->saveThreadToFile($senderEmail, $threadData);
        }
    }

    /**
     * Load thread data from database or file storage
     */
    private function loadThread($senderEmail) {
        if ($this->dal) {
            try {
                $threadKey = 'email_thread_' . md5($senderEmail);
                $threadData = $this->dal->getUserMemory('email_system', $threadKey);

                if ($threadData) {
                    return is_string($threadData) ? json_decode($threadData, true) ?? [] : $threadData;
                }
            } catch (Exception $e) {
                error_log("EmailReplyTool: Failed to load thread from database: " . $e->getMessage());
                // Fallback to file storage
                return $this->loadThreadFromFile($senderEmail);
            }
        } else {
            return $this->loadThreadFromFile($senderEmail);
        }

        return [];
    }

    /**
     * Fallback: Save thread to file storage
     */
    private function saveThreadToFile($senderEmail, $threadData) {
        $threadFile = __DIR__ . '/../storage/conversations/' . md5($senderEmail) . '.json';

        // Ensure directory exists
        $dir = dirname($threadFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Load existing thread
        $existingThread = [];
        if (file_exists($threadFile)) {
            $existingThread = json_decode(file_get_contents($threadFile), true) ?? [];
        }

        // Add new entry
        $existingThread[] = $threadData;

        // Keep only last 50 entries
        if (count($existingThread) > 50) {
            $existingThread = array_slice($existingThread, -50);
        }

        file_put_contents($threadFile, json_encode($existingThread, JSON_PRETTY_PRINT));
    }

    /**
     * Fallback: Load thread from file storage
     */
    private function loadThreadFromFile($senderEmail) {
        $threadFile = __DIR__ . '/../storage/conversations/' . md5($senderEmail) . '.json';

        if (!file_exists($threadFile)) {
            return [];
        }

        return json_decode(file_get_contents($threadFile), true) ?? [];
    }
    
    protected function getCapabilities() {
        return array_merge(parent::getCapabilities(), [
            'ai_reply_generation' => true,
            'conversation_threading' => true,
            'sender_analysis' => true,
            'sentiment_detection' => true,
            'lead_scoring' => true,
            'template_fallback' => true
        ]);
    }
}
?>
