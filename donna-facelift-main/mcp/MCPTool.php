<?php
/**
 * MCP Tool Interface
 * All MCP tools must implement this interface
 */

interface MCPTool {
    /**
     * Get tool information
     */
    public function getInfo();
    
    /**
     * Validate parameters
     */
    public function validateParameters($parameters);
    
    /**
     * Execute the tool
     */
    public function execute($parameters, $context = []);
}

/**
 * Abstract base class for MCP tools
 */
abstract class BaseMCPTool implements MCPTool {
    protected $name;
    protected $description;
    protected $parameters;
    protected $category;
    protected $version;
    
    public function __construct($config = []) {
        $this->name = $config['name'] ?? static::class;
        $this->description = $config['description'] ?? '';
        $this->parameters = $config['parameters'] ?? [];
        $this->category = $config['category'] ?? 'general';
        $this->version = $config['version'] ?? '1.0.0';
    }
    
    public function getInfo() {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'parameters' => $this->parameters,
            'category' => $this->category,
            'version' => $this->version,
            'capabilities' => $this->getCapabilities()
        ];
    }
    
    public function validateParameters($parameters) {
        $errors = [];
        
        // Check required parameters
        foreach ($this->parameters as $paramName => $paramConfig) {
            if (isset($paramConfig['required']) && $paramConfig['required']) {
                if (!isset($parameters[$paramName])) {
                    $errors[] = "Missing required parameter: $paramName";
                }
            }
            
            // Type validation
            if (isset($parameters[$paramName]) && isset($paramConfig['type'])) {
                if (!$this->validateParameterType($parameters[$paramName], $paramConfig['type'])) {
                    $errors[] = "Invalid type for parameter $paramName. Expected: " . $paramConfig['type'];
                }
            }
            
            // Custom validation
            if (isset($parameters[$paramName]) && isset($paramConfig['validator'])) {
                $validator = $paramConfig['validator'];
                if (is_callable($validator)) {
                    $validationResult = $validator($parameters[$paramName]);
                    if ($validationResult !== true) {
                        $errors[] = "Validation failed for parameter $paramName: $validationResult";
                    }
                }
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    protected function validateParameterType($value, $expectedType) {
        switch ($expectedType) {
            case 'string':
                return is_string($value);
            case 'integer':
            case 'int':
                return is_int($value);
            case 'float':
            case 'double':
                return is_float($value);
            case 'boolean':
            case 'bool':
                return is_bool($value);
            case 'array':
                return is_array($value);
            case 'object':
                return is_object($value);
            case 'email':
                return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL) !== false;
            default:
                return true; // Unknown type, assume valid
        }
    }
    
    /**
     * Get tool capabilities
     */
    protected function getCapabilities() {
        return [
            'async' => false,
            'streaming' => false,
            'context_aware' => true,
            'stateful' => false
        ];
    }
    
    /**
     * Log tool execution
     */
    protected function log($level, $message, $context = []) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'tool' => $this->name,
            'level' => $level,
            'message' => $message,
            'context' => $context
        ];
        
        // In a real implementation, this would write to a proper logging system
        error_log(json_encode($logEntry));
    }
    
    /**
     * Create a standardized response
     */
    protected function createResponse($success, $data = null, $error = null, $contextUpdate = null) {
        $response = [
            'success' => $success,
            'timestamp' => date('Y-m-d H:i:s'),
            'tool' => $this->name
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if ($error !== null) {
            $response['error'] = $error;
        }
        
        if ($contextUpdate !== null) {
            $response['context_update'] = $contextUpdate;
        }
        
        return $response;
    }
    
    /**
     * Execute the tool - must be implemented by concrete classes
     */
    abstract public function execute($parameters, $context = []);
}

/**
 * MCP Tool Registry
 * Manages tool discovery and registration
 */
class MCPToolRegistry {
    private static $instance = null;
    private $tools = [];
    private $categories = [];
    
    private function __construct() {}
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function register($name, MCPTool $tool) {
        $this->tools[$name] = $tool;
        $info = $tool->getInfo();
        
        if (!isset($this->categories[$info['category']])) {
            $this->categories[$info['category']] = [];
        }
        
        $this->categories[$info['category']][] = $name;
        
        return $this;
    }
    
    public function get($name) {
        return $this->tools[$name] ?? null;
    }
    
    public function getAll() {
        return $this->tools;
    }
    
    public function getByCategory($category) {
        $categoryTools = [];
        if (isset($this->categories[$category])) {
            foreach ($this->categories[$category] as $toolName) {
                $categoryTools[$toolName] = $this->tools[$toolName];
            }
        }
        return $categoryTools;
    }
    
    public function getCategories() {
        return array_keys($this->categories);
    }
    
    public function discover($directory) {
        // Auto-discover tools in a directory
        if (!is_dir($directory)) {
            return;
        }
        
        $files = glob($directory . '/*Tool.php');
        foreach ($files as $file) {
            $className = basename($file, '.php');
            if (class_exists($className)) {
                $reflection = new ReflectionClass($className);
                if ($reflection->implementsInterface('MCPTool')) {
                    $tool = new $className();
                    $this->register($className, $tool);
                }
            }
        }
    }
}
?>
