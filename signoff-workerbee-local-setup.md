# Signoff + WorkerBee local setup

Set up the Signoff + WorkerBee local agent harness on this computer.

Your goal is a safe local pairing: Signoff owns the user-facing specification, real-product QA evidence, and verdicts. WorkerBee owns the project-scoped local infrastructure loop for containers, services, manifests, logs, ingress, probes, security review, cleanup, and export. WorkerBee health is supporting evidence, never a Signoff verdict.

## Safety and scope

- Detect the operating system, shell, CPU architecture, installed coding harnesses, and existing configuration before changing anything.
- Support macOS, Linux, and Windows through WSL2. On Windows, install and run WorkerBee inside WSL2 and use Docker Desktop with WSL integration unless the user already has a working compatible runtime.
- Keep WorkerBee MCP bound to loopback at http://127.0.0.1:8765/mcp. Do not expose it to a LAN or the public internet.
- Preserve existing MCP servers, agent instructions, secrets, and unrelated configuration.
- Never print, invent, or commit the Signoff API key. Ask the user for a key from Signoff Settings only when no usable key is already available.
- Prefer current official documentation and the latest stable WorkerBee release. Do not replace a working container runtime merely to standardize the machine.

## 1. Prepare the local runtime

1. Confirm Python 3.11 or newer.
2. Confirm a supported runtime is actually running with `docker version` or `podman info`.
3. On macOS, prefer Docker Desktop for the general runbook. A working Colima-based Docker context is also acceptable.
4. On WSL2, confirm the distro can execute the Docker CLI and reach the Docker daemon before continuing.
5. On Linux, prefer rootless Podman or a correctly configured Docker daemon.

## 2. Install and start WorkerBee

Use the official release installer from https://github.com/the-cm-collective/k1s-workerbee:

```sh
curl -fsSL https://github.com/the-cm-collective/k1s-workerbee/releases/latest/download/install-workerbee.sh | sh
export PATH="$HOME/.local/bin:$PATH"
workerbee doctor
workerbee mcp start
workerbee mcp status
```

On macOS, pass `PYTHON=python3.11` to the installer when the default Python is older. If policy forbids piping a download to a shell, download the release installer and wheelhouse, inspect them, and use the documented offline install path instead.

Verify that the MCP endpoint answers on http://127.0.0.1:8765/mcp and that the dashboard health check succeeds at `https://dashboard.workerbee.localhost:19443/healthz`. Install the local CA only when browser or HTTPS ingress testing requires it, using `workerbee trust install --target system`.

## 3. Register both MCP servers globally

Register WorkerBee as a remote Streamable HTTP MCP server named `workerbee` with URL http://127.0.0.1:8765/mcp.

Register Signoff as a remote Streamable HTTP MCP server named `signoff` with URL `https://sign-off.cloud/mcp` and header `X-Api-Key: <SIGNOFF_API_KEY>`.

Use each harness's global configuration and preserve its existing servers:

- Codex: use `codex mcp add workerbee --url http://127.0.0.1:8765/mcp`. Configure Signoff with the same endpoint and header shown in Signoff Settings.
- Kimi Code: use `kimi mcp add --transport http workerbee http://127.0.0.1:8765/mcp` when that command exists. For older Kimi Code releases, merge a `workerbee` URL entry into the existing global `mcp.json` under `~/.kimi-code`. Newer Kimi installations normally use `~/.kimi/mcp.json`. Detect the active home instead of creating both.
- OpenCode: use `opencode mcp add workerbee --url http://127.0.0.1:8765/mcp` and `opencode mcp add signoff --url https://sign-off.cloud/mcp --header X-Api-Key=<SIGNOFF_API_KEY>`. Its global configuration normally lives at `~/.config/opencode/opencode.json`.
- Other harnesses: use their native global remote-MCP configuration. Use a local proxy only when the harness cannot connect to Streamable HTTP directly.

Restrict credential-bearing files to the current user. Prefer the harness's environment or secret-file substitution when supported.

## 4. Add the project instruction bridge

Run `workerbee agent instructions` and add its current short trigger to the project's existing agent instruction file without replacing project-specific guidance.

Also preserve this division of responsibility:

```markdown
For new or changed user-facing behavior, bug fixes, releases, or QA requests, call Signoff whoami first and follow its live contract. Signoff defines the expected human-observable behavior and records evidence-backed verdicts.

When the task needs a runnable local environment, containers, services, manifests, ingress, runtime logs, infrastructure diagnostics, security review, or deployment artifacts, call WorkerBee workerbee_v1_session_start with the repository's absolute path and the task goal. Use the returned project identity for later WorkerBee calls.

Use WorkerBee to create and observe the local environment. Use the real browser, app, device, or public feature to perform Signoff checks. WorkerBee health, deployment success, logs, and probes are supporting evidence, not Signoff verdicts. Never approve a Signoff check until its user-facing behavior has actually been exercised.
```

## 5. Make startup durable

Confirm the container runtime starts after login or reboot. Then configure WorkerBee MCP to start after that runtime is ready, using the operating system's ordinary user-level service mechanism.

- macOS: use the runtime's login setting and a user LaunchAgent for `workerbee mcp start` or a small health-aware wrapper.
- Linux with systemd: use a user service with restart-on-failure and an ordering or retry strategy for Docker or Podman readiness.
- WSL2: when systemd is enabled, use the same user-service pattern. Otherwise use Windows Task Scheduler to invoke the WSL distro and start WorkerBee after Docker Desktop is available.

Do not create a tight restart loop. After configuring startup, test one stop/start cycle. Explain that coding clients snapshot available MCP tools at startup and may need a full restart if they opened while WorkerBee was unavailable.

## 6. Run the cheap lights-on test

1. Start a fresh session in every configured harness.
2. Confirm it can see Signoff `whoami` and WorkerBee `workerbee_v1_session_start`.
3. Call Signoff `whoami` and follow the returned live contract.
4. Call WorkerBee `workerbee_v1_session_start` with one real repository path and a lights-on goal.
5. Confirm the returned WorkerBee project is scoped to that repository and the global dashboard is healthy.
6. Do not deploy a sample workload unless the user asks. This test proves discovery, authentication, project scoping, and local runtime health without spending a large model or infrastructure budget.

Finish with a redacted report listing the files changed, MCP status in each harness, startup behavior, verification results, and any manual step still required.

## Source and ownership

WorkerBee is maintained at https://github.com/the-cm-collective/k1s-workerbee and distributed under the Apache License 2.0.
Signoff provides this handoff as a convenience for people who want local infrastructure execution paired with evidence-backed product QA.
