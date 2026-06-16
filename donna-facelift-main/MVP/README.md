# MVP Directory Overview

This folder contains the cross-stream planning artifacts, product requirements (PRDs), architecture decisions (ADRs), and checkpoint workstream plans.

Key files
- workstreams.md — Workstreams overview, phases, gates, and ownership
- workstreams_checkpoint2.md — Checkpoint 2 plan
- workstreams_checkpoint3.md — Checkpoint 3 (Phase 3 finalization) plan
- adrs/README.md — ADR index with current status per phase (as of 2025-09-10)
- prds/*.md — PRDs per phase, now annotated with Status lines

Recent additions/updates
- workstreams_checkpoint3.md (new)
- adrs/README.md — added Status summary
- prds/* — added Status headers (Completed/Partial/Deferred)
- AUDIT_OVERVIEW.md — high-level audit impact and readiness assessment
- docs/AUDIT_EXECUTIVE_SUMMARY.md — expanded with Workstream Audit + ADR status summary
- docs/OBSERVABILITY.md — uptime workflow guidance
- .github/workflows/uptime.yml — scheduled health check

How to use
- Start with workstreams_checkpoint3.md to understand the remaining tasks for the next release
- Use adrs/README.md for a phase-by-phase status
- Refer to prds/ for what each phase was intended to deliver and its completion status
