# Production Deployment Validation Checklist

This checklist is for validating the complete production deployment of the DONNA application, ensuring all services and integrations are functioning correctly.

---

## 1. Environment Configuration Validation

-   **[ ] Vercel**:
    -   [ ] All variables from `vercel-env-vars.txt` are present and correct in the Vercel project settings for the Production environment.
    -   [ ] `NEXT_PUBLIC_WEBSOCKET_URL` points to the production Railway URL.
    -   [ ] `NEXT_PUBLIC_API_BASE` points to the production SiteGround URL.
    -   [ ] `GOOGLE_REDIRECT_URI` is the correct production callback URL.

-   **[ ] Railway**:
    -   [ ] All variables from `docs/RAILWAY_ENV_SETUP.md` are set.
    -   [ ] `ALLOWED_ORIGINS` includes the Vercel production domain.
    -   [ ] `JWT_SECRET` and `OPENAI_API_KEY` are set to strong, valid values.

-   **[ ] SiteGround**:
    -   [ ] The `.env` file exists outside the `public_html` directory.
    -   [ ] `ALLOWED_ORIGINS` includes the Vercel production domain.
    -   [ ] `GMAIL_REFRESH_TOKEN` is a valid, recently generated token.
    -   [ ] `OPENAI_API_KEY` and Supabase variables are correctly set.

---

## 2. Service Connectivity & Health Checks

-   **[ ] Vercel Frontend**: The site at `https://donna-interactive-grid.vercel.app` loads without errors.
-   **[ ] Railway WebSocket**: The health check endpoint at `https://donna-interactive-production.up.railway.app/health` returns `{"status":"ok"}`.
-   **[ ] SiteGround Backend**: The health check endpoint at `https://bemdonna.com/donna/api/health.php` returns `{"status":"ok"}`.
-   **[ ] Run Automated Health Check**: Execute the `production-health-check.mjs` script and ensure all checks pass.

---

## 3. Authentication Flow Validation

-   **[ ] Clerk User Auth**:
    -   [ ] Can successfully sign up for a new account.
    -   [ ] Can successfully log in and log out.

-   **[ ] Gmail OAuth**:
    -   [ ] Run the `test-gmail-oauth-e2e.mjs` Playwright test to automatically validate the full flow.
    -   [ ] Manually connect a Gmail account and verify a success message is shown.
    -   [ ] Verify the app does not ask for consent again on subsequent connections.

---

## 4. Core Feature Functionality

-   **[ ] ChatBot Widget**:
    -   [ ] The widget loads on the frontend.
    -   [ ] A WebSocket connection is established (check browser dev tools and Railway logs).
    -   [ ] Sending a message results in a response from the AI.
    -   [ ] Test the reconnection logic by restarting the Railway service.

-   **[ ] Marketing Email System**:
    -   [ ] Run the `test-marketing-email-system.mjs` script to validate API functionality.
    -   [ ] Manually navigate the email interface.
    -   [ ] Can successfully read the inbox.
    -   [ ] Can successfully send a test email.
    -   [ ] Can successfully generate an AI draft reply for an email.

---

## 5. Security & Monitoring

-   **[ ] CORS Policy**:
    -   [ ] Attempt a request from an unauthorized origin (e.g., using a local HTML file with `fetch`) and verify it is blocked with a CORS error.
-   **[ ] Monitoring**:
    -   [ ] Vercel, Railway, and Sentry dashboards are accessible and showing recent data.
    -   [ ] Run the `monitor-railway-websocket.mjs` script and observe health statistics.

---

## 6. Documentation

-   **[ ] Final Review**:
    -   [ ] All deployment and setup documentation (`SITEGROUND_BACKEND_SETUP.md`, `RAILWAY_ENV_SETUP.md`, etc.) is accurate and reflects the current state of the deployment.
