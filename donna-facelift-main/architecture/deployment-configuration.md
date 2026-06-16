# Deployment & Configuration Guide

## Overview

This guide provides comprehensive instructions for deploying and configuring the DONNA platform across different environments, from local development to production deployment. The platform is designed to work with various hosting solutions, from shared hosting to cloud platforms.

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DONNA DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────┤
│  PRODUCTION ENVIRONMENT                                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Vercel          │ │ Shared Hosting  │ │ Railway/Render  │   │
│  │ (Frontend)      │ │ (PHP Backend)   │ │ (WebSocket)     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  DEVELOPMENT ENVIRONMENT                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Next.js Dev     │ │ XAMPP/LAMP      │ │ Node.js Server  │   │
│  │ (Local:3000)    │ │ (Local:80)      │ │ (Local:3001)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Setup

### 1. Development Environment

**Prerequisites**:
- Node.js 18+ and npm
- PHP 8.0+ with cURL extension
- XAMPP, WAMP, or LAMP stack
- Git for version control

**Local Development Setup**:

1. **Clone Repository**:
```bash
git clone <repository-url>
cd donna
```

2. **Install Frontend Dependencies**:
```bash
npm install
```

3. **Install Backend Dependencies** (if using Composer):
```bash
composer install
```

4. **Environment Configuration**:
Create `.env` file in project root:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt
VOICE_MODEL=eleven_multilingual_v2

# Gmail Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_ENCRYPTION=tls
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=DONNA

# System Configuration
DOMAIN_NAME=localhost
ENVIRONMENT=development
DEBUG_MODE=true
NEXT_PUBLIC_API_BASE=http://localhost/donna
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001/realtime
```

5. **Start Development Servers**:

**Frontend (Next.js)**:
```bash
npm run dev
# Runs on http://localhost:3000
```

**Backend (PHP)**:
- Start XAMPP/WAMP/LAMP
- Place project in web root (e.g., `htdocs/donna`)
- Access via `http://localhost/donna`

**WebSocket Server (Node.js)**:
```bash
cd websocket-server
npm install
npm start
# Runs on ws://localhost:3001
```

### 2. Production Environment

**Frontend Deployment (Vercel)**:

1. **Connect Repository**:
   - Link GitHub repository to Vercel
   - Configure build settings

2. **Environment Variables**:
   Set in Vercel dashboard:
```bash
NEXT_PUBLIC_API_BASE=https://yourdomain.com/donna
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.com/realtime
NEXT_PUBLIC_MARKETING_API=https://yourdomain.com/donna
```

