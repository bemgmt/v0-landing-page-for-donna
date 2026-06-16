# Information Required to Complete the DONNA MVP

Based on the `PRD-MVP.md`, I will need the following credentials and configuration details to proceed with the implementation. Please provide these values.

## 1. Clerk Authentication

Clerk is used for user authentication. I need the following keys from your Clerk dashboard:

-   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=REPLACE_ME`
-   `CLERK_SECRET_KEY`: `CLERK_SECRET_KEY=REPLACE_ME`
-   `CLERK_JWKS_URL`: (e.g., `https://<your-clerk-domain>/.well-known/jwks.json`)

## 2. Supabase Database

Supabase will be used for the database. I need the following from your Supabase project settings:

-   `SUPABASE_URL` : (https://icifblkpinagnyxdbevr.supabase.co)
-   `SUPABASE_ANON_KEY`: `SUPABASE_ANON_KEY=REPLACE_ME`
-   `SUPABASE_SERVICE_ROLE_KEY`: `SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME`

I will also need you to **run the SQL schema** provided in the PRD in your Supabase SQL editor to create the necessary tables. Please let me know once that is done.

## 3. Google Cloud / Gmail API

For Gmail integration, I need credentials from your Google Cloud project.

-   `GOOGLE_CLIENT_ID`: `GOOGLE_CLIENT_ID=REPLACE_ME`
-   `GOOGLE_CLIENT_SECRET`: `GOOGLE_CLIENT_SECRET=REPLACE_ME`

Also, please confirm the **Redirect URI**. The PRD suggests `http://localhost:3000/api/gmail/oauth/callback` for local development. Is this correct, or should I use a production URL?

-   `GOOGLE_REDIRECT_URI`: GOOGLE_REDIRECT_URI=https://donna-interactive-grid.vercel.app

## 4. OpenAI API

The project requires an OpenAI API key for text chat and real-time voice.

-   `OPENAI_API_KEY`: `OPENAI_API_KEY=REPLACE_ME`

## 5. Allowed Origins (CORS)

For security, the API will restrict requests to specific domains. The PRD suggests `http://localhost:3000` and a production domain. Please provide the full list of domains to allow.

-   `ALLOWED_ORIGINS`: (e.g., `http://localhost:3000,https://donna-interactive-grid.vercel.app`)

## 6. (Optional) ElevenLabs API

The PRD mentions ElevenLabs as an optional service for batch voice generation. If you plan to use this, please provide the API key.

-   `ELEVENLABS_API_KEY`: `ELEVENLABS_API_KEY=REPLACE_ME`

## 7. (Optional) SMTP Fallback

A fallback SMTP server is mentioned for sending emails if the Gmail API is not used. If you want to configure this, please provide the following:

-   `EMAIL_SMTP_HOST`:
-   `EMAIL_SMTP_PORT`:
-   `EMAIL_SMTP_USER`:
-   `EMAIL_SMTP_PASS`:
-   `EMAIL_SMTP_SECURE`: (e.g., `tls` or `ssl`)
-   `EMAIL_FROM`:
-   `EMAIL_FROM_NAME`:

Sentry Configuration
SENTRY_ORG=birds-eye-management-services
SENTRY_ORG_ID=4509979898216448

Once you provide these details, I can start configuring the environment and implementing the features outlined in the PRD.
