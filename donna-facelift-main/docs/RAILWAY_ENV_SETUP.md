# Railway Environment Variables Setup Guide

This guide provides a comprehensive overview of the environment variables required for the DONNA WebSocket server running on Railway.

## 1. Accessing Environment Variables

In your Railway project, navigate to your WebSocket service, then click on the **Variables** tab.

## 2. Required Environment Variables

### Connection & Security

-   **`MAX_CONNECTIONS_PER_IP`**
    -   **Value**: `10`
    -   **Description**: Sets the maximum number of concurrent WebSocket connections allowed from a single IP address. This helps prevent abuse.

-   **`ENABLE_WS_PROXY`**
    -   **Value**: `true`
    -   **Description**: Enables the WebSocket proxy service. Must be `true` for the server to accept connections.

-   **`ALLOWED_ORIGINS`**
    -   **Value**: `https://donna-interactive-grid.vercel.app,https://vercel.app`
    -   **Description**: A comma-separated list of domains allowed to connect. This is a critical security measure. It **must** include your Vercel frontend's domain.

### Rate Limiting

-   **`RATE_LIMIT_MAX_REQUESTS`**
    -   **Value**: `100`
    -   **Description**: The number of connection attempts allowed per IP per minute.

-   **`RATE_LIMIT_WINDOW_MS`**
    -   **Value**: `60000`
    -   **Description**: The time window for rate limiting in milliseconds (60,000ms = 1 minute).

### Authentication

-   **`JWT_SECRET`**
    -   **Action**: Generate a secure, random string (e.g., `openssl rand -hex 32`).
    -   **Description**: A secret key for signing and verifying JSON Web Tokens (JWTs). This is used to authenticate clients connecting to the WebSocket server. **This is a sensitive value and must be kept secret.**

### Third-Party Services

-   **`OPENAI_API_KEY`**
    -   **Action**: Paste your OpenAI API key.
    -   **Description**: Required for the server to connect to OpenAI's real-time transcription and language model services. **This is a sensitive value.**

-   **`SENTRY_DSN`** (Optional)
    -   **Action**: If you use Sentry for error tracking, paste your project's DSN here.
    -   **Description**: Enables error and performance monitoring for the WebSocket server.

## 3. Verification

After setting these variables, Railway will automatically redeploy your service. To verify that the configuration is working correctly:

1.  **Check the Logs**: Open the **Logs** tab for your service in Railway.
2.  **Look for Startup Messages**: You should see messages indicating that the server has started and which security features are enabled.
3.  **Test a Connection**: Open your Vercel frontend and try to use the ChatWidget. You should see `[SECURITY] WS_CONNECTION_ESTABLISHED` messages in the Railway logs, indicating a successful connection from your Vercel app. If you see `WS_CONNECTION_BLOCKED_INVALID_ORIGIN`, double-check your `ALLOWED_ORIGINS` variable.

## 4. Monitoring the WebSocket Service

We provide a Node.js monitor script to continuously check health, ingest logs, categorize errors, and alert.

Script: `scripts/monitor-railway-websocket.mjs`

Environment variables for the monitor:

- `NEXT_PUBLIC_WEBSOCKET_URL` (required): e.g., `wss://<your-service>.up.railway.app/realtime`
- `CHECK_INTERVAL_MS` (optional): Interval between checks in ms (default `60000`).
- `NEXT_PUBLIC_ALLOWED_ORIGIN` (optional): Origin header to send on WS connect; should be your Vercel URL.
- `ALLOWED_ORIGINS` (optional): The server-side list; shown in startup summary for reference.
- `RAILWAY_TOKEN` (optional): Required to pull recent logs via Railway GraphQL.
- `RAILWAY_PROJECT_ID` (optional): Your Railway project id.
- `RAILWAY_SERVICE_ID` (optional): The WebSocket service id within the project.
- `SLACK_WEBHOOK_URL` (optional): Slack Incoming Webhook URL to receive alerts when thresholds are breached.

Run locally:

```bash
node scripts/monitor-railway-websocket.mjs
```

What it does:

- Performs HTTP health check at `/health` and attempts a WS connection with the chosen `Origin` header
- Ingests recent Railway logs when configured and parses common issues (timeouts, invalid origin, rate limit)
- Computes rolling 15/60-minute error rates and prints them in the dashboard
- Sends Slack alerts when failures cross thresholds (first 3 failures, >=5 in 15m, >=10 in 60m)
 - Sends Slack alerts when failures cross thresholds (first 3 failures, >=5 in 15m, >=10 in 60m)

### How logs are used

The monitor polls Railway GraphQL logs for your WS service and classifies common issues:

- Invalid origin blocks (e.g., `WS_CONNECTION_BLOCKED_INVALID_ORIGIN`)
- Timeouts / connection failures
- Rate limiting events
- TLS/SSL verification issues

It maintains rolling 15-minute and 60-minute windows of categorized log errors and prints a compact summary each interval. When any category exceeds thresholds (>=5 in 15m or >=10 in 60m), it can send a Slack alert to help you react quickly.

Required env vars for log ingestion and alerting:

- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_SERVICE_ID`
- `SLACK_WEBHOOK_URL` (for alerts)
