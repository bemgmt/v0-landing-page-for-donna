# Email Setup Guide - Gmail SMTP

## Overview

The DONNA landing page form uses Gmail SMTP to send emails. This guide will help you configure Gmail SMTP for both local development and production.

## Important: Gmail App-Specific Password Required

Gmail requires an **App-Specific Password** (not your regular Gmail password) for SMTP authentication. This is a security feature that Gmail uses for third-party applications.

## Step 1: Enable 2-Step Verification

Before you can create an app-specific password, you need to enable 2-Step Verification on your Google account:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable it

## Step 2: Create an App-Specific Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app type
5. Select **Other (Custom name)** as the device
6. Enter "DONNA Landing Page" or any name you prefer
7. Click **Generate**
8. **Copy the 16-character password** (you'll need this for your environment variables)
   - Format: `xxxx xxxx xxxx xxxx` (spaces are optional)

**Important:** This password is shown only once. Save it securely!

## Gmail SMTP Settings

- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `465` (SSL) or `587` (TLS)
- **Username**: Your full Gmail address (e.g., `yourname@gmail.com`)
- **Password**: Your 16-character app-specific password (not your regular Gmail password)
- **Encryption**: SSL/TLS

## Setup Instructions

### 1. Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Important Notes:**
- Replace `yourname@gmail.com` with your actual Gmail address
- Replace `xxxx xxxx xxxx xxxx` with your 16-character app-specific password
- You can include or exclude spaces in the app password
- Port 465 uses SSL (secure: true) - recommended
- Port 587 uses TLS (secure: false) - alternative if 465 doesn't work

### 2. Vercel Production Environment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SMTP_HOST` | smtp.gmail.com | Production, Preview, Development |
| `SMTP_PORT` | 465 | Production, Preview, Development |
| `SMTP_USER` | yourname@gmail.com | Production, Preview, Development |
| `SMTP_PASSWORD` | xxxx xxxx xxxx xxxx | Production, Preview, Development |

4. Click **Save**
5. Redeploy your application for changes to take effect

## Testing the Email Configuration

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`

3. Fill out the "Join the Waitlist" or "Request a Demo" form

4. Submit the form

5. Check your email inbox for:
   - Notification email (to your Gmail address)
   - Confirmation email (to the user's email)

### Production Testing

1. Visit your live site on Vercel

2. Fill out the form with a test email

3. Verify both emails are received

## Troubleshooting

### Error: "Authentication failed" or "Invalid login"

**Possible causes:**
1. Using regular Gmail password instead of app-specific password
2. App-specific password copied incorrectly
3. 2-Step Verification not enabled

**Solutions:**
- Make sure you're using an **app-specific password**, not your regular Gmail password
- Regenerate the app-specific password if needed
- Verify 2-Step Verification is enabled on your Google account
- Double-check the password in your environment variables (no extra spaces)

### Error: "Failed to send email"

**Possible causes:**
1. Incorrect SMTP credentials
2. Gmail blocking the connection
3. Firewall blocking SMTP port

**Solutions:**
- Verify all credentials are correct
- Try port 587 instead of 465 (and update secure: false in code if needed)
- Check Gmail account for security alerts
- Make sure "Less secure app access" is not required (app passwords should work)

### Error: "Connection timeout"

**Possible causes:**
1. Firewall blocking port 465
2. Network restrictions

**Solutions:**
- Try port 587 (TLS) instead of 465 (SSL)
- Check if your network/firewall allows SMTP connections
- Test from a different network

### Emails not being received

**Possible causes:**
1. Emails going to spam folder
2. Gmail rate limiting
3. Incorrect recipient email

**Solutions:**
- Check spam/junk folders
- Gmail has sending limits (500 emails/day for free accounts)
- Verify the recipient email address is correct

### Port 465 vs 587

**Port 465 (SSL) - Recommended:**
```env
SMTP_PORT=465
# Code uses: secure: true
```

**Port 587 (TLS) - Alternative:**
```env
SMTP_PORT=587
# You may need to modify code to: secure: false
```

If port 465 doesn't work, try 587. The code currently uses `secure: true` which works with port 465.

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - Already in `.gitignore`
   - Contains sensitive passwords

2. **Use app-specific passwords only**
   - Never use your regular Gmail password
   - Each app should have its own app-specific password
   - Revoke app passwords if compromised

3. **Rotate app passwords regularly**
   - Generate new app-specific passwords every 3-6 months
   - Update in both `.env.local` and Vercel
   - Revoke old passwords

4. **Monitor email usage**
   - Check Gmail for unusual activity
   - Review sent emails regularly
   - Watch for Gmail security alerts

5. **Enable 2-Step Verification**
   - Required for app-specific passwords
   - Adds extra security to your Google account

## Alternative: Using a Different Email Address

If you want to send notification emails to a different address than your Gmail:

Edit `app/api/send-email/route.ts`:

```typescript
const mailOptions = {
  from: process.env.SMTP_USER,
  to: "different-email@example.com", // Change this
  subject: `DONNA ${type === "waitlist" ? "Waitlist Signup" : "Demo Request"} - ${name}`,
  // ... rest of config
}
```

Or add a new environment variable:

```env
NOTIFICATION_EMAIL=team@yourdomain.com
```

Then update the code to use:
```typescript
to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
```

## Email Template Customization

The email templates are in `app/api/send-email/route.ts`:

1. **Notification Email** (sent to you):
   - Subject: "DONNA Waitlist Signup - [Name]" or "DONNA Demo Request - [Name]"
   - Contains: Name, Email, Company, Role, Use Case

2. **Confirmation Email** (sent to user):
   - Subject: "DONNA - We Received Your Request"
   - Contains: Thank you message and next steps

Edit these templates to customize the content.

## Gmail Sending Limits

**Free Gmail Accounts:**
- 500 emails per day
- 2,000 emails per day for Google Workspace accounts

If you exceed these limits, consider:
- Upgrading to Google Workspace
- Using a different email service
- Implementing rate limiting

## Support

If you continue to have issues:

1. **Google Support**:
   - [Gmail Help Center](https://support.google.com/mail)
   - Search for "app-specific password" or "SMTP settings"

2. **Check Gmail Security**:
   - Review security alerts in your Google account
   - Check if Gmail is blocking the connection

3. **Contact DONNA Support**:
   - info@bemdonna.com
   - support@bemdonna.com

## Summary

✅ Configured for Gmail SMTP
✅ Uses app-specific passwords for security
✅ Works with both local development and production
✅ Sends notification and confirmation emails

Your form emails will now be sent through your Gmail account!
