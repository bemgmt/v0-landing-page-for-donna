<?php
/**
 * Onboarding API
 * Handles onboarding state management and conversational intake
 */

require_once __DIR__ . '/../../bootstrap_env.php';
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../../lib/OnboardingStateManager.php';
require_once __DIR__ . '/../../lib/ConversationalIntakeHandler.php';
require_once __DIR__ . '/../../lib/ApiResponder.php';

// CORS and authentication
$auth = donna_cors_and_auth();

// Only allow POST and GET requests
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $userId = $auth['user_id'] ?? null;
    $clerkId = $auth['claims']['sub'] ?? $userId;
    
    if (!$userId) {
        ApiResponder::jsonUnauthorized('User not authenticated');
    }
    
    $onboardingManager = new OnboardingStateManager();
    $intakeHandler = new ConversationalIntakeHandler();
    
    // GET: Get onboarding state
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'status';
        
        switch ($action) {
            case 'status':
                $state = $onboardingManager->getOnboardingState($userId, $clerkId);
                $progress = $onboardingManager->getProgress($userId, $clerkId);
                $missingFields = $onboardingManager->getMissingFields($userId, $clerkId);
                $nextStep = $onboardingManager->getNextStep($userId, $clerkId);
                
                ApiResponder::jsonSuccess([
                    'onboarding_state' => $state,
                    'progress' => $progress,
                    'missing_fields' => $missingFields,
                    'next_step' => $nextStep,
                    'is_completed' => $onboardingManager->isOnboardingCompleted($userId, $clerkId),
                    'is_first_time' => $onboardingManager->isFirstTimeUser($userId, $clerkId)
                ]);
                break;
                
            case 'next_question':
                $nextStep = $onboardingManager->getNextStep($userId, $clerkId);
                if ($nextStep) {
                    $question = $intakeHandler->generateQuestionForStep($nextStep);
                    ApiResponder::jsonSuccess($question);
                } else {
                    ApiResponder::jsonSuccess([
                        'action' => 'onboarding_complete',
                        'message' => 'Onboarding is complete!'
                    ]);
                }
                break;
                
            default:
                ApiResponder::jsonBadRequest('Invalid action');
        }
    }
    
    // POST: Process onboarding response
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            ApiResponder::jsonBadRequest('Invalid JSON input');
        }
        
        $action = $input['action'] ?? 'process_response';
        
        switch ($action) {
            case 'process_response':
                $message = $input['message'] ?? '';
                $currentStep = $input['current_step'] ?? null;
                
                if (empty($message)) {
                    ApiResponder::jsonBadRequest('Message is required');
                }
                
                // Get current step if not provided
                if (!$currentStep) {
                    $state = $onboardingManager->getOnboardingState($userId, $clerkId);
                    $currentStep = $state['current_step'] ?? null;
                }
                
                $result = $intakeHandler->processResponse($userId, $message, $currentStep, $clerkId);
                
                // Update current step if needed
                if (isset($result['next_step'])) {
                    $onboardingManager->setCurrentStep($userId, $result['next_step'], $clerkId);
                }
                
                ApiResponder::jsonSuccess($result);
                break;
                
            case 'update_field':
                $field = $input['field'] ?? null;
                $value = $input['value'] ?? null;
                
                if (!$field || $value === null) {
                    ApiResponder::jsonBadRequest('Field and value are required');
                }
                
                $result = $onboardingManager->updateField($userId, $field, $value, $clerkId);
                
                if ($result) {
                    ApiResponder::jsonSuccess([
                        'field' => $field,
                        'value' => $value,
                        'state' => $result
                    ]);
                } else {
                    ApiResponder::jsonServerError('Failed to update field');
                }
                break;
                
            case 'confirm_data':
                $field = $input['field'] ?? null;
                $value = $input['value'] ?? null;
                
                if (!$field || $value === null) {
                    ApiResponder::jsonBadRequest('Field and value are required');
                }
                
                $result = $intakeHandler->confirmData($userId, $field, $value, $clerkId);
                ApiResponder::jsonSuccess($result);
                break;
                
            case 'complete':
                $result = $onboardingManager->completeOnboarding($userId, $clerkId);
                
                if ($result) {
                    ApiResponder::jsonSuccess([
                        'message' => 'Onboarding completed successfully',
                        'state' => $result
                    ]);
                } else {
                    ApiResponder::jsonServerError('Failed to complete onboarding');
                }
                break;
                
            case 'reset':
                // Only allow reset in development or with admin permission
                if (getenv('ENVIRONMENT') !== 'development' && !($auth['is_admin'] ?? false)) {
                    ApiResponder::jsonForbiddenError('Reset is only allowed in development');
                }
                
                $result = $onboardingManager->resetOnboarding($userId, $clerkId);
                
                if ($result) {
                    ApiResponder::jsonSuccess([
                        'message' => 'Onboarding reset successfully',
                        'state' => $result
                    ]);
                } else {
                    ApiResponder::jsonServerError('Failed to reset onboarding');
                }
                break;
                
            default:
                ApiResponder::jsonBadRequest('Invalid action');
        }
    }
    
    else {
        ApiResponder::jsonMethodNotAllowed('Only GET and POST methods are allowed');
    }
    
} catch (Exception $e) {
    if (getenv('SENTRY_DSN')) {
        try {
            \Sentry\captureException($e);
        } catch (\Throwable $t) {}
    }
    
    ApiResponder::jsonServerError('An error occurred: ' . $e->getMessage());
}

