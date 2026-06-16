# Production Deployment Checklist

This checklist provides a step-by-step guide to ensure all components of the DONNA application are correctly configured for a production deployment.

---

## 1. Vercel Frontend (`donna-interactive-grid.vercel.app`)

### Environment Variables

Navigate to your project on Vercel > Settings > Environment Variables. Ensure the following are set for the **Production** environment:

-   **Clerk Authentication**
    -   `[x] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    -   `[x] CLERK_SECRET_KEY`
    -   `[x] CLERK_JWKS_URL`

-   **Supabase Database**
    -   `[x] SUPABASE_URL`
    -   `[x] SUPABASE_SERVICE_ROLE_KEY`
    -   `[x] NEXT_PUBLIC_SUPABASE_URL`
    -   `[x] NEXT_PUBLIC_SUPABASE_ANON_KEY`

-   **Gmail OAuth**
    -   `[x] GOOGLE_CLIENT_ID`
    -   `[x] GOOGLE_CLIENT_SECRET`
    -   `[x] GOOGLE_REDIRECT_URI` (should be `https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback`)

-   **Backend & WebSocket Configuration**
    -   `[x] NEXT_PUBLIC_API_BASE` (should be `https://bemdonna.com/donna`)
    -   `[x] NEXT_PUBLIC_WEBSOCKET_URL` (should be `wss://donna-interactive-production.up.railway.app/realtime`)
    -   `[x] NEXT_PUBLIC_USE_WS_PROXY` (should be `true`)
    -   `[x] NEXT_PUBLIC_ALLOWED_ORIGIN` (should be `https://donna-interactive-grid.vercel.app`)

-   **System & API Keys**
    -   `[x] OPENAI_API_KEY`
    -   `[x] API_SECRET`
    -   `[x] ENVIRONMENT` (should be `production`)

-   **Sentry (Optional)**
    -   `[ ] NEXT_PUBLIC_SENTRY_DSN`
    -   `[ ] SENTRY_DSN`

---

## 2. Railway WebSocket Server (`donna-interactive-production.up.railway.app`)

### Environment Variables

Navigate to your service on Railway > Variables.

-   `[x] MAX_CONNECTIONS_PER_IP` (Recommended: `10`)
-   `[x] ENABLE_WS_PROXY` (should be `true`)
-   `[x] ALLOWED_ORIGINS` (must include `https://donna-interactive-grid.vercel.app`)
-   `[x] RATE_LIMIT_MAX_REQUESTS` (Recommended: `100`)
-   `[x] RATE_LIMIT_WINDOW_MS` (Recommended: `60000`)
-   `[x] JWT_SECRET` (must be a strong, unique secret)
-   `[x] OPENAI_API_KEY`
-   `[ ] SENTRY_DSN` (Optional)

---

## 3. SiteGround PHP Backend (`bemdonna.com/donna`)

-   `[x]` Verify that the backend is accessible at `https://bemdonna.com/donna/health.php`.
-   `[x]` Check that the SiteGround server's CORS policy allows requests from `https://donna-interactive-grid.vercel.app`. This is likely configured in an `.htaccess` file or PHP headers.

---

## 4. Google Cloud Console (for Gmail OAuth)

-   `[x]` Go to **APIs & Services > Credentials**.
-   `[x]` Select your OAuth 2.0 Client ID.
-   `[x]` Under **Authorized redirect URIs**, confirm that `https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback` is listed.

---

## 5. Post-Deployment Testing

After deploying all services with the correct configuration, perform the following tests on the production URL (`https://donna-interactive-grid.vercel.app`):

-   **[ ] User Authentication**:
    -   [ ] Can you sign up for a new account?
    -   [ ] Can you log in and log out?

-   **[ ] ChatWidget Functionality**:
    -   [ ] Does the ChatWidget load correctly?
    -   [ ] Open browser developer tools. Check the console for any WebSocket connection errors.
    -   [ ] Send a message. Do you get a response from the AI?
    -   [ ] Check the Railway logs to confirm a WebSocket connection was established.

-   **[ ] Gmail Integration**:
    -   [ ] Go to the email marketing or settings page.
    -   [ ] Click the "Connect Gmail" button.
    -   [ ] Are you correctly redirected to the Google OAuth consent screen?
    -   [ ] After granting permission, are you redirected back to the app with a success message?
    -   [ ] Try sending a test email through the application.

---

## 6. Monitoring

-   **[ ] Vercel**: Monitor the project dashboard for any build errors or function invocations.
-   **[ ] Railway**: Monitor the WebSocket server logs for connection errors or application crashes.
-   **[ ] Sentry**: If configured, check your Sentry dashboard for any reported frontend or backend errors.
