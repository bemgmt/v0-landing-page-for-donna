# ADR: Review/secure SMTP path

## Status
- Deferred (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 7 — Security Headers & Platform Hardening
- Raw SMTP helper lacks TLS/cert verification; prefer PHPMailer when available.

## Decision
- Prefer PHPMailer (TLS/STARTTLS); if raw SMTP remains, add TLS and certificate verification and fail closed

## Implementation Steps
1) Ensure PHPMailer autoload works; configure secure options
2) In raw SMTP path, use TLS where supported; verify certs; handle errors

## Alternatives Considered
- Keep raw only: higher risk

## Consequences
- Positive: Safer outbound email
- Trade-offs: More configuration

## Acceptance Criteria
- Email send uses secure transport; errors handled; fallbacks tested

## Test Plan (Smoke)
- Send test email to sandbox; verify no plain-text auth

## Rollback Plan
- Disable emailing if not required

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
