<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailHandler {
    private $mail;
    
    public function __construct() {
        $this->mail = new PHPMailer(true);
        $this->configureSMTP();
    }
    
    private function configureSMTP() {
        try {
            // SiteGround SMTP Configuration
            $this->mail->isSMTP();
            $this->mail->Host = $_ENV['EMAIL_SMTP_HOST'] ?? 'mail.bemdonna.com';
            $this->mail->SMTPAuth = true;
            $this->mail->Username = $_ENV['IMAP_USER'] ?? 'donna@bemdonna.com';
            $this->mail->Password = $_ENV['IMAP_PASS'] ?? '';
            $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL for port 465
            $this->mail->Port = $_ENV['EMAIL_SMTP_PORT'] ?? 465;
            
            // Additional settings for SiteGround
            $this->mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            // Set default sender
            $this->mail->setFrom($_ENV['IMAP_USER'] ?? 'donna@bemdonna.com', 'DONNA - AI Assistant');
            
        } catch (Exception $e) {
            error_log("SMTP Configuration Error: " . $e->getMessage());
        }
    }
    
    public function sendEmail($to, $subject, $body, $isHTML = true) {
        try {
            // Clear any previous recipients
            $this->mail->clearAddresses();
            $this->mail->clearAttachments();
            
            // Set recipient
            $this->mail->addAddress($to);
            
            // Set content
            $this->mail->isHTML($isHTML);
            $this->mail->Subject = $subject;
            $this->mail->Body = $body;
            
            // Send email
            $result = $this->mail->send();
            
            return [
                'success' => true,
                'message' => "Email sent successfully to {$to}",
                'details' => [
                    'to' => $to,
                    'subject' => $subject,
                    'sent_at' => date('Y-m-d H:i:s')
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Email Send Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => "Failed to send email to {$to}"
            ];
        }
    }
    
    public function parseEmailCommand($message) {
        // Extract email details from natural language
        $result = [
            'to' => null,
            'subject' => null,
            'body' => null
        ];
        
        // Look for email addresses
        if (preg_match('/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/', $message, $matches)) {
            $result['to'] = $matches[0];
        }
        
        // Look for subject patterns
        if (preg_match('/subject[:\s]+([^,\n]+)/i', $message, $matches)) {
            $result['subject'] = trim($matches[1]);
        } elseif (preg_match('/about\s+([^,\n]+)/i', $message, $matches)) {
            $result['subject'] = trim($matches[1]);
        }
        
        // Look for body/message patterns
        if (preg_match('/(?:saying?|message|body)[:\s]+(.+)/i', $message, $matches)) {
            $result['body'] = trim($matches[1]);
        } elseif (preg_match('/tell\s+(?:them|him|her)\s+(.+)/i', $message, $matches)) {
            $result['body'] = trim($matches[1]);
        }
        
        return $result;
    }
    
    public function testConnection() {
        try {
            $this->mail->smtpConnect();
            $this->mail->smtpClose();
            return [
                'success' => true,
                'message' => 'SMTP connection successful',
                'host' => $this->mail->Host,
                'port' => $this->mail->Port
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'SMTP connection failed'
            ];
        }
    }
}

// Helper function for API calls
function handleEmailRequest($data) {
    $emailHandler = new EmailHandler();
    
    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'test':
                return $emailHandler->testConnection();
                
            case 'send':
                if (!isset($data['to']) || !isset($data['subject']) || !isset($data['body'])) {
                    return [
                        'success' => false,
                        'error' => 'Missing required fields: to, subject, body'
                    ];
                }
                return $emailHandler->sendEmail($data['to'], $data['subject'], $data['body']);
                
            case 'parse':
                if (!isset($data['message'])) {
                    return [
                        'success' => false,
                        'error' => 'Missing message to parse'
                    ];
                }
                return [
                    'success' => true,
                    'parsed' => $emailHandler->parseEmailCommand($data['message'])
                ];
                
            default:
                return [
                    'success' => false,
                    'error' => 'Unknown action'
                ];
        }
    }
    
    return [
        'success' => false,
        'error' => 'No action specified'
    ];
}
?>
