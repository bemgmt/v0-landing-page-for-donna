<?php
/**
 * Onboarding State Manager
 * Manages onboarding state, progress tracking, and field completion
 */

require_once __DIR__ . '/DataAccessFactory.php';
require_once __DIR__ . '/DatabaseQueryHelper.php';

class OnboardingStateManager {
    private $dal;
    private $queryHelper;
    
    public function __construct() {
        $this->dal = DataAccessFactory::create();
        $this->queryHelper = new DatabaseQueryHelper();
    }
    
    /**
     * Get onboarding state for a user
     */
    public function getOnboardingState($userId, $clerkId = null) {
        try {
            $query = "
                SELECT * FROM onboarding_state 
                WHERE user_id = :user_id
            ";
            
            $params = ['user_id' => $userId];
            
            if ($clerkId) {
                $query .= " OR clerk_id = :clerk_id";
                $params['clerk_id'] = $clerkId;
            }
            
            $result = $this->queryHelper->query($query, $params);
            
            if (empty($result)) {
                return $this->initializeOnboardingState($userId, $clerkId);
            }
            
            return $result[0];
        } catch (Exception $e) {
            error_log("OnboardingStateManager::getOnboardingState error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Initialize onboarding state for a new user
     */
    public function initializeOnboardingState($userId, $clerkId) {
        try {
            $query = "
                INSERT INTO onboarding_state (user_id, clerk_id, onboarding_started_at)
                VALUES (:user_id, :clerk_id, NOW())
                ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
                RETURNING *
            ";
            
            $result = $this->dal->query($query, [
                'user_id' => $userId,
                'clerk_id' => $clerkId ?? $userId
            ]);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("OnboardingStateManager::initializeOnboardingState error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Check if user is a first-time user (no onboarding state)
     */
    public function isFirstTimeUser($userId, $clerkId = null) {
        $state = $this->getOnboardingState($userId, $clerkId);
        return $state === null || !$state['onboarding_completed'];
    }
    
    /**
     * Check if onboarding is completed
     */
    public function isOnboardingCompleted($userId, $clerkId = null) {
        $state = $this->getOnboardingState($userId, $clerkId);
        return $state && $state['onboarding_completed'] === true;
    }
    
    /**
     * Get missing onboarding fields
     */
    public function getMissingFields($userId, $clerkId = null) {
        $state = $this->getOnboardingState($userId, $clerkId);
        
        if (!$state) {
            return ['name', 'business_name', 'personality'];
        }
        
        $missing = [];
        
        if (empty($state['name'])) {
            $missing[] = 'name';
        }
        
        if (empty($state['business_name'])) {
            $missing[] = 'business_name';
        }
        
        if (!$state['personality_configured']) {
            $missing[] = 'personality';
        }
        
        // Documents are optional, so we don't include them in missing fields
        
        return $missing;
    }
    
    /**
     * Update onboarding field
     */
    public function updateField($userId, $field, $value, $clerkId = null) {
        try {
            $allowedFields = ['name', 'business_name', 'documents_uploaded', 'personality_configured', 'current_step'];
            
            if (!in_array($field, $allowedFields)) {
                throw new InvalidArgumentException("Invalid field: $field");
            }
            
            // Ensure state exists
            $this->getOnboardingState($userId, $clerkId);
            
            $query = "
                UPDATE onboarding_state 
                SET $field = :value, updated_at = NOW()
                WHERE user_id = :user_id
                RETURNING *
            ";
            
            $result = $this->dal->query($query, [
                'user_id' => $userId,
                'value' => $value
            ]);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("OnboardingStateManager::updateField error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Update step data (temporary data for current step)
     */
    public function updateStepData($userId, $stepData, $clerkId = null) {
        try {
            $this->getOnboardingState($userId, $clerkId);
            
            $query = "
                UPDATE onboarding_state 
                SET step_data = :step_data, updated_at = NOW()
                WHERE user_id = :user_id
                RETURNING *
            ";
            
            $result = $this->dal->query($query, [
                'user_id' => $userId,
                'step_data' => json_encode($stepData)
            ]);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("OnboardingStateManager::updateStepData error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Set current step
     */
    public function setCurrentStep($userId, $step, $clerkId = null) {
        return $this->updateField($userId, 'current_step', $step, $clerkId);
    }
    
    /**
     * Mark onboarding as completed
     */
    public function completeOnboarding($userId, $clerkId = null) {
        try {
            $this->getOnboardingState($userId, $clerkId);
            
            $query = "
                UPDATE onboarding_state 
                SET onboarding_completed = TRUE, 
                    onboarding_completed_at = NOW(),
                    current_step = NULL,
                    updated_at = NOW()
                WHERE user_id = :user_id
                RETURNING *
            ";
            
            $result = $this->dal->query($query, [
                'user_id' => $userId
            ]);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("OnboardingStateManager::completeOnboarding error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Reset onboarding (for testing or manual reset)
     */
    public function resetOnboarding($userId, $clerkId = null) {
        try {
            $query = "
                UPDATE onboarding_state 
                SET onboarding_completed = FALSE,
                    onboarding_completed_at = NULL,
                    current_step = NULL,
                    step_data = '{}',
                    name = NULL,
                    business_name = NULL,
                    documents_uploaded = FALSE,
                    personality_configured = FALSE,
                    updated_at = NOW()
                WHERE user_id = :user_id
                RETURNING *
            ";
            
            $result = $this->dal->query($query, [
                'user_id' => $userId
            ]);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("OnboardingStateManager::resetOnboarding error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get onboarding progress percentage
     */
    public function getProgress($userId, $clerkId = null) {
        $state = $this->getOnboardingState($userId, $clerkId);
        
        if (!$state) {
            return 0;
        }
        
        if ($state['onboarding_completed']) {
            return 100;
        }
        
        $totalFields = 3; // name, business_name, personality
        $completedFields = 0;
        
        if (!empty($state['name'])) {
            $completedFields++;
        }
        
        if (!empty($state['business_name'])) {
            $completedFields++;
        }
        
        if ($state['personality_configured']) {
            $completedFields++;
        }
        
        return round(($completedFields / $totalFields) * 100);
    }
    
    /**
     * Get next step to complete
     */
    public function getNextStep($userId, $clerkId = null) {
        $missing = $this->getMissingFields($userId, $clerkId);
        
        if (empty($missing)) {
            return null;
        }
        
        // Priority order: name -> business_name -> personality
        $priority = ['name', 'business_name', 'personality'];
        
        foreach ($priority as $field) {
            if (in_array($field, $missing)) {
                return $field;
            }
        }
        
        return $missing[0];
    }
}
?>

