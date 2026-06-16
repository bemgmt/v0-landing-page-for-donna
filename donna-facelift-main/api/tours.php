<?php
/**
 * Tour System API
 * Handles tour commands, state management, and module access
 */

require_once __DIR__ . '/../bootstrap_env.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../lib/TourController.php';
require_once __DIR__ . '/../lib/TourModuleRegistry.php';
require_once __DIR__ . '/../lib/IntentDetector.php';
require_once __DIR__ . '/../lib/ApiResponder.php';

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
    
    $tourController = new TourController();
    $moduleRegistry = new TourModuleRegistry();
    
    // GET: Get tour information
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'status';
        
        switch ($action) {
            case 'status':
                $activeTour = $tourController->getActiveTour($userId, $clerkId);
                
                if ($activeTour) {
                    $module = $moduleRegistry->getModule($activeTour['tour_module_id']);
                    $stepData = null;
                    
                    if ($activeTour['current_step_id']) {
                        $stepData = $moduleRegistry->getStepData($activeTour['tour_module_id'], $activeTour['current_step_id']);
                    }
                    
                    ApiResponder::jsonSuccess([
                        'active_tour' => $activeTour,
                        'module' => $moduleRegistry->getModuleMetadata($activeTour['tour_module_id']),
                        'current_step' => $stepData
                    ]);
                } else {
                    ApiResponder::jsonSuccess([
                        'active_tour' => null,
                        'message' => 'No active tour'
                    ]);
                }
                break;
                
            case 'modules':
                $modules = $moduleRegistry->getAllModules();
                ApiResponder::jsonSuccess([
                    'modules' => $modules
                ]);
                break;
                
            case 'module':
                $moduleId = $_GET['module_id'] ?? null;
                if (!$moduleId) {
                    ApiResponder::jsonBadRequest('module_id is required');
                }
                
                $module = $moduleRegistry->getModule($moduleId);
                if (!$module) {
                    ApiResponder::jsonNotFound('Tour module not found');
                }
                
                ApiResponder::jsonSuccess([
                    'module' => $module
                ]);
                break;
                
            case 'steps':
                $moduleId = $_GET['module_id'] ?? null;
                if (!$moduleId) {
                    ApiResponder::jsonBadRequest('module_id is required');
                }
                
                $steps = $moduleRegistry->getModuleSteps($moduleId);
                ApiResponder::jsonSuccess([
                    'steps' => $steps
                ]);
                break;
                
            default:
                ApiResponder::jsonBadRequest('Invalid action');
        }
    }
    
    // POST: Process tour commands
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            ApiResponder::jsonBadRequest('Invalid JSON input');
        }
        
        $command = $input['command'] ?? null;
        $message = $input['message'] ?? null;
        
        // If message is provided, detect intent
        if ($message && !$command) {
            $intent = IntentDetector::detectIntent($message);
            
            if ($intent) {
                $commandType = IntentDetector::getCommandType($intent);
                $moduleId = IntentDetector::getTourModuleId($intent);
                
                if ($commandType === 'start' && $moduleId) {
                    $result = $tourController->startTour($userId, $moduleId, 'section', $clerkId);
                    
                    // Log command
                    $tourController->logCommand(
                        $userId,
                        $commandType,
                        $message,
                        $intent,
                        $result,
                        $result['session']['id'] ?? null,
                        $clerkId
                    );
                    
                    ApiResponder::jsonSuccess($result);
                    exit;
                } else {
                    $command = $commandType;
                }
            } else {
                ApiResponder::jsonBadRequest('Could not detect tour intent from message');
            }
        }
        
        if (!$command) {
            ApiResponder::jsonBadRequest('Command is required');
        }
        
        // Process command
        $commandData = $input['data'] ?? [];
        $result = $tourController->processCommand($userId, $command, $commandData, $clerkId);
        
        // Log command
        $activeTour = $tourController->getActiveTour($userId, $clerkId);
        $tourController->logCommand(
            $userId,
            $command,
            $message ?? '',
            null,
            $result,
            $activeTour['id'] ?? null,
            $clerkId
        );
        
        ApiResponder::jsonSuccess($result);
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

