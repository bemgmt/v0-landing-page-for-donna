# Formspree Setup Guide

## Overview

The DONNA landing page form now uses Formspree to handle form submissions. Formspree provides a reliable, hosted form service that handles email delivery without requiring SMTP configuration.

## Setup Instructions

You already have your Formspree project ID and deploy key! Follow these steps to configure them:

### 1. Configure Form Settings (if needed)

1. Log in to your Formspree dashboard
2. Find your form/project
3. Ensure the recipient email is set to: `info@bemdonna.com`
4. Optionally configure:
   - Email subject line format
   - Auto-responder messages
   - Spam protection settings
   - Webhook integrations

### 4. Set Environment Variables

#### Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_FORMSPREE_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_FORMSPREE_DEPLOY_KEY=your-deploy-key-here
```

Replace:
- `your-project-id-here` with your actual Formspree project ID
- `your-deploy-key-here` with your actual Formspree deploy key

**Note:** The deploy key is optional but recommended for better security and authentication.

#### Vercel Production Environment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_FORMSPREE_PROJECT_ID` | Your Formspree project ID | Production, Preview, Development |
| `NEXT_PUBLIC_FORMSPREE_DEPLOY_KEY` | Your Formspree deploy key | Production, Preview, Development |

**Important:** 
- Make sure to add both variables to all environments (Production, Preview, Development) if you want it to work in all environments
- The deploy key is optional but recommended for authentication

### 5. Deploy

After setting the environment variable:

1. **For local development:** Restart your dev server:
   ```bash
   npm run dev
   ```

2. **For Vercel:** The next deployment will automatically pick up the new environment variable, or you can trigger a redeploy manually.

## Form Data Structure

The form submits the following fields to Formspree:

- `name` - User's full name
- `email` - User's email address
- `company` - Company name
- `role` - User's role (Founder/CEO, Operations Manager, HR Manager, Executive, Other)
- `useCase` - Optional use case description
- `type` - Either "Waitlist Signup" or "Demo Request"
- `_subject` - Email subject line (automatically formatted)

## Testing

1. Fill out the form on your landing page
2. Submit the form
3. Check your Formspree dashboard for the submission
4. Check `info@bemdonna.com` for the email notification

## Troubleshooting

### Form submits but no email received

1. Check your Formspree dashboard to see if the submission was received
2. Verify the recipient email is set correctly in Formspree settings
3. Check spam/junk folder
4. Verify your Formspree account email limits (free tier has limits)

### "Form configuration error" message

- Make sure `NEXT_PUBLIC_FORMSPREE_PROJECT_ID` is set in your environment variables
- Optionally set `NEXT_PUBLIC_FORMSPREE_DEPLOY_KEY` for authentication
- Restart your dev server after adding the variables
- For Vercel, make sure the variables are set and redeploy

### CORS or network errors

- Formspree handles CORS automatically, but if you see errors, check:
  - Your form ID is correct
  - You're using the correct Formspree endpoint (`https://formspree.io/f/{form-id}`)
  - Your Formspree account is active

## Formspree Free Tier Limits

- 50 submissions per month
- Basic spam protection
- Email notifications

For higher limits, consider upgrading to a paid plan.

## Migration from SMTP

If you were previously using the SMTP setup:

1. The `/api/send-email` route is no longer needed (but can be kept as backup)
2. You can remove SMTP environment variables if not used elsewhere
3. The `formspree.json` file in the root is for Formspree's static site integration (optional)

