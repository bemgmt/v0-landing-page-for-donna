# Railway Deployment Guide for DONNA WebSocket Server

This guide provides instructions for configuring and deploying the DONNA WebSocket server on Railway.

## 1. Environment Variables

The following environment variables must be set in your Railway project's "Variables" section.

### Connection & Security

-   **`MAX_CONNECTIONS_PER_IP`**: The maximum number of concurrent WebSocket connections allowed from a single IP address.
    -   **Recommended Value**: `10`
    -   **Description**: Helps prevent abuse and resource exhaustion. The default is 3, which may be too low for environments with users behind the same NAT.

-   **`ENABLE_WS_PROXY`**: A feature flag to enable or disable the WebSocket proxy service.
    -   **Required Value**: `true`
    -   **Description**: When `true`, the server will accept WebSocket connections. When `false`, it will return a 503 Service Unavailable error.

-   **`ALLOWED_ORIGINS`**: A comma-separated list of domains that are allowed to connect to the WebSocket server.
    -   **Production Value**: `https://donna-interactive-grid.vercel.app,https://vercel.app`
    -   **Description**: This is a critical security measure to prevent unauthorized websites from connecting to your WebSocket server. Ensure your Vercel production domain is included.

### Rate Limiting

-   **`RATE_LIMIT_MAX_REQUESTS`**: The maximum number of connection attempts allowed per IP address within the time window.
    -   **Recommended Value**: `100`

-   **`RATE_LIMIT_WINDOW_MS`**: The duration of the rate-limiting window in milliseconds.
    -   **Recommended Value**: `60000` (1 minute)

### Authentication

-   **`JWT_SECRET`**: A strong, secret key used to sign and verify JSON Web Tokens (JWTs) for authenticating clients.
    -   **Action**: Generate a secure, random string (e.g., using a password manager or `openssl rand -hex 32`).
    -   **IMPORTANT**: This is a sensitive secret and must be kept confidential.

### Third-Party Integrations

-   **`OPENAI_API_KEY`**: Your API key for the OpenAI service.
    -   **Action**: Copy your OpenAI API key and paste it here.
    -   **IMPORTANT**: This is a sensitive secret.

-   **`SENTRY_DSN`** (Optional): The DSN for your Sentry project to enable error tracking and monitoring.
    -   **Action**: If you use Sentry, provide your project's DSN.

## 2. Domain and Networking

Railway will automatically expose your service on a public domain (e.g., `my-service-production.up.railway.app`). No special networking configuration is usually required.

Ensure that your `ALLOWED_ORIGINS` variable correctly lists the domain of your frontend application.

## 3. Monitoring and Logs

You can monitor the health and activity of your WebSocket server through the Railway logs.

-   **Connection Events**: Look for `[SECURITY]` logs to monitor connection attempts, successes, and failures.
    -   `WS_CONNECTION_ESTABLISHED`: A client successfully connected.
    -   `WS_CONNECTION_CLOSED`: A client disconnected.
    -   `WS_CONNECTION_BLOCKED_*`: A connection was blocked due to invalid origin, rate limiting, or connection limits.
-   **Heartbeat**: The server will log `[HEARTBEAT]` messages periodically, showing current connection counts. This is useful for debugging connection leaks.
-   **Errors**: Application errors will be logged to the console and, if configured, sent to Sentry.

## 4. Troubleshooting Common Connection Issues

-   **"WebSocket is closed before the connection is established"**:
    1.  **Check `ALLOWED_ORIGINS`**: Ensure the frontend domain is correctly listed.
    2.  **Check Railway Logs**: Look for `WS_CONNECTION_BLOCKED` messages to identify the reason (e.g., `INVALID_ORIGIN`, `CONNECTION_LIMIT`).
    3.  **Verify `MAX_CONNECTIONS_PER_IP`**: If you see `CONNECTION_LIMIT` errors, consider if the limit of `10` is sufficient for your users.
    4.  **Check `ENABLE_WS_PROXY`**: Make sure it is set to `true`.

-   **Authentication Errors (`4001`, `4003`)**:
    1.  **`4001: Authentication timeout`**: The client did not send a valid authentication message in time.
    2.  **`4003: Authentication failed`**: The client sent an invalid JWT. Verify the `JWT_SECRET` matches between your auth server and the WebSocket server.

By following this guide, you can ensure your DONNA WebSocket server is configured securely and reliably on Railway.
