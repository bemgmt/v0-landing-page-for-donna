# Database Migration Plan

**Part of WS4 - Data Management, Logging & Error Handling**  
**Phase 4 Task 4.3: DB migration plan (phase-4-task-03-db-plan.md)**

## Overview

This document outlines the plan for migrating from the current file-based JSON storage to a PostgreSQL database. The migration will be phased to minimize risk and ensure data integrity.

## Current State Analysis

### File-Based Storage Issues
- **No ACID compliance**: Risk of data corruption during concurrent access
- **File locking problems**: Contention issues with multiple requests
- **Security concerns**: World-readable permissions (0777)
- **No backup strategy**: Manual file management required
- **Limited querying**: No complex queries or relationships
- **Scalability limits**: Performance degrades with data growth

### Current Data Structures
```
/data/
  /chat_sessions/     # Chat histories by chat_id
  /memory/            # User profiles and memory
/api/logs/            # System logs (now handled by LogManager)
/chat_history/        # Legacy chat transcripts
/conversations/       # Per-user conversation exports
/generated_pages/     # Auto-generated HTML/pages
```

## Target Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### 2. Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    profile VARCHAR(50) DEFAULT 'general',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE INDEX idx_chat_sessions_chat_id ON chat_sessions(chat_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_profile ON chat_sessions(profile);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_last_message ON chat_sessions(last_message_at);
```

#### 3. Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number INTEGER NOT NULL,
    token_count INTEGER,
    abuse_flagged BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_messages_chat_session ON messages(chat_session_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_sequence ON messages(chat_session_id, sequence_number);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_abuse_flagged ON messages(abuse_flagged);
```

#### 4. User Memory Table
```sql
CREATE TABLE user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type VARCHAR(100) NOT NULL, -- 'profile', 'preferences', 'context'
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, memory_type, key)
);

CREATE INDEX idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX idx_user_memory_type ON user_memory(memory_type);
CREATE INDEX idx_user_memory_expires ON user_memory(expires_at);
```

#### 5. System Logs Table (Optional - for structured logging)
```sql
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    trace_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_trace_id ON system_logs(trace_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
-- Partition by date for performance
```

### Indexes and Performance

#### Composite Indexes
```sql
-- For chat history queries
CREATE INDEX idx_messages_chat_recent ON messages(chat_session_id, created_at DESC);

-- For user activity tracking
CREATE INDEX idx_chat_sessions_user_recent ON chat_sessions(user_id, last_message_at DESC);

-- For memory lookups
CREATE INDEX idx_user_memory_lookup ON user_memory(user_id, memory_type, key);
```

#### Full-Text Search (Future Enhancement)
```sql
-- For message content search
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));
```

## Data Access Layer (DAL) Design

### Interface Definition

```php
interface DataAccessInterface {
    // User operations
    public function createUser(array $userData): string;
    public function getUserById(string $userId): ?array;
    public function getUserByClerkId(string $clerkId): ?array;
    public function updateUser(string $userId, array $updates): bool;
    
    // Chat session operations
    public function createChatSession(string $chatId, ?string $userId, array $metadata): string;
    public function getChatSession(string $chatId): ?array;
    public function updateChatSession(string $chatId, array $updates): bool;
    
    // Message operations
    public function addMessage(string $chatId, string $role, string $content, array $metadata): string;
    public function getChatHistory(string $chatId, int $limit = 20, int $offset = 0): array;
    public function getMessageCount(string $chatId): int;
    
    // User memory operations
    public function setUserMemory(string $userId, string $type, string $key, $value): bool;
    public function getUserMemory(string $userId, string $type, ?string $key = null): array;
    public function deleteUserMemory(string $userId, string $type, ?string $key = null): bool;
    
    // Utility operations
    public function beginTransaction(): bool;
    public function commit(): bool;
    public function rollback(): bool;
    public function healthCheck(): array;
}
```

