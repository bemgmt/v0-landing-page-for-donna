# ADR Index

This index lists all ADRs grouped by workstream and phase. See MVP/workstreams.md for stream ownership and gates.

Constraints (global)
- Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks/intercepts).

WS1 — Security & Access Control
- Phase 1
  - phase-1-task-01-remove-secret-exposure.md
  - phase-1-task-02-tighten-cors.md
  - phase-1-task-03-ws-proxy-auth.md
  - phase-1-task-06-token-hardening.md
  - phase-1-task-07-env-validation.md
  - phase-1-task-08-input-validation.md
  - phase-1-task-10-api-rate-limiting.md
- Phase 7
  - phase-7-task-01-security-headers.md
  - phase-7-task-03-php-security-headers.md
  - phase-7-task-02-smtp-path.md

WS2 — Realtime & Voice Architecture
- Phase 3
  - phase-3-task-01-protocol-standard.md
  - phase-3-task-02-dev-rewrites.md
  - phase-3-task-03-ui-fix-receptionist.md
  - phase-3-task-04-single-realtime-path.md
  - phase-3-task-05-realtime-config.md
  - phase-3-task-06-reconnect-backoff.md
  - phase-3-task-07-remove-missing-client.md
  - phase-3-task-08-clerk-decision.md

WS3 — Build, CI & Quality Gates
- Phase 2
  - phase-2-task-01-ts-baseline.md
  - phase-2-task-02-ci-pipeline.md
  - phase-2-task-04-pin-engines.md
  - phase-2-task-05-next-health.md (optional)
- Phase 6
  - phase-6-task-01-unit-integration.md
  - phase-6-task-02-e2e-playwright.md
  - phase-6-task-03-sec-perf-checks.md
- Phase 2 or 8
  - phase-2-task-03-sentry-decision.md

WS4 — Data Management, Logging & Error Handling
- Phase 4
  - phase-4-task-01-ignore-retention.md
  - phase-4-task-02-minimize-pii.md
  - phase-4-task-05-standardize-error-responses.md
  - phase-4-task-03-db-plan.md
  - phase-4-task-04-minimal-db-pilot.md
- Phase 5
  - phase-5-task-02-file-io-optim.md
  - phase-5-task-01-response-cache.md

WS5 — Repo Hygiene, Documentation & Observability (Owner: WARP)
- Phase 1
  - phase-1-task-05-repo-hygiene.md
- Phase 8
  - phase-8-task-01-update-docs.md
  - phase-8-task-02-monitoring-alerting.md
- Phase 2 or 8
  - phase-2-task-03-sentry-decision.md (coordination with WS3/WS5)

---

## Status (2025-09-10)
- Phase 0
  - phase-0-task-01-branching.md — Deferred
  - phase-0-task-02-secrets-hygiene.md — Partial
  - phase-0-task-03-access-controls.md — Partial
- Phase 1 (Security)
  - phase-1-task-01-remove-secret-exposure.md — Completed
  - phase-1-task-02-tighten-cors.md — Completed
  - phase-1-task-03-ws-proxy-auth.md — Completed
  - phase-1-task-04-file-perms.md — Completed
  - phase-1-task-05-repo-hygiene.md — Completed
  - phase-1-task-06-token-hardening.md — Completed
  - phase-1-task-07-env-validation.md — Completed
  - phase-1-task-08-input-validation.md — Partial
  - phase-1-task-09-root-deps.md — Completed
  - phase-1-task-10-api-rate-limiting.md — Partial
- Phase 2 (Build/CI)
  - phase-2-task-01-ts-baseline.md — Completed
  - phase-2-task-02-ci-pipeline.md — Completed
  - phase-2-task-03-sentry-decision.md — Completed
  - phase-2-task-04-pin-engines.md — Completed
  - phase-2-task-05-next-health.md — Completed
- Phase 3 (Realtime)
  - phase-3-task-01-protocol-standard.md — Completed
  - phase-3-task-02-dev-rewrites.md — Completed
  - phase-3-task-03-ui-fix-receptionist.md — Completed
  - phase-3-task-04-single-realtime-path.md — Completed
  - phase-3-task-05-realtime-config.md — Completed
  - phase-3-task-06-reconnect-backoff.md — Completed
  - phase-3-task-07-remove-missing-client.md — Completed
  - phase-3-task-08-clerk-decision.md — Completed
- Phase 4 (Data/Privacy)
  - phase-4-task-01-ignore-retention.md — Completed
  - phase-4-task-02-minimize-pii.md — Partial
  - phase-4-task-03-db-plan.md — Partial
  - phase-4-task-04-minimal-db-pilot.md — Partial
  - phase-4-task-05-standardize-error-responses.md — Partial
- Phase 5 (Performance)
  - phase-5-task-01-response-cache.md — Partial
  - phase-5-task-02-file-io-optim.md — Partial
- Phase 6 (Testing)
  - phase-6-task-01-unit-integration.md — Partial
  - phase-6-task-02-e2e-playwright.md — Partial
  - phase-6-task-03-sec-perf-checks.md — Partial
- Phase 7 (Headers/SMTP)
  - phase-7-task-01-security-headers.md — Partial
  - phase-7-task-02-smtp-path.md — Deferred
  - phase-7-task-03-php-security-headers.md — Completed
- Phase 8 (Docs/Monitoring)
  - phase-8-task-01-update-docs.md — Completed
  - phase-8-task-02-monitoring-alerting.md — Completed

