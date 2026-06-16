<?php
/**
 * Conversational Intake Handler
 * Handles natural language onboarding conversations
 */

require_once __DIR__ . '/OnboardingStateManager.php';

class ConversationalIntakeHandler {
    private $onboardingManager;
    
    public function __construct() {
        $this->onboardingManager = new OnboardingStateManager();
    }
    
    /**
     * Process user response in conversational onboarding
     */
    public function processResponse($userId, $message, $currentStep = null, $clerkId = null) {
        $messageLower = strtolower(trim($message));
        
        // Check for skip/later/not now responses
        if ($this->isSkipResponse($messageLower)) {
            return [
                'action' => 'skip',
                'step' => $currentStep,
                'message' => "No problem! We can come back to this later. What would you like to do next?",
                'next_step' => $this->onboardingManager->getNextStep($userId, $clerkId)
            ];
        }
        
        // If no current step, determine what to ask
        if (!$currentStep) {
            $nextStep = $this->onboardingManager->getNextStep($userId, $clerkId);
            return $this->generateQuestionForStep($nextStep);
        }
        
        // Process response for current step
        switch ($currentStep) {
            case 'name':
                return $this->processNameResponse($userId, $message, $clerkId);
                
            case 'business_name':
                return $this->processBusinessNameResponse($userId, $message, $clerkId);
                
            case 'personality':
                return $this->processPersonalityResponse($userId, $message, $clerkId);
                
            default:
                return [
                    'action' => 'unknown_step',
                    'message' => "I'm not sure what step we're on. Let me help you get started!"
                ];
        }
    }
    
    /**
     * Check if message is a skip/later/not now response
     */
    private function isSkipResponse($message) {
        $skipPatterns = [
            'skip', 'later', 'not now', "don't", "do not", 'maybe later',
            'not right now', 'pass', 'next', 'continue', 'move on'
        ];
        
        foreach ($skipPatterns as $pattern) {
            if (strpos($message, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Process name response
     */
    private function processNameResponse($userId, $message, $clerkId) {
        // Extract name from message (simple extraction)
        $name = $this->extractName($message);
        
        if (empty($name)) {
            return [
                'action' => 'clarify',
                'step' => 'name',
                'message' => "I didn't catch your name. Could you tell me what you'd like me to call you?",
                'requires_confirmation' => false
            ];
        }
        
        // Save the name
        $this->onboardingManager->updateField($userId, 'name', $name, $clerkId);
        
        // Get next step
        $nextStep = $this->onboardingManager->getNextStep($userId, $clerkId);
        
        return [
            'action' => 'field_completed',
            'step' => 'name',
            'field' => 'name',
            'value' => $name,
            'message' => "Nice to meet you, $name! " . ($nextStep ? $this->generateQuestionForStep($nextStep)['message'] : "Let's continue."),
            'next_step' => $nextStep,
            'requires_confirmation' => true
        ];
    }
    
    /**
     * Process business name response
     */
    private function processBusinessNameResponse($userId, $message, $clerkId) {
        $businessName = $this->extractBusinessName($message);
        
        if (empty($businessName)) {
            return [
                'action' => 'clarify',
                'step' => 'business_name',
                'message' => "What's the name of your business?",
                'requires_confirmation' => false
            ];
        }
        
        // Save the business name
        $this->onboardingManager->updateField($userId, 'business_name', $businessName, $clerkId);
        
        // Get next step
        $nextStep = $this->onboardingManager->getNextStep($userId, $clerkId);
        
        return [
            'action' => 'field_completed',
            'step' => 'business_name',
            'field' => 'business_name',
            'value' => $businessName,
            'message' => "Got it! $businessName. " . ($nextStep ? $this->generateQuestionForStep($nextStep)['message'] : "Great!"),
            'next_step' => $nextStep,
            'requires_confirmation' => true
        ];
    }
    
    /**
     * Process personality response
     */
    private function processPersonalityResponse($userId, $message, $clerkId) {
        // This will be handled by PersonalityConfigManager
        // For now, just acknowledge
        return [
            'action' => 'personality_prompt',
            'step' => 'personality',
            'message' => "I see you're ready to configure my personality. Would you like to upload sample conversations or choose from preset personas?",
            'options' => ['upload', 'preset']
        ];
    }
    
    /**
     * Generate question for a specific step
     */
    public function generateQuestionForStep($step) {
        switch ($step) {
            case 'name':
                return [
                    'action' => 'ask_field',
                    'step' => 'name',
                    'message' => "Hi! I'm DONNA. What should I call you?",
                    'field' => 'name'
                ];
                
            case 'business_name':
                return [
                    'action' => 'ask_field',
                    'step' => 'business_name',
                    'message' => "What's the name of your business?",
                    'field' => 'business_name'
                ];
                
            case 'personality':
                return [
                    'action' => 'ask_field',
                    'step' => 'personality',
                    'message' => "How would you like me to sound? You can upload sample conversations or choose from preset personas like 'sales-driven', 'professional', or 'humorous'.",
                    'field' => 'personality'
                ];
                
            default:
                return [
                    'action' => 'onboarding_complete',
                    'message' => "Great! Your onboarding is complete. How can I help you today?"
                ];
        }
    }
    
    /**
     * Extract name from message
     */
    private function extractName($message) {
        // Remove common prefixes
        $message = preg_replace('/^(my name is|i\'m|i am|call me|it\'s|this is)\s+/i', '', trim($message));
        
        // Take first word or first two words as name
        $words = explode(' ', trim($message));
        if (count($words) >= 2) {
            return ucwords($words[0] . ' ' . $words[1]);
        } elseif (count($words) === 1) {
            return ucwords($words[0]);
        }
        
        return trim($message);
    }
    
    /**
     * Extract business name from message
     */
    private function extractBusinessName($message) {
        // Remove common prefixes
        $message = preg_replace('/^(my business is|it\'s|the name is|called|it is)\s+/i', '', trim($message));
        
        // Take the message as business name (could be improved with NLP)
        return trim($message);
    }
    
    /**
     * Confirm captured data before saving
     */
    public function confirmData($userId, $field, $value, $clerkId = null) {
        $this->onboardingManager->updateField($userId, $field, $value, $clerkId);
        
        return [
            'action' => 'confirmed',
            'field' => $field,
            'value' => $value,
            'message' => "Perfect! I've saved that. " . $this->getNextQuestion($userId, $clerkId)
        ];
    }
    
    /**
     * Get next question after confirmation
     */
    private function getNextQuestion($userId, $clerkId) {
        $nextStep = $this->onboardingManager->getNextStep($userId, $clerkId);
        
        if ($nextStep) {
            $question = $this->generateQuestionForStep($nextStep);
            return $question['message'];
        }
        
        // Check if onboarding is complete
        if ($this->onboardingManager->isOnboardingCompleted($userId, $clerkId)) {
            return "Your onboarding is complete! How can I help you today?";
        }
        
        return "What would you like to do next?";
    }
}
?>

