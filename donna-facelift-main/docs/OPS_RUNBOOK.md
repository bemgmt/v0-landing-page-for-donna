# Operations Runbook

## WS4 Data Management & Cleanup Operations

This runbook provides comprehensive guidance for managing data retention, cleanup policies, and operational maintenance for the Donna Interactive system.

## 🔄 Automated Data Cleanup

### Overview

The system implements automated data retention and cleanup policies to:
- Prevent disk space exhaustion
- Maintain system performance
- Comply with data privacy requirements
- Remove temporary and obsolete files

### Cleanup Script

**Location:** `scripts/cleanup_runtime_data.php`

**Purpose:** Automated cleanup of runtime data with configurable retention policies

### Default Retention Policies

| Data Type | Retention Period | Description |
|-----------|------------------|-------------|
| temp_audio | 1 hour | Voice system temporary audio files |
| chat_sessions | 30 days | Chat history and session data |
| user_memory | 90 days | User memory snapshots |
| logs | 7 days | Application logs |
| cache | 1 day | Response cache files |
| temp_files | 30 minutes | General temporary files |
| conversations | 30 days | Conversation data |
| generated_pages | 7 days | Generated page cache |
| api_logs | 7 days | API access logs |
| error_logs | 14 days | Error logs (kept longer for debugging) |

### Cron Job Setup

#### Daily Cleanup (Recommended)

```bash
# Add to crontab (crontab -e)
# Daily cleanup at 2:00 AM
0 2 * * * /usr/bin/php /path/to/donna-interactive/scripts/cleanup_runtime_data.php >> /var/log/donna_cleanup.log 2>&1
```

#### Hourly Cleanup for High-Volume Systems

```bash
# Hourly cleanup for systems with high data volume
0 * * * * /usr/bin/php /path/to/donna-interactive/scripts/cleanup_runtime_data.php >> /var/log/donna_cleanup.log 2>&1
```

#### Weekly Deep Cleanup

```bash
# Weekly comprehensive cleanup on Sundays at 3:00 AM
0 3 * * 0 /usr/bin/php /path/to/donna-interactive/scripts/cleanup_runtime_data.php --verbose >> /var/log/donna_weekly_cleanup.log 2>&1
```

### Manual Cleanup Operations

#### Dry Run (Safe Testing)

```bash
# Test cleanup without actually deleting files
php scripts/cleanup_runtime_data.php --dry-run --verbose
```

#### Immediate Cleanup

```bash
# Run cleanup immediately with verbose output
php scripts/cleanup_runtime_data.php --verbose
```

#### Custom Configuration

```bash
# Use custom retention configuration
php scripts/cleanup_runtime_data.php --config=/etc/donna/retention.json
```

### Custom Configuration File

Create `/etc/donna/retention.json` for custom retention policies:

```json
{
  "temp_audio": 1800,
  "chat_sessions": 1209600,
  "user_memory": 5184000,
  "logs": 432000,
  "cache": 43200,
  "temp_files": 900,
  "conversations": 1209600,
  "generated_pages": 432000,
  "api_logs": 432000,
  "error_logs": 864000
}
```

## 📊 Monitoring & Alerts

### Storage Monitoring

Monitor disk usage and set up alerts:

```bash
# Check disk usage
df -h /path/to/donna-interactive

# Monitor specific directories
du -sh /path/to/donna-interactive/data/*
du -sh /path/to/donna-interactive/logs/*
```

### Cleanup Log Monitoring

Monitor cleanup operations:

```bash
# View recent cleanup logs
tail -f /var/log/donna_cleanup.log

# Check for cleanup errors
grep -i error /var/log/donna_cleanup.log

# View cleanup statistics
grep "Cleanup completed" /var/log/donna_cleanup.log | tail -10
```

### Recommended Alerts

Set up monitoring alerts for:

1. **Disk Usage > 85%**
   ```bash
   # Example alert script
   USAGE=$(df /path/to/donna-interactive | awk 'NR==2 {print $5}' | sed 's/%//')
   if [ $USAGE -gt 85 ]; then
       echo "WARNING: Disk usage is ${USAGE}%" | mail -s "Donna Disk Alert" admin@example.com
   fi
   ```

2. **Cleanup Failures**
   ```bash
   # Check for cleanup script failures
   if ! grep -q "Cleanup completed successfully" /var/log/donna_cleanup.log; then
       echo "ERROR: Cleanup script failed" | mail -s "Donna Cleanup Alert" admin@example.com
   fi
   ```

