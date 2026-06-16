# Repository Structure Guide

**Last Updated:** 2025-01-10  
**Maintainer:** Development Team

## Overview

This document describes the clean, opinionated repository structure implemented for the Donna Interactive project. The structure follows modern best practices for maintainability, scalability, and developer experience.

## Directory Structure

```
donna-interactive/
├── 📄 Core Project Files
│   ├── README.md                    # Project overview and setup
│   ├── CHANGELOG.md                 # Version history and changes
│   ├── SECURITY.md                  # Security policies and reporting
│   ├── RELEASE_CHECKLIST.md         # Release process checklist
│   ├── package.json                 # Node.js dependencies and scripts
│   ├── next.config.mjs              # Next.js configuration
│   ├── playwright.config.ts         # E2E testing configuration
│   └── tsconfig.json                # TypeScript configuration
│
├── 🏗️ Application Source
│   ├── app/                         # Next.js App Router pages
│   ├── api/                         # PHP backend API endpoints
│   ├── components/                  # React components
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # Shared utilities (TS/PHP)
│   ├── middleware.ts                # Next.js middleware
│   ├── public/                      # Static assets
│   ├── server/                      # Express.js server components
│   └── styles/                      # CSS and styling
│
├── 🧪 Testing Infrastructure
│   ├── tests/
│   │   ├── e2e/                     # Playwright end-to-end tests
│   │   ├── integration/             # Node.js integration tests
│   │   └── php/                     # PHP backend unit tests
│   ├── __tests__/                   # Jest unit tests
│   └── coverage/                    # Test coverage reports
│
├── 📚 Documentation
│   ├── docs/
│   │   ├── ARCHITECTURE.md          # System architecture overview
│   │   ├── ENVIRONMENT_CONFIG.md    # Environment setup guide
│   │   ├── OPS_RUNBOOK.md           # Operations and maintenance
│   │   ├── SECURITY_HARDENING.md    # Security implementation
│   │   ├── VOICE_SYSTEM_SETUP.md    # Voice system configuration
│   │   ├── agents/                  # AI agent documentation
│   │   │   ├── AGENTS.md            # General agent guidelines
│   │   │   ├── CLAUDE.md            # Claude-specific docs
│   │   │   └── WARP.md              # WARP agent docs
│   │   └── api/                     # API documentation
│   │       └── VALIDATION_SUMMARY.md
│
├── 🔧 Development Tools
│   ├── scripts/                     # Build and utility scripts
│   ├── .github/                     # GitHub workflows and templates
│   └── websocket-server/            # Self-contained WebSocket server
│
├── 📋 Project Management
│   ├── MVP/                         # Planning docs, ADRs, PRDs
│   └── critical_audit.md            # Critical audit findings
│
└── 🗂️ Generated/Runtime
    ├── .next/                       # Next.js build output
    ├── node_modules/                # Dependencies
    ├── coverage/                    # Test coverage
    └── donna-static/                # Generated static assets
```

## Key Principles

### 1. **Separation of Concerns**
- **Source code** (`app/`, `api/`, `components/`, etc.) - Implementation
- **Tests** (`tests/`, `__tests__/`) - Quality assurance
- **Documentation** (`docs/`) - Knowledge and guides
- **Tools** (`scripts/`, `.github/`) - Development workflow

### 2. **Self-Contained Modules**
- `websocket-server/` has its own `package.json` and tests
- `MVP/` contains all planning and architectural decision records
- Each major feature area has dedicated subdirectories

### 3. **Clear Test Organization**
- `tests/e2e/` - End-to-end browser tests (Playwright)
- `tests/integration/` - API and service integration tests
- `tests/php/` - Backend PHP unit tests
- `__tests__/` - Frontend React/TypeScript unit tests

## File Naming Conventions

### Documentation
- Use `UPPERCASE.md` for top-level docs (README.md, CHANGELOG.md)
- Use `kebab-case.md` for specific guides (environment-config.md)
- Use descriptive names that indicate purpose

### Tests
- E2E tests: `*.spec.ts` (Playwright convention)
- Integration tests: `test-*.mjs` (Node.js modules)
- PHP tests: `test_*.php` (PHP convention)
- Unit tests: `*.test.ts` (Jest convention)

### Source Code
- React components: `PascalCase.tsx`
- Utilities/hooks: `kebab-case.ts`
- PHP files: `kebab-case.php`

## Configuration Files

### Testing
- `playwright.config.ts` - Points to `tests/e2e/`
- `jest.config.js` - Points to `__tests__/`
- CI runs PHP tests from `tests/php/`

### Build & Development
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `package.json` - Dependencies and scripts

## Git Ignore Strategy

The `.gitignore` includes:
- **Build outputs**: `.next/`, `build/`, `coverage/`
- **Dependencies**: `node_modules/`, `websocket-server/node_modules/`
- **Runtime data**: `logs/`, `data/`, `temp_audio/`
- **Agent tools**: `.serena/`, `/warp/`, `/claude/`, `/agents/`
- **IDE files**: `.vscode/`, `.idea/`

## CI/CD Integration

### GitHub Actions (`.github/workflows/ci.yml`)
- Runs tests from organized directories
- PHP tests: `docker run ... php tests/php/test_*.php`
- E2E tests: `npx playwright test` (uses config)
- Integration tests: Scripts in `tests/integration/`

### Scripts (`scripts/`)
- `ci-php-schema-check.mjs` - API response validation
- `health-check.mjs` - Service health verification
- `security-smoke.mjs` - Security testing
- `fanout-smoke.mjs` - Distributed system testing

## Adding New Components

### New Documentation
1. Place in appropriate `docs/` subdirectory
2. Update this structure guide if adding new categories
3. Link from main README.md if user-facing

### New Tests
1. **E2E**: Add `*.spec.ts` to `tests/e2e/`
2. **Integration**: Add `test-*.mjs` to `tests/integration/`
3. **PHP Backend**: Add `test_*.php` to `tests/php/`
4. **Unit Tests**: Add `*.test.ts` to `__tests__/`

### New Features
1. Follow existing patterns in `app/`, `components/`, `lib/`
2. Add corresponding tests
3. Update documentation
4. Consider API documentation in `docs/api/`

## Migration Notes

This structure was implemented on 2025-01-10 with the following changes:
- Moved agent docs to `docs/agents/`
- Consolidated documentation in `docs/`
- Organized all tests under `tests/`
- Updated CI/CD to reference new paths
- Preserved `MVP/` and `critical_audit.md` for existing references

## Maintenance

### Regular Tasks
- Update this guide when adding new directory categories
- Review `.gitignore` when adding new tools or build outputs
- Update CI paths when restructuring test directories
- Keep documentation current with actual structure

### Best Practices
- Don't create new top-level directories without updating this guide
- Keep related files together (tests near source when possible)
- Use consistent naming conventions
- Document any deviations from this structure

---

For questions about this structure, refer to the development team or check the git history for the restructuring commit.
