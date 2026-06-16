# Database Migration Guide

This guide provides comprehensive instructions for migrating the Donna Interactive project from file-based storage to database storage (PostgreSQL/Supabase).

## Overview

The migration process transitions all data storage from JSON files to a PostgreSQL database, providing better scalability, performance, and data integrity. The system supports both PostgreSQL and Supabase as database backends.

## Prerequisites

### Environment Requirements
- PHP 7.4 or higher
- PostgreSQL 12+ or Supabase account
- Composer dependencies installed
- Sufficient disk space for data backup

### Required Environment Variables

For PostgreSQL:
```bash
DATA_STORAGE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=donna_interactive
DB_USER=your_username
DB_PASSWORD=your_password
```

For Supabase:
```bash
DATA_STORAGE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Migration Steps

### Step 1: Database Schema Setup

1. **Run the complete schema migration:**
   ```bash
   psql -d donna_interactive -f supabase/sql/complete_schema_migration.sql
   ```

2. **Set up retention policies:**
   ```bash
   psql -d donna_interactive -f supabase/sql/retention_policies.sql
   ```

3. **Verify schema:**
   ```bash
   psql -d donna_interactive -c "\dt"
   ```

### Step 2: Data Migration

1. **Run pre-migration validation:**
   ```bash
   php scripts/migrate-file-to-database.php --dry-run
   ```

2. **Execute the migration:**
   ```bash
   php scripts/migrate-file-to-database.php --verbose
   ```

3. **Monitor migration progress:**
   - Check logs in `logs/migration_*.log`
   - Monitor console output for progress updates

### Step 3: Post-Migration Validation

1. **Run validation script:**
   ```bash
   php scripts/validate-migration.php --performance
   ```

2. **Check validation report:**
   - Review `logs/validation_report_*.json`
   - Address any errors or warnings

### Step 4: Environment Cutover

1. **Update environment configuration:**
   ```bash
   # Change DATA_STORAGE_TYPE from 'file' to 'postgresql' or 'supabase'
   echo "DATA_STORAGE_TYPE=postgresql" >> .env
   ```

2. **Test application functionality:**
   - Test user authentication
   - Test chat functionality
   - Test API endpoints

### Step 5: Cleanup (Optional)

1. **Archive file-based data:**
   ```bash
   php scripts/cleanup-file-storage.php --archive
   ```

2. **Remove file storage (after verification):**
   ```bash
   php scripts/cleanup-file-storage.php --remove
   ```

## Database Schema

### Core Tables

#### users
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `name` (VARCHAR)
- `profile` (JSONB)
- `preferences` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_active_at` (TIMESTAMP)
- `status` (VARCHAR)

#### chat_sessions
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `title` (VARCHAR)
- `profile` (VARCHAR)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_message_at` (TIMESTAMP)
- `message_count` (INTEGER)
- `status` (VARCHAR)

#### messages
- `id` (UUID, Primary Key)
- `chat_session_id` (UUID, Foreign Key)
- `role` (VARCHAR)
- `content` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `sequence_number` (INTEGER)
- `token_count` (INTEGER)
- `abuse_flagged` (BOOLEAN)

#### user_memory
- `id` (UUID, Primary Key)
- `user_id` (VARCHAR)
- `memory_key` (VARCHAR)
- `memory_value` (TEXT)
- `memory_type` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)

### Indexes

Key indexes for performance:
- `idx_users_email` on users(email)
- `idx_chat_sessions_user_id` on chat_sessions(user_id)
- `idx_messages_chat_session_id` on messages(chat_session_id)
- `idx_user_memory_user_key` on user_memory(user_id, memory_key)

## Data Access Patterns

### Using DataAccessFactory

```php
// Get appropriate data access layer
$dal = DataAccessFactory::create();

// The factory automatically selects the correct implementation
// based on DATA_STORAGE_TYPE environment variable
```

### User Management
```php
// Create user
$user = $dal->createUser('user@example.com', null, ['name' => 'John Doe']);

// Get user
$user = $dal->getUserByEmail('user@example.com');

// Update user
$dal->updateUser($userId, ['name' => 'Jane Doe']);
```

### Chat Sessions
```php
// Create chat session
$session = $dal->createChatSession($userId, ['title' => 'New Chat']);

// Get user's chat sessions
$sessions = $dal->getUserChatSessions($userId);

// Add message
$message = $dal->addMessage($sessionId, 'user', 'Hello!');
```

### User Memory
```php
// Store user memory
$dal->setUserMemory($userId, 'preference', 'dark_mode', 'user_setting');

// Retrieve user memory
$preference = $dal->getUserMemory($userId, 'preference');
```

## Performance Considerations

### Database Optimization
- Use connection pooling for high-traffic applications
- Implement proper indexing for frequently queried columns
- Consider read replicas for read-heavy workloads
- Monitor query performance and optimize slow queries

### Caching Strategy
- Implement Redis or Memcached for frequently accessed data
- Use application-level caching for user sessions
- Cache database query results where appropriate

### Monitoring
- Set up database performance monitoring
- Monitor connection pool usage
- Track query execution times
- Set up alerts for database errors

## Troubleshooting

### Common Issues

#### Migration Fails
1. Check database connectivity
2. Verify environment variables
3. Ensure sufficient disk space
4. Check file permissions

#### Data Integrity Issues
1. Run validation script
2. Compare record counts
3. Check for missing foreign key relationships
4. Verify data types and constraints

#### Performance Issues
1. Check database indexes
2. Monitor query execution plans
3. Optimize slow queries
4. Consider connection pooling

### Rollback Procedures

#### Emergency Rollback
1. Change `DATA_STORAGE_TYPE` back to `file`
2. Restart application services
3. Verify file-based data is intact
4. Investigate database issues

#### Partial Rollback
1. Use validation script to identify issues
2. Fix specific data problems
3. Re-run migration for affected data
4. Validate again

## Security Considerations

### Database Security
- Use strong passwords for database users
- Implement proper user permissions
- Enable SSL/TLS for database connections
- Regular security updates

### Data Protection
- Implement Row Level Security (RLS) policies
- Encrypt sensitive data at rest
- Use prepared statements to prevent SQL injection
- Regular security audits

### Access Control
- Limit database access to necessary services
- Use service accounts with minimal permissions
- Implement proper authentication and authorization
- Monitor database access logs

## Maintenance

### Regular Tasks
- Run cleanup functions to remove expired data
- Monitor database size and performance
- Update statistics and reindex as needed
- Backup database regularly

### Automated Cleanup
The system includes automated cleanup functions:
- `cleanup_expired_memory()` - Removes expired user memory
- `cleanup_old_chat_sessions()` - Archives old chat sessions
- `cleanup_orphaned_messages()` - Removes orphaned messages

### Monitoring
- Set up database monitoring dashboards
- Configure alerts for critical issues
- Monitor application performance metrics
- Track user activity and system usage

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Run validation scripts
4. Contact the development team

## Version History

- v1.0.0 - Initial database migration implementation
- v1.1.0 - Added Supabase support
- v1.2.0 - Enhanced validation and cleanup procedures
