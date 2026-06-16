# SiteGround PHP Backend Deployment Guide

## FTP Connection Details
- **Hostname:** ftp.bemdonna.com
- **Username:** derek@bemdonna.com
- **Password:** Thecone4peace!
- **Port:** 21

## Files to Upload

### 1. Core PHP Files
Upload these folders/files to `public_html/donna/`:
```
api/                    (entire folder)
vendor/                 (entire folder - Composer dependencies)
bootstrap_env.php       (single file)
composer.json          (single file)
composer.lock          (single file)
```

### 2. Data & Logs Directories
Create these writable directories:
```
public_html/donna/data/
public_html/donna/data/chat_sessions/
public_html/donna/data/memory/
public_html/donna/data/rate/
public_html/donna/logs/
```

### 3. Environment File
Create `.env` file in your HOME directory (OUTSIDE public_html for security):
```
Location: /home/username/.env
Content: Copy from your local .env file
```

## File Permissions (via cPanel File Manager or FTP client)
```
chmod 755 public_html/donna/
chmod 755 public_html/donna/api/
chmod 644 public_html/donna/api/*.php
chmod 755 public_html/donna/data/
chmod 755 public_html/donna/data/chat_sessions/
chmod 755 public_html/donna/data/memory/
chmod 755 public_html/donna/data/rate/
chmod 755 public_html/donna/logs/
chmod 600 /home/username/.env (secure)
```

## Test URLs After Upload
- Health Check: https://bemdonna.com/donna/api/health.php
- Test Chat: https://bemdonna.com/donna/api/donna_logic.php (POST)

## Important Notes
1. Make sure PHP 8.0+ is enabled in cPanel
2. Ensure cURL extension is enabled
3. The .env file should be OUTSIDE public_html for security
4. Data and logs directories need write permissions
