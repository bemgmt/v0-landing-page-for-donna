# DONNA WebSocket Server - Security Implementation

## Overview

This WebSocket server has been secured with multiple layers of protection to prevent unauthorized access, DoS attacks, and API abuse.

## Security Features

### 1. Feature Flag Control
- **Environment Variable**: `ENABLE_WS_PROXY=true/false`
- **Purpose**: Allows completely disabling the WebSocket proxy service
- **Implementation**: Returns 503 Service Unavailable when disabled

### 2. JWT Authentication
- **Environment Variable**: `JWT_SECRET=your_secret`
- **Purpose**: Validates clients before allowing OpenAI API access
- **Flow**:
  1. Client connects to WebSocket
  2. Client must send `{ "type": "authenticate", "token": "jwt_token" }` within 10 seconds
  3. Server validates JWT with configured secret
  4. Only authenticated clients can use `connect_realtime`

### 3. Origin Validation
- **Environment Variable**: `ALLOWED_ORIGINS=comma,separated,origins`
- **Purpose**: Prevents CORS attacks and unauthorized domain access
- **Examples**:
  - `ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com`
  - `ALLOWED_ORIGINS=*` (not recommended for production)

### 4. Rate Limiting
- **HTTP Endpoints**: Uses express-rate-limit middleware
- **WebSocket Connections**: Custom per-IP rate limiting
- **Configuration**:
  - `RATE_LIMIT_MAX_REQUESTS=10` (connections per time window)
  - `RATE_LIMIT_WINDOW_MS=60000` (time window in milliseconds)

### 5. Connection Limits
- **Environment Variable**: `MAX_CONNECTIONS_PER_IP=3`
- **Purpose**: Prevents resource exhaustion from single IP
- **Implementation**: Tracks concurrent connections per IP address

### 6. Secure Logging
- **PII Protection**: IP addresses are sanitized in logs (192.168.1.xxx)
- **Security Events**: All authentication failures and security violations logged
- **No Token Logging**: JWT tokens never appear in logs

## Client Authentication Flow

### 1. Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3001/realtime');
```

### 2. Authenticate (Required if JWT_SECRET is set)
```javascript
ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'your_jwt_token_here'
}));

// Wait for auth_success response
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'auth_success') {
        // Now you can connect to OpenAI
        ws.send(JSON.stringify({
            type: 'connect_realtime'
        }));
    }
};
```

### 3. Use OpenAI Realtime API
After authentication, all messages are forwarded to OpenAI as before.

## Environment Configuration

### Development Setup
```bash
# Basic development (no authentication)
ENABLE_WS_PROXY=true
PORT=3001
OPENAI_API_KEY=your_key
# JWT_SECRET not set = no auth required
ALLOWED_ORIGINS=http://localhost:3000
```

### Production Setup
```bash
# Secure production
ENABLE_WS_PROXY=true
PORT=3001
OPENAI_API_KEY=your_key
JWT_SECRET=your_64_character_secret
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
MAX_CONNECTIONS_PER_IP=3
```

## Security Event Logging

The server logs all security events with sanitized data:

```
🔒 [SECURITY] WS_CONNECTION_ESTABLISHED: {"ip":"192.168.1.xxx","totalConnections":1}
🔒 [SECURITY] WS_AUTH_SUCCESS: {"ip":"192.168.1.xxx","userId":"user123"}
🔒 [SECURITY] WS_CONNECTION_BLOCKED_RATE_LIMIT: {"ip":"192.168.1.xxx"}
🔒 [SECURITY] WS_AUTH_FAILED_INVALID_TOKEN: {"ip":"192.168.1.xxx","error":"jwt malformed"}
```

## Installation

1. **Install Dependencies**:
```bash
npm install jsonwebtoken express-rate-limit
```

2. **Copy Environment File**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate JWT Secret** (for production):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

4. **Start Server**:
```bash
npm start
```

## Security Testing

### Test Rate Limiting
```bash
# This should fail after 10 rapid connections
for i in {1..15}; do
  curl -s http://localhost:3001/test &
done
```

### Test Origin Validation
```bash
# This should fail with invalid origin
curl -H "Origin: http://malicious.com" http://localhost:3001/test
```

### Test Feature Flag
```bash
# Set ENABLE_WS_PROXY=false and test
curl http://localhost:3001/test
# Should return 503 Service Unavailable
```

## Monitoring and Alerts

Monitor these security events in your logs:
- `WS_CONNECTION_BLOCKED_*` - Blocked connection attempts
- `WS_AUTH_FAILED_*` - Authentication failures
- `HTTP_RATE_LIMIT_EXCEEDED` - HTTP rate limit violations
- High frequency of connection attempts from single IPs

## Best Practices

1. **Always set JWT_SECRET in production**
2. **Use HTTPS in production** (configure reverse proxy)
3. **Set restrictive ALLOWED_ORIGINS**
4. **Monitor security logs regularly**
5. **Use environment-specific rate limits**
6. **Keep JWT secrets secure and rotate them**
7. **Consider additional WAF/firewall protection**

## Troubleshooting

### "Authentication timeout" Error
- Client didn't send authenticate message within 10 seconds
- Check JWT_SECRET is set and client is sending auth message

### "Invalid token" Error  
- JWT token is malformed or expired
- Verify JWT_SECRET matches between client and server
- Check token generation and signing process

### "Too many requests" Error
- IP exceeded rate limit
- Adjust RATE_LIMIT_MAX_REQUESTS if needed
- Implement exponential backoff in client

### Connection Blocked
- Check ALLOWED_ORIGINS configuration
- Verify ENABLE_WS_PROXY is true
- Check if IP hit connection limits