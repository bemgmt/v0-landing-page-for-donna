# Database Pilot Setup Guide

## WS4 Task 5: Database Pilot Verification

This guide provides comprehensive setup and verification instructions for the PostgreSQL database pilot implementation.

**Part of WS4 - Data Management, Logging & Error Handling**  
**Phase 4 Task 4.4: Minimal DB pilot implementation**

## Overview

This guide helps set up the database pilot for testing PostgreSQL integration with the Data Access Layer (DAL). The pilot uses a low-risk approach with test data to validate the database schema and DAL implementation.

## Quick Verification

### Run Database Pilot Verification Test

```bash
php test_db_pilot_verification.php
```

This comprehensive test verifies:
- ✅ PostgreSQLDataAccess implements DataAccessInterface correctly
- ✅ Database configuration and connection handling
- ✅ DAL factory creates appropriate storage implementations
- ✅ CRUD operations for both file and PostgreSQL storage
- ✅ Transaction support (begin, commit, rollback)
- ✅ Data migration capability between storage types

### Expected Output

```
=== WS4 Database Pilot Verification ===

Test 1: Interface Conformance Verification
✓ PostgreSQLDataAccess class exists: YES
✓ Implements DataAccessInterface: YES
✓ Interface methods verification:
  - createUser: IMPLEMENTED
  - getUserById: IMPLEMENTED
  - updateUser: IMPLEMENTED
  - deleteUser: IMPLEMENTED
  [... all methods verified]

Test 2: Database Configuration and Connection
✓ Configuration check:
  - DB_HOST: localhost
  - DB_NAME: donna
  - DB_USER: donna_user
  - DB_PASSWORD: ***
✓ All required environment variables present

[... additional test results]
```

## Prerequisites

### 1. PostgreSQL Installation

#### Option A: Local PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name donna-postgres \
  -e POSTGRES_DB=donna \
  -e POSTGRES_USER=donna_user \
  -e POSTGRES_PASSWORD=secure_password_change_me \
  -p 5432:5432 \
  -d postgres:15

# Verify container is running
docker ps
```

#### Option C: Cloud PostgreSQL
- Use services like AWS RDS, Google Cloud SQL, or DigitalOcean Managed Databases
- Create a PostgreSQL instance with version 12 or higher
- Note the connection details for configuration

### 2. Database Setup

#### Create Database and User (if not using Docker)
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE donna;

-- Create user
CREATE USER donna_user WITH PASSWORD 'secure_password_change_me';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE donna TO donna_user;

-- Connect to donna database
\c donna

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO donna_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO donna_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO donna_user;

-- Exit
\q
```

#### Run Schema Creation
```bash
# Apply the schema
psql -h localhost -U donna_user -d donna -f docs/schema.sql

# Or if using Docker
docker exec -i donna-postgres psql -U donna_user -d donna < docs/schema.sql
```

## Configuration

### 1. Environment Variables

Add these variables to your `.env.local` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=donna
DB_USER=donna_user
DB_PASSWORD=secure_password_change_me

# Storage Type Selection
DATA_STORAGE_TYPE=postgresql

# Optional: Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=300

# Optional: Migration Settings
MIGRATION_BATCH_SIZE=1000
MIGRATION_ENABLE_DUAL_WRITE=false
```

### 2. PHP Extensions

Ensure required PHP extensions are installed:

```bash
# Ubuntu/Debian
sudo apt install php-pgsql php-pdo

# CentOS/RHEL
sudo yum install php-pgsql php-pdo

# macOS with Homebrew
brew install php
# PDO and pgsql are usually included

# Windows
# Enable in php.ini:
# extension=pdo_pgsql
# extension=pgsql
```

## Testing the Pilot

### 1. Basic Connection Test

```bash
# Test database connection
php -r "
try {
    \$pdo = new PDO('pgsql:host=localhost;dbname=donna', 'donna_user', 'secure_password_change_me');
    echo 'Database connection successful\n';
} catch (Exception \$e) {
    echo 'Connection failed: ' . \$e->getMessage() . '\n';
}
"
```

### 2. Run DAL Tests

```bash
# Test the Data Access Layer
php test_dal.php

# Test the database pilot specifically
php test_db_pilot.php
```

### 3. Verify Schema

```sql
-- Connect to database
psql -h localhost -U donna_user -d donna

-- List tables
\dt

-- Check users table structure
\d users

-- Check if sample data exists
SELECT * FROM users WHERE clerk_id = 'test_clerk_pilot';

