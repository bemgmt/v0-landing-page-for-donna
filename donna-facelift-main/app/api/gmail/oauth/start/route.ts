import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

/**
 * Initiates the Gmail OAuth flow by creating a Google OAuth2 authorization URL and redirecting the client.
 *
 * Validates required environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) and returns a 500 JSON error if any are missing. Generates a cryptographically random `state` value, stores it in an httpOnly cookie `gmail_oauth_state` (secure in production, SameSite=lax, path `/`, maxAge 600s), then builds an authorization URL requesting offline access with Gmail readonly and send scopes and redirects the client to that URL. On unexpected errors captures the exception with Sentry and responds with a 500 JSON error.
 */
// --- GEMINI PROPOSED CHANGE START ---
export async function GET() {
  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
    const missingVars = [];

    if (!GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
    if (!GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');
    if (!GOOGLE_REDIRECT_URI) missingVars.push('GOOGLE_REDIRECT_URI');

    if (missingVars.length > 0) {
      const error = `Missing Google OAuth configuration. The following environment variables are not set: ${missingVars.join(', ')}`;
      console.error(`[GMAIL_OAUTH_START] ${error}`);
      Sentry.captureMessage(error, 'error');
      return NextResponse.json({ error: 'Server configuration error. Please contact support.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    if (process.env.NODE_ENV === 'production') {
        if (!GOOGLE_REDIRECT_URI.startsWith('https://')) {
            const error = `Invalid GOOGLE_REDIRECT_URI in production. Must use https. URI: ${GOOGLE_REDIRECT_URI}`;
            console.error(`[GMAIL_OAUTH_START] ${error}`);
            Sentry.captureMessage(error, 'error');
            return NextResponse.json({ error: 'Server configuration error regarding redirect URI.' }, { status: 500 });
        }
        const expectedRedirectUri = 'https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback';
        if (GOOGLE_REDIRECT_URI !== expectedRedirectUri) {
            const error = `GOOGLE_REDIRECT_URI does not match expected production URI. Expected: ${expectedRedirectUri}, Found: ${GOOGLE_REDIRECT_URI}`;
            console.warn(`[GMAIL_OAUTH_START] ${error}`);
            Sentry.captureMessage(error, 'warning');
        }
    }


    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const state = crypto.randomUUID();
    cookies().set('gmail_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state
    });

    console.log(`[GMAIL_OAUTH_START] Initiating OAuth flow. State: ${state}, Redirecting to Google.`);

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('[GMAIL_OAUTH_START] Failed to initiate Gmail OAuth flow:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Failed to initiate Gmail OAuth. Please try again later.' }, { status: 500 });
  }
}
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// export async function GET() {
//   try {
//     if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
//       return NextResponse.json({ error: 'Missing Google OAuth configuration' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
//     }
//     const oauth2Client = new google.auth.OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET,
//       process.env.GOOGLE_REDIRECT_URI
//     )

//     const state = crypto.randomUUID()
//     cookies().set('gmail_oauth_state', state, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       path: '/',
//       maxAge: 600,
//     })

//     const url = oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: [
//         'https://www.googleapis.com/auth/gmail.readonly',
//         'https://www.googleapis.com/auth/gmail.send'
//       ],
//       prompt: 'consent',
//       state
//     })

//     return NextResponse.redirect(url)
//   } catch (error) {
//     Sentry.captureException(error)
//     return NextResponse.json({ error: 'Failed to initiate Gmail OAuth' }, { status: 500 })
//   }
// }
// --- OLD CODE TO BE DELETED END ---
