<?php
/**
 * Data Access Factory
 * Creates appropriate DataAccessInterface implementation based on configuration
 */

require_once __DIR__ . '/DataAccessInterface.php';
require_once __DIR__ . '/FileDataAccess.php';
// Load database implementations only when needed
// require_once __DIR__ . '/PostgreSQLDataAccess.php';
// require_once __DIR__ . '/SupabaseDataAccess.php';

class DataAccessFactory {
    private static $instance = null;
    private static $storageType = null;
    
    /**
     * Create a DataAccessInterface implementation based on configuration
     */
    public static function create($storageType = null) {
        // Use provided storage type or get from environment
        $type = $storageType ?? $_ENV['DATA_STORAGE_TYPE'] ?? 'postgresql';
        
        // Cache the instance for the same storage type
        if (self::$instance !== null && self::$storageType === $type) {
            return self::$instance;
        }
        
        switch (strtolower($type)) {
            case 'file':
                $dataDir = $_ENV['DATA_DIR'] ?? __DIR__ . '/../data';
                self::$instance = new FileDataAccess($dataDir);
                break;
                
            case 'postgresql':
            case 'postgres':
                self::$instance = self::createPostgreSQLDataAccess();
                break;
                
            case 'supabase':
                self::$instance = self::createSupabaseDataAccess();
                break;
                
            default:
                throw new InvalidArgumentException("Unsupported storage type: $type. Supported types: file, postgresql, supabase");
        }
        
        self::$storageType = $type;
        
        // Test connection for database types
        if (in_array($type, ['postgresql', 'postgres', 'supabase'])) {
            try {
                self::$instance->testConnection();
            } catch (Exception $e) {
                error_log("DataAccessFactory: Connection test failed for $type: " . $e->getMessage());
                
                // Fallback to file storage if database connection fails
                if ($type !== 'file') {
                    error_log("DataAccessFactory: Falling back to file storage");
                    $dataDir = $_ENV['DATA_DIR'] ?? __DIR__ . '/../data';
                    self::$instance = new FileDataAccess($dataDir);
                    self::$storageType = 'file';
                }
            }
        }
        
        return self::$instance;
    }
    
    /**
     * Create PostgreSQL data access with connection validation
     */
    private static function createPostgreSQLDataAccess() {
        require_once __DIR__ . '/PostgreSQLDataAccess.php';
        
        // Validate required environment variables
        $requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
        $missingVars = [];
        
        foreach ($requiredVars as $var) {
            if (empty($_ENV[$var])) {
                $missingVars[] = $var;
            }
        }
        
        if (!empty($missingVars)) {
            throw new Exception("Missing required environment variables for PostgreSQL: " . implode(', ', $missingVars));
        }
        
        return new PostgreSQLDataAccess();
    }
    
    /**
     * Create Supabase data access with connection validation
     */
    private static function createSupabaseDataAccess() {
        // Validate required environment variables
        $requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
        $missingVars = [];
        
        foreach ($requiredVars as $var) {
            if (empty($_ENV[$var])) {
                $missingVars[] = $var;
            }
        }
        
        if (!empty($missingVars)) {
            throw new Exception("Missing required environment variables for Supabase: " . implode(', ', $missingVars));
        }
        
        return new SupabaseDataAccess();
    }
    
    /**
     * Get the current storage type
     */
    public static function getStorageType() {
        return self::$storageType;
    }
    
    /**
     * Check if the current storage type is database-based
     */
    public static function isDatabaseStorage() {
        return in_array(self::$storageType, ['postgresql', 'postgres', 'supabase']);
    }
    
    /**
     * Check if the current storage type is file-based
     */
    public static function isFileStorage() {
        return self::$storageType === 'file';
    }
    
    /**
     * Test connection for the current storage type
     */
    public static function testConnection() {
        if (self::$instance === null) {
            self::create();
        }
        
        if (method_exists(self::$instance, 'testConnection')) {
            return self::$instance->testConnection();
        }
        
        return true; // File storage doesn't need connection testing
    }
    
    /**
     * Get health check information
     */
    public static function getHealthCheck() {
        try {
            $instance = self::create();
            $storageType = self::getStorageType();
            
            $health = [
                'storage_type' => $storageType,
                'status' => 'healthy',
                'timestamp' => date('Y-m-d H:i:s'),
                'connection_test' => false
            ];
            
            // Test connection for database types
            if (self::isDatabaseStorage()) {
                try {
                    $instance->testConnection();
                    $health['connection_test'] = true;
                } catch (Exception $e) {
                    $health['status'] = 'unhealthy';
                    $health['error'] = $e->getMessage();
                }
            } else {
                $health['connection_test'] = true; // File storage doesn't need connection testing
            }
            
            return $health;
            
        } catch (Exception $e) {
            return [
                'storage_type' => 'unknown',
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Reset the factory instance (useful for testing)
     */
    public static function reset() {
        self::$instance = null;
        self::$storageType = null;
    }
    
    /**
     * Get configuration recommendations based on environment
     */
    public static function getConfigurationRecommendations() {
        $recommendations = [];
        
        // Check for database configuration
        if (!empty($_ENV['SUPABASE_URL']) && !empty($_ENV['SUPABASE_SERVICE_ROLE_KEY'])) {
            $recommendations[] = [
                'type' => 'supabase',
                'priority' => 'high',
                'message' => 'Supabase configuration detected. Consider using "supabase" storage type for better integration.'
            ];
        }
        
        if (!empty($_ENV['DB_HOST']) && !empty($_ENV['DB_NAME'])) {
            $recommendations[] = [
                'type' => 'postgresql',
                'priority' => 'medium',
                'message' => 'PostgreSQL configuration detected. Consider using "postgresql" storage type for better performance.'
            ];
        }
        
        // Check current configuration
        $currentType = $_ENV['DATA_STORAGE_TYPE'] ?? 'file';
        if ($currentType === 'file') {
            $recommendations[] = [
                'type' => 'upgrade',
                'priority' => 'low',
                'message' => 'Currently using file storage. Consider upgrading to database storage for better scalability and features.'
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Migrate data from one storage type to another
     */
    public static function migrateData($fromType, $toType, $options = []) {
        if ($fromType === $toType) {
            throw new InvalidArgumentException("Source and target storage types cannot be the same");
        }
        
        $sourceDAL = self::create($fromType);
        $targetDAL = self::create($toType);
        
        if (!method_exists($sourceDAL, 'migrateTo')) {
            throw new Exception("Source storage type '$fromType' does not support migration");
        }
        
        return $sourceDAL->migrateTo($targetDAL, $options);
    }
    
    /**
     * Get supported storage types
     */
    public static function getSupportedTypes() {
        return ['file', 'postgresql', 'supabase'];
    }
    
    /**
     * Validate storage type configuration
     */
    public static function validateConfiguration($storageType = null) {
        $type = $storageType ?? $_ENV['DATA_STORAGE_TYPE'] ?? 'file';
        $errors = [];
        
        switch (strtolower($type)) {
            case 'postgresql':
            case 'postgres':
                $requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
                foreach ($requiredVars as $var) {
                    if (empty($_ENV[$var])) {
                        $errors[] = "Missing required environment variable: $var";
                    }
                }
                break;
                
            case 'supabase':
                $requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
                foreach ($requiredVars as $var) {
                    if (empty($_ENV[$var])) {
                        $errors[] = "Missing required environment variable: $var";
                    }
                }
                break;
                
            case 'file':
                // File storage doesn't require additional configuration
                break;
                
            default:
                $errors[] = "Unsupported storage type: $type";
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'storage_type' => $type
        ];
    }
}
?>