-- Exit
\q
```

## Pilot Validation Checklist

### ✅ Infrastructure
- [ ] PostgreSQL server running
- [ ] Database `donna` created
- [ ] User `donna_user` created with proper permissions
- [ ] Schema applied successfully
- [ ] PHP PDO extensions installed

### ✅ Configuration
- [ ] Environment variables set in `.env.local`
- [ ] `DATA_STORAGE_TYPE=postgresql` configured
- [ ] Connection parameters correct

### ✅ DAL Functionality
- [ ] `DataAccessFactory::create('postgresql')` works
- [ ] Health check returns 'healthy' status
- [ ] User CRUD operations working
- [ ] User memory operations working
- [ ] Chat session operations working
- [ ] Message operations working
- [ ] Search functionality working

### ✅ Data Integrity
- [ ] User data persists correctly
- [ ] JSON fields (profile, preferences, metadata) work
- [ ] TTL memory cleanup works
- [ ] Foreign key constraints enforced
- [ ] Transactions work properly

### ✅ Performance
- [ ] Query response times acceptable (< 100ms for simple queries)
- [ ] Indexes being used (check with EXPLAIN)
- [ ] Connection pooling working
- [ ] No memory leaks during extended testing

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
SQLSTATE[08006] [7] could not connect to server
```
**Solution:**
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify port 5432 is open: `netstat -an | grep 5432`
- Check firewall settings

#### 2. Authentication Failed
```
SQLSTATE[08006] [7] FATAL: password authentication failed
```
**Solution:**
- Verify username and password in `.env.local`
- Check `pg_hba.conf` for authentication method
- Ensure user exists: `psql -U postgres -c "\du"`

#### 3. Database Does Not Exist
```
SQLSTATE[08006] [7] FATAL: database "donna" does not exist
```
**Solution:**
- Create database: `createdb -U postgres donna`
- Or use SQL: `CREATE DATABASE donna;`

#### 4. Permission Denied
```
SQLSTATE[42501]: Insufficient privilege
```
**Solution:**
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE donna TO donna_user;`
- Grant schema permissions: `GRANT ALL ON SCHEMA public TO donna_user;`

#### 5. Schema Errors
```
ERROR: relation "users" does not exist
```
**Solution:**
- Apply schema: `psql -U donna_user -d donna -f docs/schema.sql`
- Check if tables exist: `\dt` in psql

### Performance Tuning

#### 1. PostgreSQL Configuration
Edit `postgresql.conf`:
```
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 100

# Logging
log_statement = 'all'  # For debugging only
log_min_duration_statement = 1000  # Log slow queries
```

#### 2. Index Monitoring
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Migration Strategy

### Phase 1: Pilot Validation (Current)
- ✅ Test with low-risk data
- ✅ Validate schema and DAL
- ✅ Performance testing
- ✅ Error handling verification

### Phase 2: Dual-Write Implementation
- Implement dual-write pattern
- Write to both file and database
- Compare data consistency
- Monitor performance impact

### Phase 3: Read Migration
- Gradually shift reads to database
- Maintain file backup
- Monitor query performance
- Validate data integrity

### Phase 4: Full Migration
- Stop writing to files
- Database becomes primary
- Archive file data
- Remove file-based code

## Monitoring and Maintenance

### 1. Health Checks
```bash
# Regular health check
php -r "
require_once 'lib/DataAccessInterface.php';
\$dal = DataAccessFactory::create('postgresql');
\$health = \$dal->healthCheck();
echo json_encode(\$health, JSON_PRETTY_PRINT);
"
```

### 2. Storage Statistics
```bash
# Get storage stats
php -r "
require_once 'lib/DataAccessInterface.php';
\$dal = DataAccessFactory::create('postgresql');
\$stats = \$dal->getStorageStats();
echo json_encode(\$stats, JSON_PRETTY_PRINT);
"
```

### 3. Memory Cleanup
```bash
# Clean expired memory entries
php -r "
require_once 'lib/DataAccessInterface.php';
\$dal = DataAccessFactory::create('postgresql');
\$cleaned = \$dal->cleanupExpiredMemory();
echo \"Cleaned up \$cleaned expired entries\n\";
"
```

## Security Considerations

### 1. Database Security
- Use strong passwords
- Limit network access
- Enable SSL connections
- Regular security updates

### 2. Application Security
- Use parameterized queries (already implemented)
- Validate input data
- Implement proper error handling
- Log security events

### 3. Data Privacy
- PII scrubbing in logs (already implemented)
- Secure backup procedures
- Access control and auditing
- GDPR compliance considerations

## Success Criteria

The pilot is considered successful when:

1. **Functionality**: All DAL operations work correctly
2. **Performance**: Query times < 100ms for 95th percentile
3. **Reliability**: No data loss or corruption
4. **Security**: No security vulnerabilities identified
5. **Monitoring**: Health checks and statistics working
6. **Documentation**: Setup and troubleshooting guides complete

Once these criteria are met, the pilot can be promoted to production use with real user data.
