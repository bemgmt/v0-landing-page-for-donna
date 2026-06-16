<?php
/**
 * Voice Provider Interface
 * Defines the contract for voice calling providers (Telnyx, Twilio, etc.)
 */

interface VoiceProviderInterface {
    
    /**
     * Initiate an outbound call
     * @param string $to Destination phone number (E.164 format)
     * @param string $from Source phone number (E.164 format)
     * @param array $options Additional options (caller_id, recording, etc.)
     * @return array Response with 'success', 'call_id', and optional 'error'
     */
    public function initiateCall(string $to, string $from, array $options = []): array;
    
    /**
     * Answer an incoming call
     * @param string $callId Call identifier
     * @return array Response with 'success' and optional 'error'
     */
    public function answerCall(string $callId): array;
    
    /**
     * Hang up a call
     * @param string $callId Call identifier
     * @return array Response with 'success' and optional 'error'
     */
    public function hangupCall(string $callId): array;
    
    /**
     * Transfer a call to another number
     * @param string $callId Call identifier
     * @param string $to Destination phone number (E.164 format)
     * @return array Response with 'success' and optional 'error'
     */
    public function transferCall(string $callId, string $to): array;
    
    /**
     * Get the current status of a call
     * @param string $callId Call identifier
     * @return array Response with 'status', 'call_id', and call details
     */
    public function getCallStatus(string $callId): array;
    
    /**
     * Enable or disable call recording
     * @param string $callId Call identifier
     * @param bool $enabled Whether recording should be enabled
     * @return array Response with 'success' and optional 'error'
     */
    public function recordCall(string $callId, bool $enabled): array;
    
    /**
     * Get call history/records
     * @param array $filters Optional filters (date_range, phone_number, etc.)
     * @return array List of calls with details
     */
    public function getCallHistory(array $filters = []): array;
}
