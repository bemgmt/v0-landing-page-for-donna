# Environment Configuration Examples

## Development Environment

### Local Development (.env.local)
```bash
# Authentication (disabled for local dev)
AUTH_DISABLE_CLERK=true
JWT_SECRET=dev
NEXT_PUBLIC_DEV_JWT=dev.header.payload

# OpenAI Configuration
OPENAI_API_KEY=sk-your-dev-api-key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Local PHP Backend
DEV_PHP_BASE=http://127.0.0.1:8000
# Start with: php -S 127.0.0.1:8000 -t .

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001/realtime
ENABLE_WS_PROXY=true

# Development Flags
NODE_ENV=development
NEXT_PUBLIC_USE_WS_PROXY=false
```

## Staging Environment

### Staging with Remote PHP (.env.staging)
```bash
# Authentication (Clerk enabled)
AUTH_DISABLE_CLERK=false
CLERK_SECRET_KEY=your_staging_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_staging_clerk_public
JWT_SECRET=your_staging_jwt_secret_32_chars_minimum

# OpenAI Configuration
OPENAI_API_KEY=sk-your-staging-api-key

# CORS Configuration
ALLOWED_ORIGINS=https://staging.donna.com,http://localhost:3000

# Remote PHP Backend
REMOTE_PHP_BASE=https://staging.bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=wss://staging-ws.donna.com
ENABLE_WS_PROXY=true

# Staging Flags
NODE_ENV=production
NEXT_PUBLIC_USE_WS_PROXY=true
```

## Production Environment

### Production (.env.production)
```bash
# Authentication (Clerk enabled)
AUTH_DISABLE_CLERK=false
CLERK_SECRET_KEY=your_production_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_production_clerk_public
JWT_SECRET=your_production_jwt_secret_64_chars_recommended

# OpenAI Configuration
OPENAI_API_KEY=sk-your-production-api-key

# CORS Configuration (production domains only)
ALLOWED_ORIGINS=https://donna.com,https://www.donna.com

# Remote PHP Backend
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=wss://ws.donna.com
ENABLE_WS_PROXY=true

# Production Flags
NODE_ENV=production
NEXT_PUBLIC_USE_WS_PROXY=true

# Security Hardening
ENABLE_SERVER_VAD=false
MAX_CONNECTIONS_PER_IP=5
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your_sentry_dsn
ENABLE_PERFORMANCE_MONITORING=true
```

## Special Configurations

### High Security Setup
```bash
# Stricter security settings
MAX_CONNECTIONS_PER_IP=3
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50
ENABLE_REQUEST_LOGGING=true
ENABLE_SECURITY_HEADERS=true
```

### Development with Remote PHP
```bash
# Use remote PHP but keep dev auth
AUTH_DISABLE_CLERK=true
JWT_SECRET=dev
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
ALLOWED_ORIGINS=http://localhost:3000
```

### Testing Environment
```bash
# Automated testing setup
NODE_ENV=test
AUTH_DISABLE_CLERK=true
JWT_SECRET=test-secret-key
ALLOWED_ORIGINS=http://localhost:3000
OPENAI_API_KEY=sk-test-key
ENABLE_TEST_ENDPOINTS=true
```

## Variable Reference

### Core Variables
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key with realtime access | `sk-proj-...` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS allowlist | `https://donna.com,https://www.donna.com` |
| `JWT_SECRET` | ✅ | Secret for JWT token signing | `your-secret-minimum-32-characters` |

### Authentication Variables  
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AUTH_DISABLE_CLERK` | No | Disable Clerk auth (dev only) | `true` |
| `CLERK_SECRET_KEY` | Prod | Clerk secret key | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Prod | Clerk public key | `pk_live_...` |

### PHP Backend Variables
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REMOTE_PHP_BASE` | No | Remote PHP backend URL | `https://bemdonna.com/donna` |
| `ALLOW_REMOTE_PHP_FANOUT` | No | Enable remote fanout | `true` |
| `NEXT_PUBLIC_API_BASE` | No | PHP URL for browser calls | `https://bemdonna.com/donna` |
| `DEV_PHP_BASE` | Dev | Local PHP server URL | `http://127.0.0.1:8000` |

### WebSocket Variables
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | No | WebSocket server URL | `wss://ws.donna.com` |
| `ENABLE_WS_PROXY` | No | Enable WebSocket proxy | `true` |
| `NEXT_PUBLIC_USE_WS_PROXY` | No | Client uses proxy | `true` |

### Security Variables
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ENABLE_SERVER_VAD` | No | Voice activity detection | `false` |
| `MAX_CONNECTIONS_PER_IP` | No | Connection limit per IP | `5` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |

## Quick Setup Commands

### Development Setup
```bash
# Copy example and edit
cp docs/ENV_CONFIG_EXAMPLES.md .env.local.example
# Edit .env.local with your values
npm run dev
```

### Production Setup  
```bash
# Set production environment variables in your hosting platform
# Verify with health check
npm run health-check https://your-domain.com/api/health
```

### Testing Setup
```bash
# Run all verification tests
npm run test:ws2:all
npm run test:security:smoke
```

## Update History
- 2025-09-10:
  - Set default `NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001/realtime`
  - Removed unused `DEBUG_REMOTE_FANOUT` and non-implemented `TOKEN_TTL_MINUTES`
  - Removed non-existent `test:php-schemas` reference
