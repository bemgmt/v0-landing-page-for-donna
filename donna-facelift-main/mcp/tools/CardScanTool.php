<?php
require_once __DIR__ . '/../MCPTool.php';

/**
 * Card Scanner MCP Tool for DONNA
 * Bridges business card scanning and contact creation to the aidonna.co processing pipeline.
 */
class CardScanTool extends BaseMCPTool {
    private $apiBase;
    private $apiToken;

    public function __construct() {
        parent::__construct([
            'name' => 'card_scanner',
            'description' => 'Extract contact information from a business card image using vision AI and save as a lead in DONNA CRM',
            'category' => 'crm',
            'version' => '1.0.0',
            'parameters' => [
                'image' => [
                    'type' => 'string',
                    'required' => true,
                    'description' => 'Base64 data URI (data:image/jpeg;base64,...), raw base64 string, or public URL to the card image'
                ],
                'notes' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Optional notes about the contact or meeting'
                ],
                'event_tag' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Optional event name or lead source tag'
                ],
                'auto_save' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Whether to automatically persist the extracted lead in DONNA CRM and send notification alerts (default true)',
                    'default' => true
                ]
            ]
        ]);

        // Prioritize aidonna.co as target endpoint; fallback to custom env var if configured
        $this->apiBase = rtrim(getenv('AIDONNA_API_BASE') ?: (getenv('NEXT_PUBLIC_SITE_URL') ?: 'https://aidonna.co'), '/');
        $this->apiToken = getenv('DONNA_MCP_TOKEN') ?: getenv('DONNA_BILLING_TOKEN');
    }

    public function execute($parameters, $context = []) {
        $image = $parameters['image'] ?? '';
        if (empty($image)) {
            return $this->createResponse(false, null, 'Parameter "image" is required');
        }

        $payload = [
            'type' => 'tool_execute',
            'tool_name' => 'scan_business_card',
            'parameters' => [
                'image' => $image,
                'notes' => $parameters['notes'] ?? null,
                'event_tag' => $parameters['event_tag'] ?? null,
                'auto_save' => $parameters['auto_save'] ?? true,
            ]
        ];

        $targetUrl = $this->apiBase . '/api/mcp';
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if (!empty($this->apiToken)) {
            $headers[] = 'Authorization: Bearer ' . $this->apiToken;
        }

        $ch = curl_init($targetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $this->log('error', 'Card scan curl failure', ['error' => $curlError, 'target' => $targetUrl]);
            return $this->createResponse(false, null, 'Failed to connect to card processing server: ' . $curlError);
        }

        $data = json_decode($response, true);
        if ($httpCode >= 400 || !isset($data['success']) || !$data['success']) {
            $errorMessage = $data['error'] ?? ('Server error with HTTP code ' . $httpCode);
            $this->log('error', 'Card scan error response', ['httpCode' => $httpCode, 'error' => $errorMessage]);
            return $this->createResponse(false, null, $errorMessage);
        }

        $resultData = $data['result'] ?? $data;
        $this->log('info', 'Card scan completed successfully', [
            'lead_id' => $resultData['lead_id'] ?? null,
            'saved' => $resultData['saved'] ?? false
        ]);

        return $this->createResponse(true, $resultData);
    }
}
