<?php
/**
 * Personality Configuration Manager
 * Manages personality configuration storage and retrieval
 */

require_once __DIR__ . '/DataAccessFactory.php';

class PersonalityConfigManager {
    private $dal;
    
    // Preset personality types
    const PRESET_PERSONALITIES = [
        'sales-driven' => [
            'name' => 'Sales-Driven',
            'description' => 'Enthusiastic, persuasive, and results-focused',
            'traits' => ['enthusiastic', 'persuasive', 'confident', 'results-driven'],
            'tone' => 'energetic',
            'formality' => 'professional'
        ],
        'professional' => [
            'name' => 'Professional',
            'description' => 'Formal, courteous, and business-focused',
            'traits' => ['formal', 'courteous', 'precise', 'business-focused'],
            'tone' => 'professional',
            'formality' => 'formal'
        ],
        'humorous' => [
            'name' => 'Humorous',
            'description' => 'Friendly, lighthearted, and engaging',
            'traits' => ['friendly', 'lighthearted', 'engaging', 'witty'],
            'tone' => 'casual',
            'formality' => 'informal'
        ],
        'supportive' => [
            'name' => 'Supportive',
            'description' => 'Empathetic, helpful, and patient',
            'traits' => ['empathetic', 'helpful', 'patient', 'understanding'],
            'tone' => 'warm',
            'formality' => 'semi-formal'
        ],
        'technical' => [
            'name' => 'Technical',
            'description' => 'Precise, detailed, and analytical',
            'traits' => ['precise', 'detailed', 'analytical', 'thorough'],
            'tone' => 'neutral',
            'formality' => 'formal'
        ]
    ];
    
    public function __construct() {
        $this->dal = DataAccessFactory::create();
        $this->queryHelper = new DatabaseQueryHelper();
    }
    