3. **Build Configuration**:
   `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

**Backend Deployment (Shared Hosting)**:

1. **File Upload**:
   - Upload PHP files to web root
   - Ensure proper file permissions (755 for directories, 644 for files)

2. **Environment Configuration**:
   Create `.env` file outside web root:
```bash
# Place in /home/username/.env (outside public_html)
OPENAI_API_KEY=your_production_openai_key
ELEVENLABS_API_KEY=your_production_elevenlabs_key
# ... other production keys
```

3. **Directory Structure**:
```
/home/username/
├── .env                    # Environment variables (outside web root)
├── public_html/
│   └── donna/
│       ├── api/           # PHP API endpoints
│       ├── data/          # Data storage (writable)
│       ├── logs/          # Log files (writable)
│       └── voice_system/  # Voice processing
```

4. **File Permissions**:
```bash
chmod 755 data/
chmod 755 logs/
chmod 644 data/*.json
chmod 644 logs/*.log
```

**WebSocket Server Deployment (Railway/Render)**:

1. **Railway Deployment**:
   - Connect GitHub repository
   - Set environment variables
   - Configure port binding

2. **Environment Variables**:
```bash
OPENAI_API_KEY=your_openai_key
PORT=3001
NODE_ENV=production
```

3. **Railway Configuration**:
   `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

## Configuration Management

### 1. Environment Variables

**Required Variables**:
```bash
# Core AI Services
OPENAI_API_KEY=sk-...                    # OpenAI API key
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01
ELEVENLABS_API_KEY=...                   # ElevenLabs API key
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt   # Custom voice ID

# Email Services
GMAIL_CLIENT_ID=...                      # Gmail OAuth client ID
GMAIL_CLIENT_SECRET=...                  # Gmail OAuth secret
SMTP_HOST=smtp.gmail.com                 # SMTP server
SMTP_USERNAME=...                        # SMTP username
SMTP_PASSWORD=...                        # SMTP password

# System Configuration
DOMAIN_NAME=yourdomain.com               # Production domain
ENVIRONMENT=production                   # Environment type
DEBUG_MODE=false                         # Debug mode
```

**Frontend Variables**:
```bash
# Public environment variables (exposed to browser)
NEXT_PUBLIC_API_BASE=https://yourdomain.com/donna
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.com/realtime
NEXT_PUBLIC_MARKETING_API=https://yourdomain.com/donna
```

### 2. PHP Configuration

**Bootstrap Environment** (`bootstrap_env.php`):
```php
<?php
// Environment variable loading with multiple fallback paths
$docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', DIRECTORY_SEPARATOR);
$envDir = dirname($docRoot); // Go up one level from public_html
$envPath = $envDir . DIRECTORY_SEPARATOR . '.env';

if (is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $trim = trim($line);
        if ($trim === '' || $trim[0] === '#') continue;
        if (strpos($trim, '=') === false) continue;
        [$k, $v] = array_map('trim', explode('=', $trim, 2));
        // Strip surrounding quotes
        if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || 
            (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
            $v = substr($v, 1, -1);
        }
        putenv("$k=$v");
        $_ENV[$k] = $v;
        $_SERVER[$k] = $v;
    }
}
?>
```

**PHP Requirements**:
- PHP 8.0 or higher
- cURL extension enabled
- JSON extension enabled
- File system write permissions
- SSL/TLS support for HTTPS

### 3. Next.js Configuration

**Next.js Config** (`next.config.mjs`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  
  // API rewrites for development
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return []
    return [
      { source: '/donna/api/:path*', destination: 'http://localhost/donna/api/:path*' },
      { source: '/api/:path*', destination: 'http://localhost/donna/api/:path*' },
    ]
  },
  
  // CORS headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  }
}

export default nextConfig
```

## Database Configuration

### 1. File-Based Storage (Current)

**Directory Structure**:
```
data/
├── chat_sessions/           # Chat conversation history
│   ├── {chat_id}.json      # Individual chat sessions
│   └── default.json        # Default session template
├── memory/                  # User memory and preferences
│   ├── {user_id}.json      # User-specific memory
│   └── guest_thread.json   # Guest user memory
├── chatbot_settings.json    # Global chatbot configuration
└── cache/                   # API response cache
    └── {cache_key}.json    # Cached responses
```

**File Permissions**:
```bash
# Set proper permissions for data directories
chmod 755 data/
chmod 755 data/chat_sessions/
chmod 755 data/memory/
chmod 755 data/cache/
chmod 755 logs/

# Set permissions for files
chmod 644 data/*.json
chmod 644 data/chat_sessions/*.json
chmod 644 data/memory/*.json
chmod 644 logs/*.log
```

### 2. Database Migration (Future)

**MySQL/MariaDB Schema**:
```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    company VARCHAR(255),
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    messages JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Contacts table
CREATE TABLE contacts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status ENUM('new', 'contacted', 'qualified', 'converted'),
    score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## SSL/TLS Configuration

### 1. SSL Certificate Setup

**Let's Encrypt (Recommended)**:
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Manual SSL Configuration**:
```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/html/donna
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/chain.crt
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

### 2. HTTPS Redirect

**Apache Configuration**:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        root /var/www/html/donna;
        index index.php index.html;
    }
}
```

## Monitoring and Logging

### 1. Application Logging

**PHP Error Logging**:
```php
// Configure error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/donna_errors.log');

// Custom logging function
function logMessage($level, $message, $context = []) {
    $logEntry = [
        'timestamp' => date('c'),
        'level' => $level,
        'message' => $message,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    file_put_contents(
        __DIR__ . '/../logs/app.log',
        json_encode($logEntry) . "\n",
        FILE_APPEND | LOCK_EX
    );
}
```

**Node.js Logging**:
```javascript
// WebSocket server logging
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/websocket-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/websocket-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

### 2. Health Monitoring

**Health Check Endpoints**:
```php
// api/health.php
header('Content-Type: application/json');

$health = [
    'ok' => true,
    'service' => 'donna-api',
    'version' => getenv('APP_VERSION') ?: 'v1',
    'time' => time(),
    'checks' => [
        'database' => checkDatabaseConnection(),
        'openai' => checkOpenAIConnection(),
        'elevenlabs' => checkElevenLabsConnection(),
        'storage' => checkStoragePermissions()
    ]
];

echo json_encode($health);
```

**Frontend Health Monitoring**:
```typescript
// components/ServiceStatus.tsx
const [status, setStatus] = useState<"green"|"amber"|"red">("amber")

useEffect(() => {
  const poll = async () => {
    try {
      const res = await fetch(`${apiBase}/api/health.php`, { cache: 'no-store' })
      if (!res.ok) throw new Error("bad response")
      const json = await res.json()
      setStatus(json.ok ? "green" : "amber")
    } catch (e) {
      setStatus("red")
    }
  }
  
  poll()
  const id = setInterval(poll, 10000) // Poll every 10 seconds
  return () => clearInterval(id)
}, [])
```

## Backup and Recovery

### 1. Data Backup

**Automated Backup Script**:
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/donna"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/html/donna"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data files
tar -czf $BACKUP_DIR/data_$DATE.tar.gz -C $PROJECT_DIR data/

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C $PROJECT_DIR .env bootstrap_env.php

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C $PROJECT_DIR logs/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Cron Job Setup**:
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh >> /var/log/donna-backup.log 2>&1
```

### 2. Recovery Procedures

**Data Recovery**:
```bash
# Restore data from backup
tar -xzf /backups/donna/data_20240101_020000.tar.gz -C /var/www/html/donna/

# Restore configuration
tar -xzf /backups/donna/config_20240101_020000.tar.gz -C /var/www/html/donna/

# Set proper permissions
chmod 755 /var/www/html/donna/data/
chmod 644 /var/www/html/donna/data/*.json
```

## Performance Optimization

### 1. Frontend Optimization

**Build Optimization**:
```bash
# Production build
npm run build

# Bundle analysis
npm run analyze

# Image optimization
npm run optimize-images
```

**Caching Strategy**:
```javascript
// next.config.mjs
const nextConfig = {
  // Enable static optimization
  output: 'standalone',
  
  // Configure caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300' }
        ]
      }
    ]
  }
}
```

### 2. Backend Optimization

**PHP Optimization**:
```php
// Enable OPcache
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

**API Response Caching**:
```php
// Implement response caching
function getCachedResponse($cacheKey, $duration = 300) {
    $cacheFile = __DIR__ . "/../cache/{$cacheKey}.json";
    
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $duration) {
        return json_decode(file_get_contents($cacheFile), true);
    }
    
    return null;
}
```

## Troubleshooting

### 1. Common Issues

**API Connection Issues**:
```bash
# Test API connectivity
curl -X GET https://yourdomain.com/donna/api/health.php

# Check environment variables
php -r "echo getenv('OPENAI_API_KEY') ? 'OK' : 'MISSING';"
```

**WebSocket Connection Issues**:
```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://your-websocket-server.com/realtime')
ws.onopen = () => console.log('Connected')
ws.onerror = (error) => console.error('Connection error:', error)
```

**File Permission Issues**:
```bash
# Fix file permissions
chmod -R 755 /var/www/html/donna/data/
chmod -R 755 /var/www/html/donna/logs/
chown -R www-data:www-data /var/www/html/donna/data/
chown -R www-data:www-data /var/www/html/donna/logs/
```

### 2. Debug Mode

**Enable Debug Mode**:
```bash
# Set debug mode in environment
DEBUG_MODE=true
```

**Debug Logging**:
```php
// Enable debug logging
if (getenv('DEBUG_MODE') === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
}
```

---

*This deployment and configuration guide ensures reliable, secure, and scalable deployment of the DONNA platform across different environments and hosting solutions.*

