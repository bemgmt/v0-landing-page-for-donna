<?php
/**
 * Database Query Helper
 * Provides a unified interface for executing SQL queries across different storage backends
 */

require_once __DIR__ . '/DataAccessFactory.php';

class DatabaseQueryHelper {
    private $dal;
    private $storageType;
    
    public function __construct() {
        $this->dal = DataAccessFactory::create();
        $this->storageType = DataAccessFactory::getStorageType();
    }
    
    /**
     * Execute a SQL query with parameters
     */
    public function query($sql, $params = []) {
        if (DataAccessFactory::isDatabaseStorage()) {
            return $this->queryPostgreSQL($sql, $params);
        } else {
            throw new Exception("Raw SQL queries are only supported with database storage");
        }
    }
    
    /**
     * Execute query for PostgreSQL
     */
    private function queryPostgreSQL($sql, $params = []) {
        // Get PDO connection from PostgreSQLDataAccess
        $reflection = new ReflectionClass($this->dal);
        
        if ($reflection->getName() === 'PostgreSQLDataAccess') {
            $pdoProperty = $reflection->getProperty('pdo');
            $pdoProperty->setAccessible(true);
            $pdo = $pdoProperty->getValue($this->dal);
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            // Check if query returns results
            if (stripos($sql, 'SELECT') === 0 || stripos($sql, 'RETURNING') !== false) {
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            return true;
        } elseif ($reflection->getName() === 'SupabaseDataAccess') {
            // For Supabase, we need to use REST API
            // This is a simplified version - in production, you'd want to use PostgREST
            throw new Exception("Supabase direct SQL queries not yet implemented. Use REST API endpoints instead.");
        }
        
        throw new Exception("Unsupported storage type for raw SQL queries");
    }
    
    /**
     * Execute a query and return first result
     */
    public function queryOne($sql, $params = []) {
        $results = $this->query($sql, $params);
        return !empty($results) ? $results[0] : null;
    }
    
    /**
     * Execute a query and return count
     */
    public function queryCount($sql, $params = []) {
        $results = $this->query($sql, $params);
        return is_array($results) ? count($results) : 0;
    }
}

