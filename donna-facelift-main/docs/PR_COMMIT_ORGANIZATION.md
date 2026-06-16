# PR Commit Organization Guide

This guide provides a structured approach for organizing the production deployment fixes into logical, atomic commits for the GitHub Pull Request.

## Commit Structure

Use conventional commit format with clear, descriptive messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types
- `feat`: New features or enhancements
- `fix`: Bug fixes
- `config`: Configuration changes
- `docs`: Documentation updates
- `test`: Testing infrastructure
- `refactor`: Code refactoring without functional changes
- `perf`: Performance improvements

## Recommended Commit Organization

### 1. WebSocket Infrastructure Improvements
**Commit Message**: `feat(websocket): enhance server connection handling and CORS configuration`

**Files to include**:
- `websocket-server/server.js` (connection limits, cleanup logic)
- `websocket-server/cors-config.js` (CORS handling improvements)
- `websocket-server/package.json` (dependency updates)
- `websocket-server/README.md` (configuration documentation)

**Description**: Improves WebSocket server stability with enhanced connection limits, better cleanup logic, and proper CORS handling for production domains.

### 2. Gmail OAuth Configuration Fixes
**Commit Message**: `fix(auth): resolve gmail oauth redirect uri mismatch for production`

**Files to include**:
- `pages/api/gmail/oauth/callback.js` (OAuth callback handling)
- `lib/gmail-auth.js` (OAuth configuration)
- `docs/GMAIL_OAUTH_SETUP.md` (OAuth setup documentation)
- Environment variable templates with OAuth settings

**Description**: Fixes Gmail OAuth redirect URI configuration to work correctly with production domain, resolving authentication failures.

### 3. Frontend Environment Configuration
**Commit Message**: `config(frontend): add production environment variables and CORS settings`

**Files to include**:
- `vercel-env-vars.txt` (Vercel environment variables)
- `next.config.js` (Next.js configuration updates)
- `.env.example` (environment variable examples)
- `docs/VERCEL_DEPLOYMENT_SETUP.md` (deployment documentation)

**Description**: Adds missing environment variables for production deployment including WebSocket URL, API base, and CORS configuration.

### 4. Backend API Integration Enhancements
**Commit Message**: `feat(backend): improve cors handling and production api routing`

**Files to include**:
- `backend/cors-config.php` (CORS configuration)
- `backend/.htaccess` (URL rewriting rules)
- `backend/api/health.php` (health check endpoint)
- `docs/SITEGROUND_BACKEND_SETUP.md` (backend setup guide)

**Description**: Enhances backend API integration with improved CORS handling and production-ready routing configuration.

### 5. Testing and Monitoring Infrastructure
**Commit Message**: `test: add production validation and monitoring scripts`

**Files to include**:
- `scripts/production-health-check.mjs` (health check script)
- `scripts/validate-production-env.mjs` (environment validation)
- `scripts/test-websocket-connection.mjs` (WebSocket testing)
- `scripts/test-gmail-oauth.mjs` (OAuth testing)
- `scripts/pre-pr-validation.mjs` (pre-PR validation)

**Description**: Adds comprehensive testing and monitoring infrastructure for production environment validation.

### 6. Documentation Updates
**Commit Message**: `docs: update deployment guides and troubleshooting documentation`

**Files to include**:
- `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- `docs/PRODUCTION_VALIDATION_CHECKLIST.md`
- `docs/PRODUCTION_DEPLOYMENT_SUMMARY.md`
- `docs/TROUBLESHOOTING.md`
- `docs/RAILWAY_ENV_SETUP.md`
- `README.md` (updated setup instructions)

**Description**: Updates all documentation with comprehensive deployment guides, troubleshooting information, and configuration templates.

## File Grouping Strategy

### Group Related Changes Together
- **WebSocket files**: Server configuration, CORS settings, and related documentation
- **OAuth files**: Authentication configuration, callback handling, and OAuth documentation
- **Environment files**: All environment variable templates and configuration files
- **Testing files**: All testing scripts grouped by functionality (health checks, validation, monitoring)
- **Documentation files**: Group by topic (deployment, troubleshooting, setup guides)

### Separate Concerns
- Keep frontend changes separate from backend changes
- Separate configuration changes from feature changes
- Keep testing infrastructure separate from application code
- Group documentation updates by related functionality

## Commit Message Examples

### Good Commit Messages
```
feat(websocket): enhance connection limits and cleanup for production
fix(oauth): resolve gmail redirect uri mismatch in production environment
config(vercel): add missing websocket url and cors environment variables
test: add comprehensive production health check and validation scripts
docs: update deployment checklist and troubleshooting guides
```

### Avoid These Commit Messages
```
fix stuff
update files
production fixes
misc changes
wip
```

## PR Preparation Steps

### 1. Branch Creation
```bash
git checkout -b fix/websocket-production-deployment
```

### 2. Stage Changes by Category
```bash
# Stage WebSocket improvements
git add websocket-server/ docs/RAILWAY_ENV_SETUP.md
git commit -m "feat(websocket): enhance server connection handling and CORS configuration"

# Stage OAuth fixes
git add pages/api/gmail/ lib/gmail-auth.js docs/GMAIL_OAUTH_SETUP.md
git commit -m "fix(auth): resolve gmail oauth redirect uri mismatch for production"

# Continue with other categories...
```

### 3. Final Validation
```bash
# Run pre-PR validation
node scripts/pre-pr-validation.mjs

# Verify commit history
git log --oneline

# Push to remote
git push origin fix/websocket-production-deployment
```

### 4. Create Pull Request
Use the GitHub web interface or CLI to create the PR with the comprehensive template.

## Best Practices

### Commit Size
- Keep commits focused on a single concern
- Aim for commits that can be reviewed in 10-15 minutes
- Include related documentation with code changes
- Ensure each commit builds and passes tests

### Commit Messages
- Use present tense ("add" not "added")
- Be specific about what changed and why
- Reference issue numbers when applicable
- Include breaking change notes in footer

### File Organization
- Group related files in the same commit
- Keep configuration changes together
- Separate new features from bug fixes
- Include tests with the code they test

## Review Checklist

Before creating the PR, ensure:
- [ ] Each commit has a clear, descriptive message
- [ ] Related files are grouped together logically
- [ ] No commit mixes unrelated changes
- [ ] All commits build and pass tests
- [ ] Documentation is updated with code changes
- [ ] Environment variable changes are documented
- [ ] Security considerations are addressed

This organization will create a clean, reviewable PR that tells the story of the production deployment improvements clearly and logically.
