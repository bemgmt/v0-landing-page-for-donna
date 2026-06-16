<?php
/**
 * Messaging Provider Interface
 * Defines the contract for messaging providers (Telnyx, Twilio, etc.)
 */

interface MessagingProviderInterface {
    
    /**
     * Send an SMS message
     * @param string $to Destination phone number (E.164 format)
     * @param string $message Message text
     * @param array $options Additional options (from, media_urls, etc.)
     * @return array Response with 'success', 'message_id', and optional 'error'
     */
    public function sendSMS(string $to, string $message, array $options = []): array;
    
    /**
     * Send an MMS message
     * @param string $to Destination phone number (E.164 format)
     * @param string $message Message text
     * @param array $media Array of media URLs or file paths
     * @param array $options Additional options (from, etc.)
     * @return array Response with 'success', 'message_id', and optional 'error'
     */
    public function sendMMS(string $to, string $message, array $media, array $options = []): array;
    
    /**
     * Get the status of a sent message
     * @param string $messageId Message identifier
     * @return array Response with 'status', 'message_id', and delivery details
     */
    public function getMessageStatus(string $messageId): array;
    
    /**
     * Process an incoming message from webhook
     * @param array $webhookData Webhook payload data
     * @return array Processed message data
     */
    public function receiveMessage(array $webhookData): array;
    
    /**
     * Validate phone number format
     * @param string $phoneNumber Phone number to validate
     * @return bool True if valid, false otherwise
     */
    public function validatePhoneNumber(string $phoneNumber): bool;
    
    /**
     * Format phone number to E.164 format
     * @param string $phoneNumber Phone number to format
     * @return string Formatted phone number or original if invalid
     */
    public function formatPhoneNumber(string $phoneNumber): string;
}
