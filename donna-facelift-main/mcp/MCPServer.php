<?php
/**
 * DONNA MCP (Model Context Protocol) Server
 * Handles tool registration, context management, and protocol communication
 */

require_once __DIR__ . '/../lib/DataAccessFactory.php';

class MCPServer {
    private $tools = [];
    private $sessions = [];
    private $contexts = [];
    private $config;
    private $dal;

    public function __construct($config = []) {
        $this->config = array_merge([
            'session_timeout' => 3600, // 1 hour
            'max_context_size' => 10000, // tokens
            'enable_persistence' => true,
            'storage_path' => __DIR__ . '/storage',
            'storage_type' => $_ENV['DATA_STORAGE_TYPE'] ?? 'file' // 'file' or 'database'
        ], $config);

        $this->initializeStorage();
        $this->registerCorTools();
    }
    
    private function initializeStorage() {
        if ($this->config['enable_persistence']) {
            if ($this->config['storage_type'] === 'database') {
                // Initialize database access layer
                try {
                    $this->dal = DataAccessFactory::create();
                } catch (Exception $e) {
                    // Fallback to file storage if database fails
                    $this->config['storage_type'] = 'file';
                    error_log("MCP Server: Database initialization failed, falling back to file storage: " . $e->getMessage());
                }
            }

            if ($this->config['storage_type'] === 'file') {
                $storagePath = $this->config['storage_path'];
                if (!is_dir($storagePath)) {
                    mkdir($storagePath, 0755, true);
                }

                // Create subdirectories
                foreach (['sessions', 'contexts', 'tools', 'workflows'] as $dir) {
                    $dirPath = $storagePath . '/' . $dir;
                    if (!is_dir($dirPath)) {
                        mkdir($dirPath, 0755, true);
                    }
                }
            }
        }
    }
    
    /**
     * Register a tool with the MCP server
     */
    public function registerTool($name, $tool) {
        if (!($tool instanceof MCPTool)) {
            throw new InvalidArgumentException("Tool must implement MCPTool interface");
        }
        
        $this->tools[$name] = $tool;
        $this->persistTool($name, $tool);
        
        return $this;
    }
    
    /**
     * Get available tools
     */
    public function getTools() {
        return array_keys($this->tools);
    }
    
    /**
     * Get tool information
     */
    public function getToolInfo($name) {
        if (!isset($this->tools[$name])) {
            throw new Exception("Tool '$name' not found");
        }
        
        return $this->tools[$name]->getInfo();
    }
    
    /**
     * Execute a tool
     */
    public function executeTool($name, $parameters = [], $context = []) {
        if (!isset($this->tools[$name])) {
            throw new Exception("Tool '$name' not found");
        }
        
        $tool = $this->tools[$name];
        
        // Validate parameters
        $validation = $tool->validateParameters($parameters);
        if (!$validation['valid']) {
            throw new Exception("Invalid parameters: " . implode(', ', $validation['errors']));
        }
        
        // Execute tool with context
        $result = $tool->execute($parameters, $context);
        
        // Update context if needed
        if (isset($result['context_update'])) {
            $this->updateContext($context['session_id'] ?? 'default', $result['context_update']);
        }
        
        return $result;
    }
    
    /**
     * Create or get session
     */
    public function getSession($sessionId) {
        if (!isset($this->sessions[$sessionId])) {
            $this->sessions[$sessionId] = [
                'id' => $sessionId,
                'created_at' => time(),
                'last_activity' => time(),
                'context' => [],
                'history' => [],
                'metadata' => []
            ];
            $this->persistSession($sessionId);
        }
        
        $this->sessions[$sessionId]['last_activity'] = time();
        return $this->sessions[$sessionId];
    }
    
    /**
     * Update session context
     */
    public function updateContext($sessionId, $contextUpdate) {
        $session = $this->getSession($sessionId);
        
        if (is_array($contextUpdate)) {
            $session['context'] = array_merge($session['context'], $contextUpdate);
        }
        
        // Trim context if too large
        $contextSize = strlen(json_encode($session['context']));
        if ($contextSize > $this->config['max_context_size']) {
            $this->trimContext($sessionId);
        }
        
        $this->sessions[$sessionId] = $session;
        $this->persistSession($sessionId);
    }
    
