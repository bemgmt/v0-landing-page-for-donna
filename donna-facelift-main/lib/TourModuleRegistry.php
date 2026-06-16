<?php
/**
 * Tour Module Registry
 * Manages tour modules as independent, callable units
 */

require_once __DIR__ . '/DataAccessFactory.php';
require_once __DIR__ . '/DatabaseQueryHelper.php';

class TourModuleRegistry {
    private $dal;
    private $queryHelper;
    
    public function __construct() {
        $this->dal = DataAccessFactory::create();
        $this->queryHelper = new DatabaseQueryHelper();
    }
    
    /**
     * Get all active tour modules
     */
    public function getAllModules() {
        try {
            $query = "
                SELECT * FROM tour_modules 
                WHERE is_active = TRUE
                ORDER BY order_index ASC, module_name ASC
            ";
            
            $result = $this->queryHelper->query($query);
            
            // Decode JSONB fields
            foreach ($result as &$module) {
                $module['step_sequence'] = is_string($module['step_sequence']) 
                    ? json_decode($module['step_sequence'], true) 
                    : $module['step_sequence'];
                
                $module['text_payload'] = is_string($module['text_payload']) 
                    ? json_decode($module['text_payload'], true) 
                    : $module['text_payload'];
                
                $module['ui_hooks'] = is_string($module['ui_hooks']) 
                    ? json_decode($module['ui_hooks'], true) 
                    : $module['ui_hooks'];
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("TourModuleRegistry::getAllModules error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get tour module by ID
     */
    public function getModule($moduleId) {
        try {
            $query = "
                SELECT * FROM tour_modules 
                WHERE module_id = :module_id AND is_active = TRUE
            ";
            
            $result = $this->dal->query($query, ['module_id' => $moduleId]);
            
            if (empty($result)) {
                return null;
            }
            
            $module = $result[0];
            
            // Decode JSONB fields
            $module['step_sequence'] = is_string($module['step_sequence']) 
                ? json_decode($module['step_sequence'], true) 
                : $module['step_sequence'];
            
            $module['text_payload'] = is_string($module['text_payload']) 
                ? json_decode($module['text_payload'], true) 
                : $module['text_payload'];
            
            $module['ui_hooks'] = is_string($module['ui_hooks']) 
                ? json_decode($module['ui_hooks'], true) 
                : $module['ui_hooks'];
            
            return $module;
        } catch (Exception $e) {
            error_log("TourModuleRegistry::getModule error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get module by section ID
     */
    public function getModuleBySection($sectionId) {
        try {
            $query = "
                SELECT * FROM tour_modules 
                WHERE section_id = :section_id AND is_active = TRUE
                ORDER BY order_index ASC
                LIMIT 1
            ";
            
            $result = $this->dal->query($query, ['section_id' => $sectionId]);
            
            if (empty($result)) {
                return null;
            }
            
            $module = $result[0];
            
            // Decode JSONB fields
            $module['step_sequence'] = is_string($module['step_sequence']) 
                ? json_decode($module['step_sequence'], true) 
                : $module['step_sequence'];
            
            $module['text_payload'] = is_string($module['text_payload']) 
                ? json_decode($module['text_payload'], true) 
                : $module['text_payload'];
            
            $module['ui_hooks'] = is_string($module['ui_hooks']) 
                ? json_decode($module['ui_hooks'], true) 
                : $module['ui_hooks'];
            
            return $module;
        } catch (Exception $e) {
            error_log("TourModuleRegistry::getModuleBySection error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Register a new tour module
     */
    public function registerModule($moduleData) {
        try {
            $requiredFields = ['module_id', 'module_name', 'section_id', 'step_sequence', 'text_payload'];
            
            foreach ($requiredFields as $field) {
                if (!isset($moduleData[$field])) {
                    throw new InvalidArgumentException("Missing required field: $field");
                }
            }
            
            $query = "
                INSERT INTO tour_modules 
                (module_id, module_name, module_description, section_id, step_sequence, text_payload, ui_hooks, order_index, is_active)
                VALUES 
                (:module_id, :module_name, :module_description, :section_id, :step_sequence, :text_payload, :ui_hooks, :order_index, :is_active)
                ON CONFLICT (module_id) DO UPDATE SET
                    module_name = EXCLUDED.module_name,
                    module_description = EXCLUDED.module_description,
                    section_id = EXCLUDED.section_id,
                    step_sequence = EXCLUDED.step_sequence,
                    text_payload = EXCLUDED.text_payload,
                    ui_hooks = EXCLUDED.ui_hooks,
                    order_index = EXCLUDED.order_index,
                    is_active = EXCLUDED.is_active,
                    updated_at = NOW()
                RETURNING *
            ";
            
            $result = $this->dal->query($query, [
                'module_id' => $moduleData['module_id'],
                'module_name' => $moduleData['module_name'],
                'module_description' => $moduleData['module_description'] ?? null,
                'section_id' => $moduleData['section_id'],
                'step_sequence' => json_encode($moduleData['step_sequence']),
                'text_payload' => json_encode($moduleData['text_payload']),
                'ui_hooks' => json_encode($moduleData['ui_hooks'] ?? []),
                'order_index' => $moduleData['order_index'] ?? 0,
                'is_active' => $moduleData['is_active'] ?? true
            ]);
            
            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("TourModuleRegistry::registerModule error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get step data for a module
     */
    public function getStepData($moduleId, $stepId) {
        $module = $this->getModule($moduleId);
        
        if (!$module) {
            return null;
        }
        
        $steps = $module['step_sequence'] ?? [];
        
        foreach ($steps as $step) {
            if (isset($step['step_id']) && $step['step_id'] === $stepId) {
                return [
                    'step' => $step,
                    'text' => $module['text_payload'][$stepId] ?? null,
                    'ui_hooks' => $module['ui_hooks'][$stepId] ?? null
                ];
            }
        }
        
        return null;
    }
    
    /**
     * Get all steps for a module
     */
    public function getModuleSteps($moduleId) {
        $module = $this->getModule($moduleId);
        
        if (!$module) {
            return [];
        }
        
        $steps = $module['step_sequence'] ?? [];
        $result = [];
        
        foreach ($steps as $step) {
            $stepId = $step['step_id'] ?? null;
            if ($stepId) {
                $result[] = [
                    'step_id' => $stepId,
                    'title' => $step['title'] ?? null,
                    'description' => $step['description'] ?? null,
                    'text' => $module['text_payload'][$stepId] ?? null,
                    'ui_hooks' => $module['ui_hooks'][$stepId] ?? null
                ];
            }
        }
        
        return $result;
    }
    
    /**
     * Get module metadata (without full step data)
     */
    public function getModuleMetadata($moduleId) {
        $module = $this->getModule($moduleId);
        
        if (!$module) {
            return null;
        }
        
        return [
            'module_id' => $module['module_id'],
            'module_name' => $module['module_name'],
            'module_description' => $module['module_description'],
            'section_id' => $module['section_id'],
            'step_count' => count($module['step_sequence'] ?? [])
        ];
    }
}
?>

