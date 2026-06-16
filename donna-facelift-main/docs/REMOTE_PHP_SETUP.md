# Remote PHP Backend Configuration

## Overview

Configure DONNA Interactive to communicate with a remote PHP backend (e.g., hosted on SiteGround) instead of local PHP development server.

## Configuration Options

### Option 1: Server-to-Server Only (Recommended)
Use this for secure server-to-server communication without exposing PHP backend to browsers.

```bash
# Environment Configuration
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true

# Keep browser calls to Next.js (more secure)
# NEXT_PUBLIC_API_BASE should NOT be set
```

**Benefits**:
- No CORS configuration needed on PHP server
- PHP backend not exposed to browsers
- Better security isolation
- Simpler deployment

### Option 2: Direct Browser Access (Advanced)
Use this if you need browsers to call PHP directly (requires CORS setup).

```bash
# Environment Configuration  
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
NEXT_PUBLIC_API_BASE=https://bemdonna.com/donna

# Required CORS setup on PHP server
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

**Requirements**:
- PHP server must configure CORS headers
- WAF/ModSecurity rules must allow frontend origins
- Additional security considerations

## Endpoint Mapping

With `REMOTE_PHP_BASE=https://bemdonna.com/donna`, endpoints map to:

| Local Development | Remote Production |
|------------------|-------------------|
| `http://127.0.0.1:8000/api/health.php` | `https://bemdonna.com/donna/api/health.php` |
| `http://127.0.0.1:8000/api/marketing.php` | `https://bemdonna.com/donna/api/marketing.php` |
| `http://127.0.0.1:8000/api/sales/overview.php` | `https://bemdonna.com/donna/api/sales/overview.php` |

## Setup Instructions

### 1. Configure Environment Variables

Create or update `.env.local`:
```bash
# Core Configuration
OPENAI_API_KEY=your_openai_api_key
ALLOWED_ORIGINS=http://localhost:3000

# Remote PHP Backend
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true

# Authentication (adjust for your setup)
AUTH_DISABLE_CLERK=true
JWT_SECRET=dev
NEXT_PUBLIC_DEV_JWT=dev.header.payload
```

### 2. Restart Next.js Server
```bash
# Stop current server (Ctrl+C)
# Restart with new configuration
npm run dev
```

### 3. Verify Remote Connection

#### Test Remote PHP Health
```bash
# Direct test to remote PHP
curl -i https://bemdonna.com/donna/api/health.php

# Should return JSON with health status
```

#### Test Fanout from Next.js
```bash
# Test server-to-server communication
curl -X POST http://localhost:3000/api/voice/fanout \
  -H "Content-Type: application/json" \
  -d '{"test": "fanout"}'

# Check PHP logs or side effects to confirm fanout worked
```

## Development Workflow

### Local Development (Default)
```bash
# Use local PHP server
DEV_PHP_BASE=http://127.0.0.1:8000
# Start local PHP: php -S 127.0.0.1:8000 -t .
```

### Remote Development  
```bash
# Use remote PHP backend
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
```

### Hybrid Development
```bash
# Use remote for some services, local for others
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
DEV_PHP_BASE=http://127.0.0.1:8000  # Fallback for dev-only endpoints
```

## Security Considerations

### PHP Server Requirements
- **HTTPS Required**: All remote communication must use HTTPS
- **CORS Configuration**: If enabling browser access
- **WAF Configuration**: Ensure frontend origins aren't blocked
- **Rate Limiting**: Configure appropriate limits on PHP server

### Network Security
- **Firewall Rules**: Allow Next.js server IP to access PHP backend
- **SSL Certificates**: Ensure valid certificates on PHP server
- **VPN/Private Network**: Consider private network for server-to-server communication

## Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check if PHP backend is accessible
curl -i https://bemdonna.com/donna/api/health.php

# Verify environment variables are set
echo $REMOTE_PHP_BASE
echo $ALLOW_REMOTE_PHP_FANOUT
```

#### CORS Errors (Browser Access)
```bash
# Check CORS headers from PHP
curl -H "Origin: http://localhost:3000" -I https://bemdonna.com/donna/api/health.php

# Should include: Access-Control-Allow-Origin: http://localhost:3000
```

#### Authentication Issues
```bash
# Test PHP authentication
curl -X POST https://your-app.com/api/realtime/token  # Next.js token endpoint

# Should return 401 if auth is working
```

### Debug Mode
```bash
# Enable debug logging
DEBUG_REMOTE_FANOUT=true
DEBUG_CORS=true

# Check Next.js logs for fanout attempts
npm run dev
```

## Production Deployment

### Environment Setup
```bash
# Production environment variables
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
ALLOWED_ORIGINS=https://your-production-domain.com
OPENAI_API_KEY=your_production_openai_key
JWT_SECRET=your_production_jwt_secret
AUTH_DISABLE_CLERK=false
```

### Verification Steps
1. [ ] Test all critical API endpoints
2. [ ] Verify authentication flows
3. [ ] Test WebSocket connections
4. [ ] Validate voice functionality
5. [ ] Monitor error rates and response times

### Monitoring Setup
- [ ] Health check monitoring configured
- [ ] Error rate alerts configured  
- [ ] Performance monitoring active
- [ ] Security event monitoring enabled

## Update History
- 2025-09-10:
  - Clarified that `/api/realtime/token` is the Next.js token endpoint (not PHP)
  - Expanded verification and cautions for server-to-server vs browser access