    /**
     * Process MCP request
     */
    public function processRequest($request) {
        try {
            $sessionId = $request['session_id'] ?? 'default';
            $session = $this->getSession($sessionId);
            
            switch ($request['type']) {
                case 'tool_list':
                    return $this->handleToolList();
                    
                case 'tool_info':
                    return $this->handleToolInfo($request['tool_name']);
                    
                case 'tool_execute':
                    return $this->handleToolExecute($request, $session);
                    
                case 'context_get':
                    return $this->handleContextGet($sessionId);
                    
                case 'context_update':
                    return $this->handleContextUpdate($request, $sessionId);
                    
                case 'workflow_execute':
                    return $this->handleWorkflowExecute($request, $session);
                    
                default:
                    throw new Exception("Unknown request type: " . $request['type']);
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    private function handleToolList() {
        $toolList = [];
        foreach ($this->tools as $name => $tool) {
            $toolList[$name] = $tool->getInfo();
        }
        
        return [
            'success' => true,
            'tools' => $toolList,
            'count' => count($toolList)
        ];
    }
    
    private function handleToolInfo($toolName) {
        return [
            'success' => true,
            'tool' => $this->getToolInfo($toolName)
        ];
    }
    
    private function handleToolExecute($request, $session) {
        $result = $this->executeTool(
            $request['tool_name'],
            $request['parameters'] ?? [],
            array_merge($session['context'], ['session_id' => $session['id']])
        );
        
        // Add to session history
        $this->addToHistory($session['id'], [
            'type' => 'tool_execution',
            'tool' => $request['tool_name'],
            'parameters' => $request['parameters'] ?? [],
            'result' => $result,
            'timestamp' => time()
        ]);
        
        return [
            'success' => true,
            'result' => $result,
            'session_id' => $session['id']
        ];
    }
    
    private function handleContextGet($sessionId) {
        $session = $this->getSession($sessionId);
        return [
            'success' => true,
            'context' => $session['context'],
            'session_id' => $sessionId
        ];
    }
    
    private function handleContextUpdate($request, $sessionId) {
        $this->updateContext($sessionId, $request['context_update']);
        return [
            'success' => true,
            'message' => 'Context updated',
            'session_id' => $sessionId
        ];
    }
    
    private function registerCorTools() {
        // Register core tools - will be implemented in separate files
        // This is just the registration structure
    }
    
    private function persistSession($sessionId) {
        if (!$this->config['enable_persistence']) {
            return;
        }

        if ($this->config['storage_type'] === 'database' && $this->dal) {
            try {
                // Store session data in user_memory with MCP prefix
                $sessionData = $this->sessions[$sessionId];
                $this->dal->setUserMemory(
                    'mcp_system',
                    'session_' . $sessionId,
                    json_encode($sessionData),
                    'mcp_session',
                    date('Y-m-d H:i:s', time() + $this->config['session_timeout'])
                );
            } catch (Exception $e) {
                error_log("MCP Server: Failed to persist session to database: " . $e->getMessage());
                // Fallback to file storage
                $this->persistSessionToFile($sessionId);
            }
        } else {
            $this->persistSessionToFile($sessionId);
        }
    }

    private function persistSessionToFile($sessionId) {
        $filePath = $this->config['storage_path'] . '/sessions/' . $sessionId . '.json';
        file_put_contents($filePath, json_encode($this->sessions[$sessionId], JSON_PRETTY_PRINT));
    }

    private function persistTool($name, $tool) {
        if (!$this->config['enable_persistence']) {
            return;
        }

        if ($this->config['storage_type'] === 'database' && $this->dal) {
            try {
                // Store tool configuration in user_memory
                $toolInfo = $tool->getInfo();
                $this->dal->setUserMemory(
                    'mcp_system',
                    'tool_' . $name,
                    json_encode($toolInfo),
                    'mcp_tool'
                );
            } catch (Exception $e) {
                error_log("MCP Server: Failed to persist tool to database: " . $e->getMessage());
                // Fallback to file storage
                $this->persistToolToFile($name, $tool);
            }
        } else {
            $this->persistToolToFile($name, $tool);
        }
    }

    private function persistToolToFile($name, $tool) {
        $filePath = $this->config['storage_path'] . '/tools/' . $name . '.json';
        file_put_contents($filePath, json_encode($tool->getInfo(), JSON_PRETTY_PRINT));
    }
    
    private function addToHistory($sessionId, $entry) {
        if (!isset($this->sessions[$sessionId]['history'])) {
            $this->sessions[$sessionId]['history'] = [];
        }
        
        $this->sessions[$sessionId]['history'][] = $entry;
        
        // Keep only last 100 entries
        if (count($this->sessions[$sessionId]['history']) > 100) {
            $this->sessions[$sessionId]['history'] = array_slice(
                $this->sessions[$sessionId]['history'], -100
            );
        }
        
        $this->persistSession($sessionId);
    }
    
    private function trimContext($sessionId) {
        // Implement context trimming logic
        // Keep most recent and important context items
    }
    
    private function handleWorkflowExecute($request, $session) {
        // Workflow execution will be implemented in Phase 3
        return [
            'success' => false,
            'error' => 'Workflow execution not yet implemented'
        ];
    }
}
?>
