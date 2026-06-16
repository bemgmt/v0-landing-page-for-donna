# DONNA Interactive - Deployment Guide

## 🚀 Security-Enhanced Deployment Checklist

This guide covers deploying DONNA Interactive with the newly integrated security features.

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set all required environment variables:
  - [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] Configure authentication (choose one):
  - [ ] **Clerk** (recommended): Set `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
  - [ ] **JWT**: Set `JWT_SECRET` and `AUTH_DISABLE_CLERK=true`
- [ ] Optional but recommended:
  - [ ] `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` for error monitoring
  - [ ] `ALLOWED_ORIGINS` for CORS security
  - [ ] `PRODUCTION_DOMAIN` for security headers

### 2. Security Configuration
- [ ] Set `ENABLE_API_SECURITY=true` for production
- [ ] Configure allowed origins in `ALLOWED_ORIGINS`
- [ ] Set up proper domain in `PRODUCTION_DOMAIN`
- [ ] Review and update CORS settings in `next.config.mjs`

### 3. Build Validation
- [ ] Run environment validation: `npm run validate-env`
- [ ] Run security tests: `node scripts/test-security.mjs`
- [ ] Run API security tests: `node scripts/test-api-security.mjs`
- [ ] Test TypeScript compilation: `npm run lint && npx tsc --noEmit --skipLibCheck lib/ app/api/`

### 4. Code Quality Validation
- [ ] **ESLint Validation**: Run `npm run lint` to ensure zero warnings
- [ ] **Build Process**: Verify builds fail on ESLint violations (`ignoreDuringBuilds: false`)
- [ ] **Resolve Issues**: Fix all linting violations before deployment
- [ ] **Justification Check**: Ensure all ESLint disable comments have proper justification

**Note**: The build process now enforces ESLint rules. Any violations will cause deployment failures.

## 🔒 Security Features Overview

### Authentication & Authorization
- **Clerk Integration**: Modern authentication with JWT fallback
- **Rate Limiting**: Sliding window rate limiting per IP/user
- **Input Validation**: Schema-based request validation
- **Security Logging**: Comprehensive audit trail with trace IDs

### API Security
- **Feature Flags**: Security can be disabled in development
- **CORS Protection**: Configurable origin allowlisting
- **Security Headers**: Comprehensive security headers
- **Request Tracing**: Unique trace IDs for request tracking

### Monitoring & Observability
- **Sentry Integration**: Error tracking and performance monitoring
- **Security Events**: Detailed security event logging
- **Health Checks**: Automated system health monitoring

## 🌐 Deployment Platforms

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds

**Environment Variables for Vercel:**
```bash
# Required
OPENAI_API_KEY=sk-your-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Authentication (choose one)
CLERK_PUBLISHABLE_KEY=pk_your-key
CLERK_SECRET_KEY=sk_your-key
# OR
JWT_SECRET=your-jwt-secret
AUTH_DISABLE_CLERK=true

# Security (recommended)
ENABLE_API_SECURITY=true
ALLOWED_ORIGINS=https://yourdomain.com
PRODUCTION_DOMAIN=yourdomain.com

# Monitoring (optional)
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

### Other Platforms
- Ensure Node.js 18.17.0+ is available
- Set all required environment variables
- Run `npm run build` to build the application
- Serve the `.next` directory with a Node.js server

## 🧪 Testing in Production

### 1. Security Feature Testing
```bash
# Test rate limiting (should return 429 after limits)
curl -X POST https://yourdomain.com/api/realtime/token \
  -H "Content-Type: application/json" \
  -d '{"instructions": "test"}'

# Test CORS headers
curl -H "Origin: https://unauthorized-domain.com" \
  https://yourdomain.com/api/realtime/token

# Test input validation
curl -X POST https://yourdomain.com/api/realtime/token \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

### 2. Functionality Testing
- [ ] Test Gmail integration and OAuth flow
- [ ] Test AI email drafting and autopilot features
- [ ] Test OpenAI Realtime voice chat functionality
- [ ] Test all API endpoints respond correctly

### 3. Performance Testing
- [ ] Monitor response times with security enabled
- [ ] Check memory usage and rate limiting performance
- [ ] Verify Sentry is receiving events

## 🔧 Configuration Options

### Security Levels
- **Development**: Security disabled by default, full logging
- **Production**: All security features enabled, optimized logging

### Feature Flags
```bash
# Enable security in development
ENABLE_API_SECURITY=true

# Disable Clerk, use JWT
AUTH_DISABLE_CLERK=true

# Custom rate limits (optional)
API_RATE_LIMIT_PER_MINUTE=100
```

## 🚨 Troubleshooting

### Common Issues
1. **Rate Limiting Too Aggressive**: Adjust limits in `lib/rate-limit.ts`
2. **CORS Errors**: Check `ALLOWED_ORIGINS` and `next.config.mjs`
3. **Authentication Failures**: Verify Clerk/JWT configuration
4. **Build Errors**: Run `npm run validate-env` to check configuration

### Debug Mode
Set `DEBUG_MODE=true` in development for verbose logging.

### Security Logs
Check application logs for security events:
- Authentication attempts
- Rate limit violations
- Input validation failures
- CORS violations

## 📊 Monitoring

### Sentry Integration
- Error tracking and performance monitoring
- Security event alerts
- Real-time error notifications

### Health Checks
```bash
# Check application health
curl https://yourdomain.com/api/health

# Check security status
node scripts/test-security.mjs
```

## 🔄 Updates and Maintenance

### Security Updates
- Regularly update dependencies: `npm audit fix`
- Monitor security advisories
- Review and rotate API keys quarterly

### Performance Monitoring
- Monitor rate limiting effectiveness
- Review security logs for patterns
- Optimize based on usage patterns

## 📞 Support

For deployment issues:
1. Check environment validation: `npm run validate-env`
2. Run security tests: `node scripts/test-api-security.mjs`
3. Review application logs and Sentry events
4. Verify all required environment variables are set

---

**Security Note**: Never commit actual API keys or secrets to version control. Always use environment variables and secure secret management.
