<?php
/**
 * Telnyx Messaging Client
 * Implements MessagingProviderInterface using Telnyx Messaging API
 */

require_once __DIR__ . '/../lib/MessagingProviderInterface.php';

class TelnyxMessagingClient implements MessagingProviderInterface {
    private $apiKey;
    private $messagingProfileId;
    private $baseUrl = 'https://api.telnyx.com/v2';
    private $timeout = 30;
    
    public function __construct($apiKey = null, $messagingProfileId = null) {
        $this->apiKey = $apiKey ?: getenv('TELNYX_API_KEY');
        $this->messagingProfileId = $messagingProfileId ?: getenv('TELNYX_MESSAGING_PROFILE_ID');
        
        if (!$this->apiKey) {
            throw new Exception('Telnyx API key is required');
        }
        
        if (!$this->messagingProfileId) {
            throw new Exception('Telnyx messaging profile ID is required');
        }
    }
    
    /**
     * Send an SMS message
     */
    public function sendSMS(string $to, string $message, array $options = []): array {
        $url = $this->baseUrl . '/messages';
        
        $payload = [
            'to' => $this->formatPhoneNumber($to),
            'text' => $message,
            'messaging_profile_id' => $this->messagingProfileId
        ];
        
        // Add from number if provided, otherwise use default
        if (isset($options['from'])) {
            $payload['from'] = $this->formatPhoneNumber($options['from']);
        } elseif (getenv('TELNYX_PHONE_NUMBER')) {
            $payload['from'] = $this->formatPhoneNumber(getenv('TELNYX_PHONE_NUMBER'));
        }
        
        // Add optional parameters
        if (isset($options['webhook_url'])) {
            $payload['webhook_url'] = $options['webhook_url'];
        }
        
        if (isset($options['webhook_failover_url'])) {
            $payload['webhook_failover_url'] = $options['webhook_failover_url'];
        }
        
        if (isset($options['webhook_url_method'])) {
            $payload['webhook_url_method'] = $options['webhook_url_method'];
        }
        
        try {
            $response = $this->makeRequest($url, $payload, 'POST');
            
            return [
                'success' => true,
                'message_id' => $response['data']['id'] ?? null,
                'status' => $response['data']['status'] ?? 'queued',
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message_id' => null
            ];
        }
    }
    
    /**
     * Send an MMS message
     */
    public function sendMMS(string $to, string $message, array $media, array $options = []): array {
        $url = $this->baseUrl . '/messages';
        
        $payload = [
            'to' => $this->formatPhoneNumber($to),
            'text' => $message,
            'messaging_profile_id' => $this->messagingProfileId,
            'media_urls' => $media
        ];
        
        // Add from number if provided
        if (isset($options['from'])) {
            $payload['from'] = $this->formatPhoneNumber($options['from']);
        } elseif (getenv('TELNYX_PHONE_NUMBER')) {
            $payload['from'] = $this->formatPhoneNumber(getenv('TELNYX_PHONE_NUMBER'));
        }
        
        // Add optional parameters
        if (isset($options['webhook_url'])) {
            $payload['webhook_url'] = $options['webhook_url'];
        }
        
        try {
            $response = $this->makeRequest($url, $payload, 'POST');
            
            return [
                'success' => true,
                'message_id' => $response['data']['id'] ?? null,
                'status' => $response['data']['status'] ?? 'queued',
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message_id' => null
            ];
        }
    }
    
    /**
     * Get the status of a sent message
     */
    public function getMessageStatus(string $messageId): array {
        $url = $this->baseUrl . '/messages/' . $messageId;
        
        try {
            $response = $this->makeRequest($url, null, 'GET');
            
            return [
                'status' => $response['data']['status'] ?? 'unknown',
                'message_id' => $messageId,
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message_id' => $messageId,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Process an incoming message from webhook
     */
    public function receiveMessage(array $webhookData): array {
        // Extract message data from Telnyx webhook payload
        $data = $webhookData['data'] ?? $webhookData;
        
        return [
            'message_id' => $data['id'] ?? null,
            'from' => $data['payload']['from']['phone_number'] ?? $data['from'] ?? null,
            'to' => $data['payload']['to'][0]['phone_number'] ?? $data['to'] ?? null,
            'message' => $data['payload']['text'] ?? $data['text'] ?? $data['body'] ?? '',
            'received_at' => $data['occurred_at'] ?? $data['received_at'] ?? date('c'),
            'raw_data' => $data
        ];
    }
    
    /**
     * Validate phone number format
     */
    public function validatePhoneNumber(string $phoneNumber): bool {
        // Basic E.164 format validation
        $cleaned = preg_replace('/[^\d+]/', '', $phoneNumber);
        
        // Must start with + and have 10-15 digits after country code
        if (!preg_match('/^\+[1-9]\d{1,14}$/', $cleaned)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Format phone number to E.164 format
     */
    public function formatPhoneNumber(string $phoneNumber): string {
        // Remove all non-digit characters except +
        $cleaned = preg_replace('/[^\d+]/', '', $phoneNumber);
        
        // If it doesn't start with +, assume US number and add +1
        if (!str_starts_with($cleaned, '+')) {
            // Remove leading 1 if present
            if (str_starts_with($cleaned, '1') && strlen($cleaned) === 11) {
                $cleaned = '+' . $cleaned;
            } else {
                $cleaned = '+1' . $cleaned;
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Make HTTP request to Telnyx API
     */
    private function makeRequest($url, $data = null, $method = 'GET') {
        $ch = curl_init();
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => $headers
        ]);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }
        
        $decodedResponse = json_decode($response, true);
        
        if ($httpCode < 200 || $httpCode >= 300) {
            $errorMessage = $decodedResponse['errors'][0]['detail'] ?? 
                          $decodedResponse['errors'][0]['title'] ?? 
                          'Unknown error';
            throw new Exception("Telnyx API error (HTTP $httpCode): $errorMessage");
        }
        
        return $decodedResponse;
    }
}