### Implementation Strategy

#### 1. File-Based Implementation (Current)
```php
class FileDataAccess implements DataAccessInterface {
    private $dataDir;
    
    public function __construct(string $dataDir) {
        $this->dataDir = $dataDir;
    }
    
    // Implement interface methods using current file-based logic
}
```

#### 2. PostgreSQL Implementation (Target)
```php
class PostgreSQLDataAccess implements DataAccessInterface {
    private $pdo;
    
    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }
    
    // Implement interface methods using SQL queries
}
```

#### 3. Factory Pattern for DAL Selection
```php
class DataAccessFactory {
    public static function create(string $type = null): DataAccessInterface {
        $type = $type ?: getenv('DATA_STORAGE_TYPE') ?: 'file';
        
        switch ($type) {
            case 'postgresql':
                return new PostgreSQLDataAccess(self::createPDO());
            case 'file':
            default:
                return new FileDataAccess(__DIR__ . '/../data');
        }
    }
    
    private static function createPDO(): PDO {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'localhost',
            getenv('DB_PORT') ?: '5432',
            getenv('DB_NAME') ?: 'donna'
        );
        
        return new PDO($dsn, getenv('DB_USER'), getenv('DB_PASSWORD'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
}
```

## Migration Phases

### Phase 1: DAL Implementation (Current Phase)
- ✅ Create DAL interface
- ✅ Implement file-based DAL (wrapper around current logic)
- ✅ Create factory pattern for DAL selection
- 🔄 Add configuration for storage type selection

### Phase 2: PostgreSQL Setup
- Set up PostgreSQL database
- Create database schema and indexes
- Implement PostgreSQL DAL
- Add database connection configuration

### Phase 3: Pilot Migration (Task 4.4)
- Choose one entity for pilot migration (e.g., user memory)
- Implement dual-write pattern (write to both file and DB)
- Validate data consistency
- Monitor performance impact

### Phase 4: Gradual Migration
- Migrate chat sessions metadata
- Migrate message history (in batches)
- Migrate user profiles
- Retire file-based storage

### Phase 5: Optimization
- Implement caching layer
- Add read replicas if needed
- Optimize queries and indexes
- Implement data archiving strategy

## Environment Configuration

### Required Environment Variables
```env
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=donna
DB_USER=donna_user
DB_PASSWORD=secure_password

# Storage type selection
DATA_STORAGE_TYPE=file  # or 'postgresql'

# Connection pool settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=300

# Migration settings
MIGRATION_BATCH_SIZE=1000
MIGRATION_ENABLE_DUAL_WRITE=false
```

## Risk Mitigation

### Data Integrity
- Implement comprehensive backup strategy before migration
- Use transactions for all multi-step operations
- Validate data consistency during dual-write phase
- Implement rollback procedures for each phase

### Performance
- Monitor query performance during migration
- Implement connection pooling
- Use batch operations for large data sets
- Plan for minimal downtime during cutover

### Security
- Use parameterized queries to prevent SQL injection
- Implement proper database user permissions
- Encrypt sensitive data at rest
- Audit database access and changes

## Testing Strategy

### Unit Tests
- Test each DAL method independently
- Mock database connections for isolated testing
- Validate data transformation logic

### Integration Tests
- Test complete workflows using both storage types
- Validate data consistency between file and DB storage
- Test error handling and recovery scenarios

### Performance Tests
- Benchmark query performance under load
- Test concurrent access scenarios
- Validate memory usage and connection handling

## Success Metrics

### Performance Targets
- Query response time < 100ms for 95th percentile
- Support for 100+ concurrent users
- Database connection pool efficiency > 90%

### Reliability Targets
- 99.9% uptime during migration
- Zero data loss during migration
- Recovery time < 5 minutes for any issues

### Operational Targets
- Automated backup and restore procedures
- Monitoring and alerting for database health
- Documentation for operational procedures
