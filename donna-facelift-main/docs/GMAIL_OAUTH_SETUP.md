# Gmail OAuth 2.0 Setup Guide

This guide provides step-by-step instructions for setting up Google OAuth 2.0 to allow your application to access Gmail APIs on behalf of users.

## 1. Google Cloud Console Configuration

### 1.1. Create or Select a Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.

### 1.2. Enable the Gmail API

1.  In the navigation menu, go to **APIs & Services > Library**.
2.  Search for "Gmail API" and click on it.
3.  Click the **Enable** button.

### 1.3. Configure the OAuth Consent Screen

1.  Go to **APIs & Services > OAuth consent screen**.
2.  Choose the **User Type**. For most applications, **External** is appropriate. Click **Create**.
3.  Fill in the required application details:
    *   **App name**: The name of your application.
    *   **User support email**: Your support email address.
    *   **Developer contact information**: Your email address.
4.  Click **Save and Continue**.
5.  On the **Scopes** page, you can leave it blank for now. Click **Save and Continue**.
6.  On the **Test users** page, add any Google accounts you will use for testing before your app is published.
7.  Click **Save and Continue** and then **Back to Dashboard**.
8.  Click **Publish App** and confirm to make it available to any user with a Google Account. You may need to complete other verification steps depending on your app's requirements.

### 1.4. Create OAuth 2.0 Client Credentials

1.  Go to **APIs & Services > Credentials**.
2.  Click **+ Create Credentials** and select **OAuth client ID**.
3.  For **Application type**, select **Web application**.
4.  Give it a name (e.g., "DONNA Web App").
5.  Under **Authorized redirect URIs**, click **+ Add URI** and add the following URI:
    *   `https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback`
6.  For local development, you should also add a localhost URI. The application is configured to use `http://localhost:3000/api/gmail/oauth/callback`. Add this URI as well:
    *   `http://localhost:3000/api/gmail/oauth/callback`
7.  Click **Create**.
8.  A dialog will appear with your **Client ID** and **Client Secret**. Copy these values. You will need them for your environment variables.

## 2. Vercel Environment Variables

The following environment variables must be set in your Vercel project.

-   **`GOOGLE_CLIENT_ID`**: The Client ID you obtained from the Google Cloud Console.
-   **`GOOGLE_CLIENT_SECRET`**: The Client Secret you obtained from the Google Cloud Console.
-   **`GOOGLE_REDIRECT_URI`**: The redirect URI for your production deployment. This **must exactly match** one of the URIs you added in the Google Cloud Console.
    -   **Value**: `https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback`

## 3. Troubleshooting Common Issues

-   **`redirect_uri_mismatch`**: This is the most common error. It means the `GOOGLE_REDIRECT_URI` in your environment variables does not exactly match any of the "Authorized redirect URIs" in your Google Cloud Console credentials.
    1.  Verify that there are no typos or extra slashes.
    2.  Ensure the protocol (`http` vs. `https`) is correct for the environment. Production should always use `https`.

-   **Domain Verification**: Google may require you to verify ownership of your domain (`donna-interactive-grid.vercel.app`) in the Google Search Console.

-   **Development vs. Production**: Remember to have separate redirect URIs for development (`http://localhost:3000/...`) and production (`https://...`). The application code should dynamically use the correct one based on the environment.

## 4. Security Best Practices

-   **Limit Scopes**: Only request the permissions (scopes) your application absolutely needs. This is configured in the OAuth start route.
-   **Secure Token Storage**: Refresh tokens are long-lived and sensitive. They should be stored securely (e.g., encrypted in your database). The current implementation stores them in Supabase.
-   **State Parameter**: The use of a `state` parameter is a crucial security measure to prevent Cross-Site Request Forgery (CSRF) attacks. The application already implements this.
