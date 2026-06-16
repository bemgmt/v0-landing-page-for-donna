# Test Gmail OAuth E2E Security Notes

This repository includes a Playwright-based E2E script at `scripts/test-gmail-oauth-e2e.mjs` to validate the OAuth flow.

Recommendations:

- Use a dedicated Google test account with limited scope and quotas.
- Prefer App Passwords or pre-seeded session cookies to avoid storing raw credentials in CI.
- Configure the following environment variables:
  - `CONFIRM_PROD_TESTS=1` (required to run tests against production)
  - `GMAIL_TEST_USER` and `GMAIL_TEST_PASSWORD` (or use cookies approach)
  - `INTEGRATIONS_PATH` and `GMAIL_CONNECT_SELECTOR` if your UI differs from defaults

Risks:

- Raw credentials in CI can trigger reCAPTCHA/MFA and be rejected; treat them as sensitive and rotate frequently.
- Tests may consume API quotas; schedule sparingly and use controlled recipients.

Operational Tip:

- If MFA or reCAPTCHA block automated logins, run locally with an authenticated browser context or provide cookies.
# Documentation Index

This directory contains all project documentation organized by category.

## 🏗️ Repository & Development

- **[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)** - Repository organization and development conventions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[ENVIRONMENT_CONFIG.md](ENVIRONMENT_CONFIG.md)** - Environment setup and configuration guide

## 🔒 Security & Operations

- **[SECURITY_HARDENING.md](SECURITY_HARDENING.md)** - Security implementation details
- **[OPS_RUNBOOK.md](OPS_RUNBOOK.md)** - Operations, maintenance, and data retention
- **[OBSERVABILITY.md](OBSERVABILITY.md)** - Monitoring, logging, and uptime checks

## 🎯 Specialized Systems

- **[VOICE_SYSTEM_SETUP.md](VOICE_SYSTEM_SETUP.md)** - Voice system configuration
- **[REMOTE_PHP_SETUP.md](REMOTE_PHP_SETUP.md)** - Server-to-server PHP fanout
- **[PROD_PREP.md](PROD_PREP.md)** - Production deployment preparation

## 🤖 AI Agents

- **[agents/AGENTS.md](agents/AGENTS.md)** - General AI agent guidelines
- **[agents/CLAUDE.md](agents/CLAUDE.md)** - Claude-specific documentation
- **[agents/WARP.md](agents/WARP.md)** - WARP agent documentation

## 📡 API & Integration

- **[api/VALIDATION_SUMMARY.md](api/VALIDATION_SUMMARY.md)** - API validation and testing summary
- **[ENV_CONFIG_EXAMPLES.md](ENV_CONFIG_EXAMPLES.md)** - Environment configuration templates

## 📊 Reports & Analysis

- **[AUDIT_EXECUTIVE_SUMMARY.md](AUDIT_EXECUTIVE_SUMMARY.md)** - High-level audit and delivered work summary

## 🗄️ Database & Data

- **[database-migration-plan.md](database-migration-plan.md)** - Database migration strategy
- **[db-pilot-setup.md](db-pilot-setup.md)** - Database pilot configuration
- **[schema.sql](schema.sql)** - Database schema definitions

---

## Quick Navigation

**New Developer?** Start with [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md) to understand the codebase organization.

**Setting up Environment?** Check [ENVIRONMENT_CONFIG.md](ENVIRONMENT_CONFIG.md) and [ENV_CONFIG_EXAMPLES.md](ENV_CONFIG_EXAMPLES.md).

**Deploying to Production?** Review [PROD_PREP.md](PROD_PREP.md) and [SECURITY_HARDENING.md](SECURITY_HARDENING.md).

**Working with AI Agents?** See the [agents/](agents/) directory for specific guidelines.

**Need Architecture Overview?** Start with [ARCHITECTURE.md](ARCHITECTURE.md).

---

*For the main project README, see [../README.md](../README.md)*