3. **Large File Accumulation**
   ```bash
   # Alert if temp directories exceed size limits
   TEMP_SIZE=$(du -sm /path/to/donna-interactive/temp_audio | cut -f1)
   if [ $TEMP_SIZE -gt 100 ]; then
       echo "WARNING: Temp audio directory is ${TEMP_SIZE}MB" | mail -s "Donna Storage Alert" admin@example.com
   fi
   ```

## 🔧 Maintenance Operations

### Weekly Maintenance Checklist

1. **Review Cleanup Logs**
   - Check for any cleanup failures
   - Verify expected file counts are being cleaned
   - Monitor storage usage trends

2. **Storage Analysis**
   - Run storage statistics: `php test_data_retention.php`
   - Check for unexpected large files
   - Verify retention policies are appropriate

3. **Performance Review**
   - Monitor cache hit rates
   - Review response times
   - Check for memory usage patterns

### Monthly Maintenance Tasks

1. **Retention Policy Review**
   - Analyze data growth patterns
   - Adjust retention periods if needed
   - Update configuration files

2. **Log Rotation Verification**
   - Ensure log rotation is working properly
   - Check log file sizes and counts
   - Verify old logs are being archived/deleted

3. **Backup Verification**
   - Ensure important data is backed up before cleanup
   - Test backup restoration procedures
   - Verify backup retention policies

## 🚨 Emergency Procedures

### Disk Space Emergency

If disk usage exceeds 95%:

1. **Immediate Actions**
   ```bash
   # Run emergency cleanup
   php scripts/cleanup_runtime_data.php --verbose
   
   # Manual cleanup of largest temp files
   find /path/to/donna-interactive -name "*.tmp" -size +10M -delete
   find /path/to/donna-interactive -name "*.log" -mtime +1 -delete
   ```

2. **Identify Large Files**
   ```bash
   # Find largest files
   find /path/to/donna-interactive -type f -size +50M -ls
   
   # Find largest directories
   du -sh /path/to/donna-interactive/* | sort -hr | head -10
   ```

3. **Temporary Measures**
   ```bash
   # Reduce retention periods temporarily
   php scripts/cleanup_runtime_data.php --config=emergency_retention.json
   ```

### Cleanup Script Failure

If automated cleanup fails:

1. **Check Script Status**
   ```bash
   # Check for PHP errors
   php -l scripts/cleanup_runtime_data.php
   
   # Test with dry run
   php scripts/cleanup_runtime_data.php --dry-run
   ```

2. **Manual Cleanup**
   ```bash
   # Manual temp file cleanup
   find /path/to/donna-interactive/temp_audio -mtime +0.04 -delete  # 1 hour
   find /path/to/donna-interactive/cache -mtime +1 -delete          # 1 day
   find /path/to/donna-interactive/logs -mtime +7 -delete           # 7 days
   ```

3. **Restore Service**
   ```bash
   # Fix permissions if needed
   chmod +x scripts/cleanup_runtime_data.php
   
   # Update cron job if needed
   crontab -e
   ```

## 📈 Performance Optimization

### Cleanup Performance Tuning

1. **Batch Processing**
   - Process files in batches to avoid memory issues
   - Use find with -exec for large directories

2. **Parallel Processing**
   - Run cleanup for different data types in parallel
   - Use background processes for non-critical cleanup

3. **I/O Optimization**
   - Schedule cleanup during low-traffic periods
   - Use ionice to limit I/O impact

### Storage Optimization

1. **Compression**
   - Compress old log files before deletion
   - Use gzip for archived data

2. **Partitioning**
   - Separate data types into different partitions
   - Use faster storage for frequently accessed data

## 🔐 Security Considerations

### Data Privacy

1. **Secure Deletion**
   - Use secure deletion for sensitive files
   - Verify files are completely removed

2. **Access Control**
   - Restrict cleanup script permissions
   - Log all cleanup operations

3. **Audit Trail**
   - Maintain logs of all cleanup operations
   - Include file counts and sizes in logs

### Backup Before Cleanup

1. **Critical Data Backup**
   - Backup important data before cleanup
   - Verify backup integrity

2. **Recovery Procedures**
   - Document data recovery procedures
   - Test recovery from backups regularly

This runbook ensures reliable, secure, and efficient data management operations for the Donna Interactive system.
