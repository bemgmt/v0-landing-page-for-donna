<?php
/**
 * Intent Detector
 * Detects tour-related intents from user messages
 */

class IntentDetector {
    // Intent patterns
    private static $INTENT_PATTERNS = [
        'full_tour' => [
            'patterns' => [
                '/give me a tour/i',
                '/show me around/i',
                '/walk me through/i',
                '/tour of/i',
                '/show me everything/i',
                '/guide me/i',
                '/onboarding/i',
                '/how does this work/i'
            ],
            'confidence' => 0.9
        ],
        'section_tour' => [
            'patterns' => [
                '/explain the (.+) tab/i',
                '/help me with (.+)/i',
                '/how does (.+) work/i',
                '/show me (.+)/i',
                '/tour of (.+)/i',
                '/walk me through (.+)/i'
            ],
            'confidence' => 0.85
        ],
        'tour_stop' => [
            'patterns' => [
                '/stop (the )?tour/i',
                '/end (the )?tour/i',
                '/cancel (the )?tour/i',
                '/quit (the )?tour/i'
            ],
            'confidence' => 0.95
        ],
        'tour_next' => [
            'patterns' => [
                '/next (step|part)/i',
                '/continue (the )?tour/i',
                '/skip (this|that)/i',
                '/move on/i'
            ],
            'confidence' => 0.9
        ],
        'tour_pause' => [
            'patterns' => [
                '/pause (the )?tour/i',
                '/hold on/i',
                '/wait/i'
            ],
            'confidence' => 0.8
        ],
        'tour_resume' => [
            'patterns' => [
                '/resume (the )?tour/i',
                '/continue/i',
                '/keep going/i'
            ],
            'confidence' => 0.85
        ]
    ];
    
    // Section mappings
    private static $SECTION_MAPPINGS = [
        'dashboard' => ['dashboard', 'main', 'home', 'overview'],
        'marketing' => ['marketing', 'campaign', 'email campaign', 'sms'],
        'inbox' => ['inbox', 'messages', 'email', 'mail'],
        'sales' => ['sales', 'leads', 'prospects', 'deals'],
        'secretary' => ['secretary', 'assistant', 'tasks', 'calendar']
    ];
    
    /**
     * Detect intent from user message
     */
    public static function detectIntent($message) {
        $message = trim($message);
        
        if (empty($message)) {
            return null;
        }
        
        $detectedIntents = [];
        
        // Check each intent type
        foreach (self::$INTENT_PATTERNS as $intentType => $config) {
            foreach ($config['patterns'] as $pattern) {
                if (preg_match($pattern, $message, $matches)) {
                    $intent = [
                        'intent' => $intentType,
                        'confidence' => $config['confidence'],
                        'original_message' => $message,
                        'matches' => $matches
                    ];
                    
                    // Extract section/module for section_tour
                    if ($intentType === 'section_tour' && isset($matches[1])) {
                        $intent['section'] = self::mapSection($matches[1]);
                        $intent['module_id'] = self::getModuleIdForSection($intent['section']);
                    }
                    
                    $detectedIntents[] = $intent;
                }
            }
        }
        
        if (empty($detectedIntents)) {
            return null;
        }
        
        // Return highest confidence intent
        usort($detectedIntents, function($a, $b) {
            return $b['confidence'] <=> $a['confidence'];
        });
        
        return $detectedIntents[0];
    }
    
    /**
     * Map detected section name to standard section ID
     */
    private static function mapSection($sectionName) {
        $sectionLower = strtolower(trim($sectionName));
        
        foreach (self::$SECTION_MAPPINGS as $sectionId => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($sectionLower, $keyword) !== false) {
                    return $sectionId;
                }
            }
        }
        
        // Default to dashboard if no match
        return 'dashboard';
    }
    
    /**
     * Get module ID for a section
     */
    private static function getModuleIdForSection($sectionId) {
        $moduleMap = [
            'dashboard' => 'tour_dashboard',
            'marketing' => 'tour_marketing',
            'inbox' => 'tour_inbox',
            'sales' => 'tour_sales',
            'secretary' => 'tour_secretary'
        ];
        
        return $moduleMap[$sectionId] ?? 'tour_dashboard';
    }
    
    /**
     * Check if message is a tour command
     */
    public static function isTourCommand($message) {
        $intent = self::detectIntent($message);
        return $intent !== null;
    }
    
    /**
     * Extract tour module ID from intent
     */
    public static function getTourModuleId($intent) {
        if (!$intent) {
            return null;
        }
        
        if (isset($intent['module_id'])) {
            return $intent['module_id'];
        }
        
        if ($intent['intent'] === 'full_tour') {
            return 'tour_dashboard'; // Default to dashboard for full tour
        }
        
        return null;
    }
    
    /**
     * Get all supported intents
     */
    public static function getSupportedIntents() {
        return array_keys(self::$INTENT_PATTERNS);
    }
    
    /**
     * Get command type from intent
     */
    public static function getCommandType($intent) {
        if (!$intent) {
            return null;
        }
        
        $commandMap = [
            'full_tour' => 'start',
            'section_tour' => 'start',
            'tour_stop' => 'stop',
            'tour_next' => 'next',
            'tour_pause' => 'pause',
            'tour_resume' => 'resume'
        ];
        
        return $commandMap[$intent['intent']] ?? null;
    }
}
?>

