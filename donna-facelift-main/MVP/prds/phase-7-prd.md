# Product Requirements Document (PRD)

> Status (2025-09-10): Partial (PHP headers done; Next headers & SMTP deferred)

## Overview
- Phase: 7 — Security Headers & Platform Hardening
- Goal: Add defense-in-depth with security headers and secure email transport.

## Objectives
- Add security headers (HSTS, CSP, X-Frame-Options, etc.) to Next
- Review/secure SMTP path (prefer PHPMailer with TLS)
- Add security headers for PHP endpoints as applicable

## Scope
- In-scope (linked ADRs):
  - [Next security headers](../adrs/phase-7-task-01-security-headers.md)
  - [SMTP path hardening](../adrs/phase-7-task-02-smtp-path.md)
  - [PHP security headers](../adrs/phase-7-task-03-php-security-headers.md)
- Out-of-scope: Comprehensive CSP hardening beyond initial safe defaults

## Success Metrics
- Headers present on routes; email path verified secure

## Deliverables
- Header config; email configuration updates

## Acceptance Criteria
- Matches Phase 7 gate in ../phased_plan.md

## Dependencies
- Phase 6

## Risks & Mitigations
- Risk: Overly strict CSP breaks app → Mitigation: deploy report-only CSP first

## Rollback
- Revert header changes; disable email sending or revert to previous provider

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
