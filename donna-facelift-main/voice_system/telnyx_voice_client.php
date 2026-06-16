<?php
/**
 * Telnyx Voice Client
 * Implements VoiceProviderInterface using Telnyx Call Control API
 */

require_once __DIR__ . '/../lib/VoiceProviderInterface.php';

class TelnyxVoiceClient implements VoiceProviderInterface {
    private $apiKey;
    private $baseUrl = 'https://api.telnyx.com/v2';
    private $timeout = 30;
    
    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: getenv('TELNYX_API_KEY');
        
        if (!$this->apiKey) {
            throw new Exception('Telnyx API key is required');
        }
    }
    
    /**
     * Initiate an outbound call
     */
    public function initiateCall(string $to, string $from, array $options = []): array {
        $url = $this->baseUrl . '/calls';
        
        $payload = [
            'connection_id' => $options['connection_id'] ?? getenv('TELNYX_CONNECTION_ID'),
            'to' => $this->formatPhoneNumber($to),
            'from' => $this->formatPhoneNumber($from ?: getenv('TELNYX_PHONE_NUMBER')),
        ];
        
        // Add optional parameters
        if (isset($options['caller_id'])) {
            $payload['caller_id'] = $options['caller_id'];
        }
        
        if (isset($options['recording_enabled'])) {
            $payload['recording_enabled'] = $options['recording_enabled'];
        }
        
        if (isset($options['webhook_url'])) {
            $payload['webhook_url'] = $options['webhook_url'];
        }
        
        if (isset($options['webhook_url_method'])) {
            $payload['webhook_url_method'] = $options['webhook_url_method'];
        }
        
        try {
            $response = $this->makeRequest($url, $payload, 'POST');
            
            return [
                'success' => true,
                'call_id' => $response['data']['call_control_id'] ?? $response['data']['id'] ?? null,
                'status' => $response['data']['call_status'] ?? 'initiated',
                'data' => $response['data']
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'call_id' => null
            ];
        }
    }
    
    /**
     * Answer an incoming call
     */
    public function answerCall(string $callId): array {
        $url = $this->baseUrl . '/calls/' . $callId . '/actions/answer';
        
        try {
            $response = $this->makeRequest($url, [], 'POST');
            
            return [
                'success' => true,
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Hang up a call
     */
    public function hangupCall(string $callId): array {
        $url = $this->baseUrl . '/calls/' . $callId . '/actions/hangup';
        
        try {
            $response = $this->makeRequest($url, [], 'POST');
            
            return [
                'success' => true,
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Transfer a call to another number
     */
    public function transferCall(string $callId, string $to): array {
        $url = $this->baseUrl . '/calls/' . $callId . '/actions/transfer';
        
        $payload = [
            'to' => $this->formatPhoneNumber($to)
        ];
        
        try {
            $response = $this->makeRequest($url, $payload, 'POST');
            
            return [
                'success' => true,
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get the current status of a call
     */
    public function getCallStatus(string $callId): array {
        $url = $this->baseUrl . '/calls/' . $callId;
        
        try {
            $response = $this->makeRequest($url, null, 'GET');
            
            return [
                'status' => $response['data']['call_status'] ?? 'unknown',
                'call_id' => $callId,
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'call_id' => $callId,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Enable or disable call recording
     */
    public function recordCall(string $callId, bool $enabled): array {
        $action = $enabled ? 'start' : 'stop';
        $url = $this->baseUrl . '/calls/' . $callId . '/actions/record_' . $action;
        
        try {
            $response = $this->makeRequest($url, [], 'POST');
            
            return [
                'success' => true,
                'recording_enabled' => $enabled,
                'data' => $response['data'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get call history/records
     */
    public function getCallHistory(array $filters = []): array {
        $url = $this->baseUrl . '/calls';
        
        $queryParams = [];
        if (isset($filters['date_from'])) {
            $queryParams['filter[occurred_at][gte]'] = $filters['date_from'];
        }
        if (isset($filters['date_to'])) {
            $queryParams['filter[occurred_at][lte]'] = $filters['date_to'];
        }
        if (isset($filters['phone_number'])) {
            $queryParams['filter[from]'] = $this->formatPhoneNumber($filters['phone_number']);
        }
        if (isset($filters['limit'])) {
            $queryParams['page[size]'] = $filters['limit'];
        }
        
        if (!empty($queryParams)) {
            $url .= '?' . http_build_query($queryParams);
        }
        
        try {
            $response = $this->makeRequest($url, null, 'GET');
            
            return [
                'success' => true,
                'calls' => $response['data'] ?? [],
                'meta' => $response['meta'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'calls' => []
            ];
        }
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
    
    /**
     * Format phone number to E.164 format
     */
    private function formatPhoneNumber(string $phoneNumber): string {
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
}