    /**
     * Get personality configuration for a user
     */
    public function getPersonalityConfig($userId, $clerkId = null) {
        try {
            $query = "
                SELECT * FROM personality_config 
                WHERE user_id = :user_id AND is_active = TRUE
                ORDER BY updated_at DESC
                LIMIT 1
            ";
            
            $result = $this->queryHelper->query($query, ['user_id' => $userId]);
            
            if (empty($result)) {
                return null;
            }
            
            $config = $result[0];
            $config['config_data'] = is_string($config['config_data']) 
                ? json_decode($config['config_data'], true) 
                : $config['config_data'];
            
            return $config;
        } catch (Exception $e) {
            error_log("PersonalityConfigManager::getPersonalityConfig error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Set personality from preset
     */
    public function setPresetPersonality($userId, $presetName, $clerkId = null) {
        if (!isset(self::PRESET_PERSONALITIES[$presetName])) {
            throw new InvalidArgumentException("Invalid preset personality: $presetName");
        }
        
        $preset = self::PRESET_PERSONALITIES[$presetName];
        
        // Deactivate existing personality
        $this->deactivatePersonality($userId);
        
        // Create new personality config
        try {
            $query = "
                INSERT INTO personality_config 
                (user_id, clerk_id, personality_type, personality_name, config_data, source_type)
                VALUES (:user_id, :clerk_id, 'preset', :personality_name, :config_data, 'preset')
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, [
                'user_id' => $userId,
                'clerk_id' => $clerkId ?? $userId,
                'personality_name' => $presetName,
                'config_data' => json_encode($preset)
            ]);
            
            // Update onboarding state
            require_once __DIR__ . '/OnboardingStateManager.php';
            $onboardingManager = new OnboardingStateManager();
            $onboardingManager->updateField($userId, 'personality_configured', true, $clerkId);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("PersonalityConfigManager::setPresetPersonality error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Set personality from uploaded conversations
     */
    public function setPersonalityFromUpload($userId, $conversationData, $clerkId = null) {
        // Process conversation data to extract personality traits
        $personalityTraits = $this->analyzeConversationData($conversationData);
        
        // Deactivate existing personality
        $this->deactivatePersonality($userId);
        
        try {
            $query = "
                INSERT INTO personality_config 
                (user_id, clerk_id, personality_type, personality_name, config_data, source_type, source_data)
                VALUES (:user_id, :clerk_id, 'custom', 'Custom from Upload', :config_data, 'upload', :source_data)
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, [
                'user_id' => $userId,
                'clerk_id' => $clerkId ?? $userId,
                'config_data' => json_encode($personalityTraits),
                'source_data' => json_encode(['upload' => $conversationData])
            ]);
            
            // Update onboarding state
            require_once __DIR__ . '/OnboardingStateManager.php';
            $onboardingManager = new OnboardingStateManager();
            $onboardingManager->updateField($userId, 'personality_configured', true, $clerkId);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("PersonalityConfigManager::setPersonalityFromUpload error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Set personality from pasted text
     */
    public function setPersonalityFromText($userId, $text, $clerkId = null) {
        return $this->setPersonalityFromUpload($userId, ['text' => $text], $clerkId);
    }
    
    /**
     * Analyze conversation data to extract personality traits
     */
    private function analyzeConversationData($conversationData) {
        // Simple analysis - in production, this could use NLP/AI
        $text = '';
        
        if (is_string($conversationData)) {
            $text = $conversationData;
        } elseif (is_array($conversationData)) {
            if (isset($conversationData['text'])) {
                $text = $conversationData['text'];
            } else {
                $text = json_encode($conversationData);
            }
        }
        
        $textLower = strtolower($text);
        
        // Analyze tone and traits
        $traits = [];
        $tone = 'neutral';
        $formality = 'semi-formal';
        
        // Detect traits based on keywords
        if (preg_match('/\b(enthusiastic|excited|awesome|great|fantastic)\b/i', $text)) {
            $traits[] = 'enthusiastic';
            $tone = 'energetic';
        }
        
        if (preg_match('/\b(please|thank you|appreciate|grateful)\b/i', $text)) {
            $traits[] = 'courteous';
            $formality = 'formal';
        }
        
        if (preg_match('/\b(lol|haha|funny|joke)\b/i', $text)) {
            $traits[] = 'humorous';
            $tone = 'casual';
            $formality = 'informal';
        }
        
        if (preg_match('/\b(understand|help|support|assist)\b/i', $text)) {
            $traits[] = 'helpful';
        }
        
        return [
            'name' => 'Custom',
            'description' => 'Custom personality based on uploaded conversations',
            'traits' => !empty($traits) ? $traits : ['professional', 'helpful'],
            'tone' => $tone,
            'formality' => $formality,
            'analyzed_from' => substr($text, 0, 200) // Store sample for reference
        ];
    }
    
    /**
     * Deactivate existing personality
     */
    private function deactivatePersonality($userId) {
        try {
            $query = "
                UPDATE personality_config 
                SET is_active = FALSE, updated_at = NOW()
                WHERE user_id = :user_id AND is_active = TRUE
            ";
            
            $this->queryHelper->query($query, ['user_id' => $userId]);
        } catch (Exception $e) {
            error_log("PersonalityConfigManager::deactivatePersonality error: " . $e->getMessage());
        }
    }
    
    /**
     * Get available preset personalities
     */
    public static function getPresetPersonalities() {
        return self::PRESET_PERSONALITIES;
    }
    
    /**
     * Get personality config for use in DONNA responses
     */
    public function getPersonalityForDONNA($userId, $clerkId = null) {
        $config = $this->getPersonalityConfig($userId, $clerkId);
        
        if (!$config) {
            // Return default personality
            return self::PRESET_PERSONALITIES['professional'];
        }
        
        return $config['config_data'];
    }
    
    /**
     * Check if user has personality configured
     */
    public function hasPersonalityConfigured($userId, $clerkId = null) {
        $config = $this->getPersonalityConfig($userId, $clerkId);
        return $config !== null;
    }
}
?>

