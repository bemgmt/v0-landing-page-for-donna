<?php
/**
 * Provider Factory
 * Creates appropriate provider implementations based on configuration
 * Follows the same pattern as DataAccessFactory
 */

require_once __DIR__ . '/VoiceProviderInterface.php';
require_once __DIR__ . '/MessagingProviderInterface.php';

class ProviderFactory {
    private static $voiceProviderInstance = null;
    private static $messagingProviderInstance = null;
    private static $voiceProviderType = null;
    private static $messagingProviderType = null;
    
    /**
     * Create a VoiceProviderInterface implementation based on configuration
     * @param string|null $providerType Provider type (telnyx, twilio, etc.)
     * @return VoiceProviderInterface
     */
    public static function createVoiceProvider(?string $providerType = null): VoiceProviderInterface {
        // Use provided type or get from environment
        $type = $providerType ?? getenv('VOICE_PROVIDER') ?: 'telnyx';
        
        // Cache the instance for the same provider type
        if (self::$voiceProviderInstance !== null && self::$voiceProviderType === $type) {
            return self::$voiceProviderInstance;
        }
        
        switch (strtolower($type)) {
            case 'telnyx':
                self::$voiceProviderInstance = self::createTelnyxVoiceProvider();
                break;
                
            case 'twilio':
                // Future implementation
                throw new InvalidArgumentException("Twilio voice provider not yet implemented");
                
            case 'openai':
                // OpenAI Realtime is for AI processing, not PSTN calls
                throw new InvalidArgumentException("OpenAI is not a voice calling provider. Use Telnyx for PSTN calls.");
                
            default:
                throw new InvalidArgumentException("Unsupported voice provider: $type. Supported types: telnyx");
        }
        
        self::$voiceProviderType = $type;
        return self::$voiceProviderInstance;
    }
    
    /**
     * Create a MessagingProviderInterface implementation based on configuration
     * @param string|null $providerType Provider type (telnyx, twilio, etc.)
     * @return MessagingProviderInterface
     */
    public static function createMessagingProvider(?string $providerType = null): MessagingProviderInterface {
        // Use provided type or get from environment
        $type = $providerType ?? getenv('MESSAGING_PROVIDER') ?: 'telnyx';
        
        // Cache the instance for the same provider type
        if (self::$messagingProviderInstance !== null && self::$messagingProviderType === $type) {
            return self::$messagingProviderInstance;
        }
        
        switch (strtolower($type)) {
            case 'telnyx':
                self::$messagingProviderInstance = self::createTelnyxMessagingProvider();
                break;
                
            case 'twilio':
                // Future implementation
                throw new InvalidArgumentException("Twilio messaging provider not yet implemented");
                
            default:
                throw new InvalidArgumentException("Unsupported messaging provider: $type. Supported types: telnyx");
        }
        
        self::$messagingProviderType = $type;
        return self::$messagingProviderInstance;
    }
    
    /**
     * Create Telnyx voice provider with validation
     * @return VoiceProviderInterface
     */
    private static function createTelnyxVoiceProvider(): VoiceProviderInterface {
        require_once __DIR__ . '/../voice_system/telnyx_voice_client.php';
        
        // Validate required environment variables
        $apiKey = getenv('TELNYX_API_KEY');
        if (empty($apiKey)) {
            throw new Exception("Missing required environment variable: TELNYX_API_KEY");
        }
        
        return new TelnyxVoiceClient($apiKey);
    }
    
    /**
     * Create Telnyx messaging provider with validation
     * @return MessagingProviderInterface
     */
    private static function createTelnyxMessagingProvider(): MessagingProviderInterface {
        require_once __DIR__ . '/../voice_system/telnyx_messaging_client.php';
        
        // Validate required environment variables
        $apiKey = getenv('TELNYX_API_KEY');
        $messagingProfileId = getenv('TELNYX_MESSAGING_PROFILE_ID');
        
        if (empty($apiKey)) {
            throw new Exception("Missing required environment variable: TELNYX_API_KEY");
        }
        
        if (empty($messagingProfileId)) {
            throw new Exception("Missing required environment variable: TELNYX_MESSAGING_PROFILE_ID");
        }
        
        return new TelnyxMessagingClient($apiKey, $messagingProfileId);
    }
    
    /**
     * Reset cached instances (useful for testing)
     */
    public static function reset(): void {
        self::$voiceProviderInstance = null;
        self::$messagingProviderInstance = null;
        self::$voiceProviderType = null;
        self::$messagingProviderType = null;
    }
}
