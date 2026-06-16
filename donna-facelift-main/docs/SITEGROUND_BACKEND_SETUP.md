# SiteGround PHP Backend Setup Guide

This guide provides detailed instructions for deploying, configuring, and troubleshooting the DONNA PHP backend on SiteGround hosting.

## 1. Deployment

### File Structure

Your file structure on SiteGround should look like this. The root is typically `/home/customer/www/bemdonna.com/`.

```
/home/customer/www/bemdonna.com/
|-- .env                <-- IMPORTANT: Environment variables go here
|-- public_html/
|   |-- donna/
|   |   |-- api/
|   |   |   |-- inbox.php
|   |   |   |-- marketing.php
|   |   |   |-- lib/
|   |   |   |   |-- cors.php
|   |   |   |   |-- ApiResponder.php
|   |   |-- vendor/
|   |   |-- bootstrap_env.php
|   |   |-- .htaccess     <-- May be needed for routing or headers
```

### Uploading Files

1. Connect to your SiteGround account via FTP or use the SiteGround File Manager.
2. Navigate to your domain's root directory (e.g., `/home/customer/www/bemdonna.com/public_html`).
3. Create a directory named `donna`.
4. Upload the contents of your local `api/`, `vendor/`, and `lib/` directories into the `donna/` directory on the server.
5. Upload `bootstrap_env.php` into the `donna/` directory.

### File Permissions

Ensure that your PHP files have permissions of `644` and directories have permissions of `755`. This is standard for SiteGround and most web hosts.

## 2. Environment Configuration

The PHP backend relies on a `.env` file for all its configuration.

1. Navigate to your **home directory** on SiteGround, which is **outside** `public_html`. For example: `/home/customer/www/bemdonna.com/`.
2. Create a new file named `.env`.
3. Copy the contents of the local `api/.env.siteground` template into this new file.
4. **Fill in the placeholder values** for all variables, especially the secrets.

### Critical Variable: `ALLOWED_ORIGINS`

This is the most important variable for ensuring the Vercel frontend can communicate with the backend.

-   **`ALLOWED_ORIGINS`**: Must be set to `https://donna-interactive-grid.vercel.app,https://vercel.app`. The `cors.php` script will use this to validate incoming requests.

## 3. CORS (Cross-Origin Resource Sharing)

The `CORSHelper` class in `api/lib/cors.php` handles all CORS logic. It is integrated into `inbox.php` and `marketing.php`.

-   It checks the `Origin` header of incoming requests against the `ALLOWED_ORIGINS` environment variable.
-   It automatically handles `OPTIONS` preflight requests.
-   If an origin is not allowed, it will respond with a `403 Forbidden` error.

If you encounter CORS errors, verify:
1.  The `ALLOWED_ORIGINS` variable is set correctly in your `.env` file.
2.  The `.env` file is being loaded correctly by `bootstrap_env.php`.
3.  There are no conflicting CORS headers being set by SiteGround's server configuration (e.g., in `.htaccess`).

## 4. API Testing

You can test your deployed endpoints using `curl` or a tool like Postman.

**Example `curl` command for testing CORS:**

```bash
curl -i -X OPTIONS "https://bemdonna.com/donna/api/inbox.php"
  -H "Origin: https://donna-interactive-grid.vercel.app"
  -H "Access-Control-Request-Method: GET"
```

You should receive a `200 OK` response with `Access-Control-Allow-Origin: https://donna-interactive-grid.vercel.app` in the headers.

**Example `curl` command for testing an action (standardized on inbox.php):**

```bash
curl "https://bemdonna.com/donna/api/inbox.php?action=read_inbox"
  -H "Origin: https://donna-interactive-grid.vercel.app"
```

This should return a `500` error with a message about a missing refresh token if your `.env` is not fully configured, which proves the endpoint is working.

## 5. Troubleshooting

-   **CORS Errors**: Almost always an issue with the `ALLOWED_ORIGINS` variable. Double-check for typos.
-   **500 Server Error**:
    -   Check the SiteGround error logs for details.
    -   This often means an environment variable is missing (e.g., `GMAIL_REFRESH_TOKEN`, `OPENAI_API_KEY`).
    -   Verify your `.env` file path in `bootstrap_env.php`.
-   **404 Not Found**: The file path is incorrect. Verify your deployment structure.
-   **PHP Version**: Ensure your SiteGround environment is running a compatible PHP version (e.g., PHP 8.1+).

## 6. Security

-   **`.env` File Location**: Placing the `.env` file outside the `public_html` directory is critical. This prevents it from being publicly accessible via a web browser.
-   **File Permissions**: Restrictive file permissions (`600`) on the `.env` file can add an extra layer of security.

```
