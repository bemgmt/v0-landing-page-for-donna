# Release Checklist

## Pre-Release Requirements

### ✅ Environment Configuration

#### Required Environment Variables
- [ ] `OPENAI_API_KEY` - Valid OpenAI API key with realtime access
- [ ] `ALLOWED_ORIGINS` - Comma-separated allowlist of frontend origins
- [ ] `JWT_SECRET` - Strong secret (minimum 32 characters) for token signing

#### Security Configuration
- [ ] `AUTH_DISABLE_CLERK=false` (enable authentication in production)
- [ ] `NODE_ENV=production` 
- [ ] `ENABLE_WS_PROXY=true` (if using WebSocket proxy)
- [ ] `ENABLE_SERVER_VAD=false` (default: disable voice activity detection)

#### Optional Remote PHP Configuration
- [ ] `REMOTE_PHP_BASE` - URL to remote PHP backend (if using)
- [ ] `ALLOW_REMOTE_PHP_FANOUT=true` - Enable server-to-server communication
- [ ] `NEXT_PUBLIC_API_BASE` - PHP URL for browser calls (if needed)

### ✅ Security Verification

#### CORS Testing
```bash
# Test allowed origin (should return 200)
curl -H "Origin: https://your-domain.com" https://your-app.com/api/health

# Test blocked origin (should return 403)  
curl -H "Origin: https://malicious.com" https://your-app.com/api/health
```

#### Authentication Testing
```bash
# Test unauthorized access (should return 401)
curl -X POST https://your-app.com/api/realtime/token

# Test with valid auth (should return token)
curl -X POST -H "Authorization: Bearer valid-token" https://your-app.com/api/realtime/token
```

#### WebSocket Security
```bash
# Connect to the realtime path
wscat -c wss://your-app.com/realtime

# Authenticate by sending a message after connect (expect auth_success)
> {"type":"authenticate","token":"<valid-jwt>"}

# Invalid auth behavior:
# - Auth timeout: close code 4001
# - Invalid token: close code 4003
```

### ✅ Functional Testing

#### Core Application Tests
- [ ] `npm run test:ci` - All unit tests pass
- [ ] `npm run test:e2e` - End-to-end tests pass
- [ ] `npm run build` - Production build succeeds
- [ ] `npm run lint -- --max-warnings 0` - No lint warnings

#### Voice & Realtime Tests
- [ ] `npm run test:ws2:all` - WebSocket protocol tests pass
- [ ] WebSocket server smoke test passes
- [ ] Voice recording/playback functional in UI
- [ ] Realtime conversation flow works end-to-end

#### Backend Integration Tests
- [ ] `npm run test:security:smoke` - Token/CORS/auth-path checks
- [ ] `npm run test:ws2:all` - WebSocket protocol tests
- [ ] Health endpoints respond correctly
- [ ] Rate limiting enforced properly
- [ ] Error responses use standard format

### ✅ Performance & Quality

#### Build Quality
- [ ] TypeScript compilation with zero errors
- [ ] ESLint with zero warnings in CI
- [ ] Security audit passes (`npm audit --audit-level=high`)
- [ ] Bundle size within acceptable limits

#### Performance Benchmarks
- [ ] Health endpoint responds < 200ms
- [ ] WebSocket connection establishes < 2s
- [ ] Voice processing latency < 1s
- [ ] Page load times acceptable

### ✅ Infrastructure Readiness

#### Monitoring & Observability
- [ ] Health endpoints configured and accessible
- [ ] Error tracking and alerting configured
- [ ] Log aggregation and retention policies set
- [ ] Performance monitoring dashboard ready

#### Backup & Recovery
- [ ] Database backup strategy (if applicable)
- [ ] Configuration backup procedures
- [ ] Rollback plan documented and tested
- [ ] Emergency contact procedures defined

## Release Deployment

### ✅ Pre-Deployment

#### Final Verification
- [ ] All environment variables set in production environment
- [ ] SSL certificates valid and configured
- [ ] DNS records pointing to correct endpoints
- [ ] CDN configuration (if applicable)

#### Security Hardening
- [ ] Remove debug flags and development settings
- [ ] Verify no test credentials in production
- [ ] Confirm rate limiting active
- [ ] Validate CORS allowlist for production domains

### ✅ Deployment Steps

#### Application Deployment
1. [ ] Deploy application to production environment
2. [ ] Verify health endpoints respond correctly
3. [ ] Test authentication flow end-to-end
4. [ ] Validate WebSocket connections work
5. [ ] Test voice functionality with real users

#### Post-Deployment Verification
```bash
# Health check
curl https://your-app.com/api/health

# Authentication test
curl -X POST https://your-app.com/api/realtime/token

# CORS test
curl -H "Origin: https://your-domain.com" https://your-app.com/api/health
```

### ✅ Post-Release

#### Monitoring Setup
- [ ] Set up alerts for health endpoint failures
- [ ] Monitor error rates and response times
- [ ] Track authentication failures and suspicious activity
- [ ] Monitor WebSocket connection success rates

#### Documentation Updates
- [ ] Update README with production URLs
- [ ] Document any environment-specific configurations
- [ ] Update API documentation if endpoints changed
- [ ] Record deployment notes and lessons learned

## Emergency Procedures

### Security Incident Response
1. **Immediate Actions**:
   - [ ] Rotate `OPENAI_API_KEY` if compromised
   - [ ] Update `ALLOWED_ORIGINS` if origin compromised
   - [ ] Change `JWT_SECRET` if token system compromised

2. **Investigation**:
   - [ ] Check logs for trace IDs of suspicious activity
   - [ ] Audit recent configuration changes
   - [ ] Review rate limit violations and blocked requests

3. **Communication**:
   - [ ] Notify stakeholders of incident
   - [ ] Document timeline and impact
   - [ ] Plan preventive measures

### Rollback Procedures
1. **Application Rollback**:
   - [ ] Deploy previous known-good version
   - [ ] Verify health endpoints respond
   - [ ] Test critical user flows

2. **Configuration Rollback**:
   - [ ] Restore previous environment variables
   - [ ] Verify CORS and authentication settings
   - [ ] Test WebSocket connectivity

## Compliance Checklist

### Data Protection
- [ ] PII handling procedures documented
- [ ] Data retention policies configured
- [ ] Automatic data cleanup enabled
- [ ] Audit logging configured

### Security Standards
- [ ] All endpoints use HTTPS in production
- [ ] Security headers applied consistently
- [ ] Input validation active on all endpoints
- [ ] Error messages don't leak sensitive information

---

**Release Approval**: This checklist must be completed and signed off before production deployment.

**Emergency Contact**: [Provide emergency contact information]

**Last Updated**: [Update date with each release]

## Update History
- 2025-09-10:
  - WebSocket path and auth flow updated (use `/realtime`, send `{"type":"authenticate","token":"..."}` after connect)
  - Documented close codes 4001 (auth timeout) and 4003 (invalid token)
  - Replaced `npm run test:php-schemas` with `npm run test:security:smoke` and `npm run test:ws2:all`
