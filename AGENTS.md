For any new or changed user-facing behavior, bug fix, product creation, release, or QA request, use the signoff-qa-planning skill and the Signoff MCP. Call whoami first and follow the live contract. [signoff-setup f849fadf]

<!-- workerbee-agent-instructions:v1 start -->
## WorkerBee

When a task involves containers, services, manifests, ingress, databases,
queues, security review, or integration behavior, call WorkerBee MCP
`workerbee_v1_session_start` with the absolute repo cwd and task goal. Use the
returned `project` for every WorkerBee tool call.
<!-- workerbee-agent-instructions:v1 end -->

For new or changed user-facing behavior, bug fixes, releases, or QA requests, call Signoff `whoami` first and follow its live contract. Signoff defines the expected human-observable behavior and records evidence-backed verdicts.

When the task needs a runnable local environment, containers, services, manifests, ingress, runtime logs, infrastructure diagnostics, security review, or deployment artifacts, call WorkerBee `workerbee_v1_session_start` with the repository's absolute path and the task goal. Use the returned project identity for later WorkerBee calls.

Use WorkerBee to create and observe the local environment. Use the real browser, app, device, or public feature to perform Signoff checks. WorkerBee health, deployment success, logs, and probes are supporting evidence, not Signoff verdicts. Never approve a Signoff check until its user-facing behavior has actually been exercised.