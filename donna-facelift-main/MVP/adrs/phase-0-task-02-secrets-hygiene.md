# ADR: Secrets hygiene and .env audit

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 0 — Preparation and Safety Nets
- Ensure no secrets are committed; verify `.env*` files are ignored; confirm that any `NEXT_PUBLIC_*` are non-sensitive.

## Decision
- Use a secret scanning tool (e.g., `gitleaks` or `trufflehog`) locally and in CI
- Confirm `.env*` patterns in .gitignore (already present) and verify no exceptions
- Audit environment variable usage to ensure `NEXT_PUBLIC_*` never carry secrets
- IMPORTANT: Do not rotate or delete secrets as part of this ADR; scanning and allowlisting only (per constraints)

## Implementation Steps
1) Run secret scan across history for new changes; add CI step for future PRs
2) Verify .gitignore contains `.env*`; add missing patterns if needed
3) Search code for `NEXT_PUBLIC_` usages and confirm no sensitive values are required

## Alternatives Considered
- Manual review only: insufficient coverage

## Consequences
- Positive: Reduces risk of key exposure
- Trade-offs: Occasional false positives; maintain allowlist

## Acceptance Criteria
- Secret scan shows no new secrets in PRs; `NEXT_PUBLIC_*` hold only public info

## Test Plan (Smoke)
- Run scanner locally; introduce a benign test token and verify detection, then allowlist (documented)

## Rollback Plan
- Remove scanning step (not recommended)

## Owners
- Security Eng + contributors

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
