<?php
/**
 * Tour Controller
 * Manages tour state, commands, and execution
 */

require_once __DIR__ . '/DataAccessFactory.php';
require_once __DIR__ . '/DatabaseQueryHelper.php';
require_once __DIR__ . '/TourModuleRegistry.php';
require_once __DIR__ . '/IntentDetector.php';

class TourController {
    private $dal;
    private $queryHelper;
    private $moduleRegistry;
    
    public function __construct() {
        $this->dal = DataAccessFactory::create();
        $this->queryHelper = new DatabaseQueryHelper();
        $this->moduleRegistry = new TourModuleRegistry();
    }
    
    /**
     * Start a tour
     */
    public function startTour($userId, $moduleId, $tourType = 'section', $clerkId = null) {
        try {
            // Check if there's an active tour
            $activeTour = $this->getActiveTour($userId, $clerkId);
            if ($activeTour && $activeTour['status'] === 'running') {
                return [
                    'success' => false,
                    'error' => 'A tour is already running',
                    'active_tour' => $activeTour
                ];
            }
            
            // Get module
            $module = $this->moduleRegistry->getModule($moduleId);
            if (!$module) {
                return [
                    'success' => false,
                    'error' => "Tour module not found: $moduleId"
                ];
            }
            
            // Create tour session
            $query = "
                INSERT INTO tour_sessions 
                (user_id, clerk_id, tour_module_id, tour_type, status, started_at, current_step_index, current_step_id)
                VALUES (:user_id, :clerk_id, :tour_module_id, :tour_type, 'running', NOW(), 0, :current_step_id)
                RETURNING *
            ";
            
            $steps = $module['step_sequence'] ?? [];
            $firstStepId = !empty($steps) && isset($steps[0]['step_id']) ? $steps[0]['step_id'] : null;
            
            $result = $this->queryHelper->query($query, [
                'user_id' => $userId,
                'clerk_id' => $clerkId ?? $userId,
                'tour_module_id' => $moduleId,
                'tour_type' => $tourType,
                'current_step_id' => $firstStepId
            ]);
            
            if (empty($result)) {
                return [
                    'success' => false,
                    'error' => 'Failed to create tour session'
                ];
            }
            
            $session = $result[0];
            
            // Get first step data
            $stepData = $this->moduleRegistry->getStepData($moduleId, $firstStepId);
            
            return [
                'success' => true,
                'session' => $session,
                'module' => $this->moduleRegistry->getModuleMetadata($moduleId),
                'current_step' => $stepData,
                'total_steps' => count($steps)
            ];
        } catch (Exception $e) {
            error_log("TourController::startTour error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get active tour for user
     */
    public function getActiveTour($userId, $clerkId = null) {
        try {
            $query = "
                SELECT * FROM tour_sessions 
                WHERE user_id = :user_id AND status IN ('running', 'paused')
                ORDER BY started_at DESC
                LIMIT 1
            ";
            
            $result = $this->queryHelper->query($query, ['user_id' => $userId]);
            
            if (empty($result)) {
                return null;
            }
            
            $session = $result[0];
            
            // Decode JSONB fields
            $session['completed_steps'] = is_string($session['completed_steps']) 
                ? json_decode($session['completed_steps'], true) 
                : $session['completed_steps'];
            
            $session['skipped_steps'] = is_string($session['skipped_steps']) 
                ? json_decode($session['skipped_steps'], true) 
                : $session['skipped_steps'];
            
            return $session;
        } catch (Exception $e) {
            error_log("TourController::getActiveTour error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Process tour command
     */
    public function processCommand($userId, $commandType, $commandData = [], $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            switch ($commandType) {
                case 'start':
                    $moduleId = $commandData['module_id'] ?? 'tour_dashboard';
                    $tourType = $commandData['tour_type'] ?? 'section';
                    return $this->startTour($userId, $moduleId, $tourType, $clerkId);
                    
                case 'stop':
                case 'cancel':
                    return $this->stopTour($userId, $clerkId);
                    
                case 'next':
                    return $this->nextStep($userId, $clerkId);
                    
                case 'skip':
                    $stepId = $commandData['step_id'] ?? null;
                    return $this->skipStep($userId, $stepId, $clerkId);
                    
                case 'pause':
                    return $this->pauseTour($userId, $clerkId);
                    
                case 'resume':
                    return $this->resumeTour($userId, $clerkId);
                    
                default:
                    return [
                        'success' => false,
                        'error' => "Unknown command: $commandType"
                    ];
            }
        } catch (Exception $e) {
            error_log("TourController::processCommand error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Stop/cancel tour
     */
    public function stopTour($userId, $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            if (!$activeTour) {
                return [
                    'success' => false,
                    'error' => 'No active tour to stop'
                ];
            }
            
            $query = "
                UPDATE tour_sessions 
                SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
                WHERE id = :session_id
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, ['session_id' => $activeTour['id']]);
            
            return [
                'success' => true,
                'session' => $result[0] ?? null,
                'message' => 'Tour stopped'
            ];
        } catch (Exception $e) {
            error_log("TourController::stopTour error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Move to next step
     */
    public function nextStep($userId, $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            if (!$activeTour) {
                return [
                    'success' => false,
                    'error' => 'No active tour'
                ];
            }
            
            if ($activeTour['status'] !== 'running') {
                return [
                    'success' => false,
                    'error' => 'Tour is not running'
                ];
            }
            
            // Get module and steps
            $module = $this->moduleRegistry->getModule($activeTour['tour_module_id']);
            if (!$module) {
                return [
                    'success' => false,
                    'error' => 'Tour module not found'
                ];
            }
            
            $steps = $module['step_sequence'] ?? [];
            $currentIndex = $activeTour['current_step_index'] ?? 0;
            $nextIndex = $currentIndex + 1;
            
            // Mark current step as completed
            $completedSteps = $activeTour['completed_steps'] ?? [];
            $currentStepId = $activeTour['current_step_id'];
            if ($currentStepId && !in_array($currentStepId, $completedSteps)) {
                $completedSteps[] = $currentStepId;
            }
            
            // Check if tour is complete
            if ($nextIndex >= count($steps)) {
                return $this->completeTour($userId, $clerkId);
            }
            
            // Move to next step
            $nextStep = $steps[$nextIndex];
            $nextStepId = $nextStep['step_id'] ?? null;
            
            $query = "
                UPDATE tour_sessions 
                SET current_step_index = :next_index,
                    current_step_id = :next_step_id,
                    completed_steps = :completed_steps,
                    updated_at = NOW()
                WHERE id = :session_id
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, [
                'session_id' => $activeTour['id'],
                'next_index' => $nextIndex,
                'next_step_id' => $nextStepId,
                'completed_steps' => json_encode($completedSteps)
            ]);
            
            $session = $result[0] ?? null;
            $stepData = $this->moduleRegistry->getStepData($activeTour['tour_module_id'], $nextStepId);
            
            return [
                'success' => true,
                'session' => $session,
                'current_step' => $stepData,
                'progress' => [
                    'current' => $nextIndex + 1,
                    'total' => count($steps)
                ]
            ];
        } catch (Exception $e) {
            error_log("TourController::nextStep error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Skip a step
     */
    public function skipStep($userId, $stepId = null, $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            if (!$activeTour) {
                return [
                    'success' => false,
                    'error' => 'No active tour'
                ];
            }
            
            $skippedSteps = $activeTour['skipped_steps'] ?? [];
            $stepToSkip = $stepId ?? $activeTour['current_step_id'];
            
            if ($stepToSkip && !in_array($stepToSkip, $skippedSteps)) {
                $skippedSteps[] = $stepToSkip;
            }
            
            $query = "
                UPDATE tour_sessions 
                SET skipped_steps = :skipped_steps, updated_at = NOW()
                WHERE id = :session_id
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, [
                'session_id' => $activeTour['id'],
                'skipped_steps' => json_encode($skippedSteps)
            ]);
            
            // Move to next step
            return $this->nextStep($userId, $clerkId);
        } catch (Exception $e) {
            error_log("TourController::skipStep error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Pause tour
     */
    public function pauseTour($userId, $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            if (!$activeTour || $activeTour['status'] !== 'running') {
                return [
                    'success' => false,
                    'error' => 'No running tour to pause'
                ];
            }
            
            $query = "
                UPDATE tour_sessions 
                SET status = 'paused', paused_at = NOW(), updated_at = NOW()
                WHERE id = :session_id
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, ['session_id' => $activeTour['id']]);
            
            return [
                'success' => true,
                'session' => $result[0] ?? null,
                'message' => 'Tour paused'
            ];
        } catch (Exception $e) {
            error_log("TourController::pauseTour error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Resume tour
     */
    public function resumeTour($userId, $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            if (!$activeTour || $activeTour['status'] !== 'paused') {
                return [
                    'success' => false,
                    'error' => 'No paused tour to resume'
                ];
            }
            
            $query = "
                UPDATE tour_sessions 
                SET status = 'running', paused_at = NULL, updated_at = NOW()
                WHERE id = :session_id
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, ['session_id' => $activeTour['id']]);
            
            $session = $result[0] ?? null;
            $stepData = null;
            
            if ($session && $session['current_step_id']) {
                $stepData = $this->moduleRegistry->getStepData($activeTour['tour_module_id'], $session['current_step_id']);
            }
            
            return [
                'success' => true,
                'session' => $session,
                'current_step' => $stepData,
                'message' => 'Tour resumed'
            ];
        } catch (Exception $e) {
            error_log("TourController::resumeTour error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Complete tour
     */
    private function completeTour($userId, $clerkId = null) {
        try {
            $activeTour = $this->getActiveTour($userId, $clerkId);
            
            if (!$activeTour) {
                return [
                    'success' => false,
                    'error' => 'No active tour'
                ];
            }
            
            $query = "
                UPDATE tour_sessions 
                SET status = 'completed', completed_at = NOW(), updated_at = NOW()
                WHERE id = :session_id
                RETURNING *
            ";
            
            $result = $this->queryHelper->query($query, ['session_id' => $activeTour['id']]);
            
            return [
                'success' => true,
                'session' => $result[0] ?? null,
                'message' => 'Tour completed!'
            ];
        } catch (Exception $e) {
            error_log("TourController::completeTour error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Log tour command
     */
    public function logCommand($userId, $commandType, $originalMessage, $intent, $result, $tourSessionId = null, $clerkId = null) {
        try {
            $query = "
                INSERT INTO tour_commands 
                (tour_session_id, user_id, command_type, command_data, original_message, detected_intent, confidence_score, command_result)
                VALUES (:tour_session_id, :user_id, :command_type, :command_data, :original_message, :detected_intent, :confidence_score, :command_result)
            ";
            
            $this->dal->query($query, [
                'tour_session_id' => $tourSessionId,
                'user_id' => $userId,
                'command_type' => $commandType,
                'command_data' => json_encode([]),
                'original_message' => $originalMessage,
                'detected_intent' => $intent ? ($intent['intent'] ?? null) : null,
                'confidence_score' => $intent ? ($intent['confidence'] ?? null) : null,
                'command_result' => json_encode($result)
            ]);
        } catch (Exception $e) {
            error_log("TourController::logCommand error: " . $e->getMessage());
        }
    }
}
?>

