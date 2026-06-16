import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { auth } from '@/lib/preview-auth'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

// --- GEMINI PROPOSED CHANGE START ---
function getErrorResponse(message: string, status: number, details?: object) {
    console.error(`[GMAIL_OAUTH_CALLBACK] ${message}`, details || '');
    Sentry.captureMessage(message, { level: 'error', extra: details });
    
    const friendlyMessages: { [key: string]: string } = {
        'Invalid OAuth state': 'Authentication session expired or was invalid. Please try connecting your Gmail account again.',
        'Authorization code not found': 'The authorization code from Google was missing. Please try again.',
        'Missing Google OAuth configuration': 'The server is missing necessary configuration for Google OAuth. Please contact support.',
        'Token exchange failed': 'Failed to exchange authorization code for tokens. This could be a temporary issue with Google or a server configuration problem.',
        'Failed to connect Gmail': 'An unexpected error occurred while connecting your Gmail account. Please try again later or contact support.'
    };

    const responseBody = {
        success: false,
        error: friendlyMessages[message] || 'An unknown error occurred.'
    };

    return new Response(JSON.stringify(responseBody), { 
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
// --- GEMINI PROPOSED CHANGE END ---


/**
 * Handles the Gmail OAuth callback: validates state, exchanges the authorization code for tokens,
 * retrieves the user's Gmail address, upserts the user in the database, and stores Gmail refresh tokens.
 *
 * On success this returns a 200 Response indicating the connection is complete and clears the
 * `gmail_oauth_state` cookie. If the authorization exchange yields no refresh token (user already
 * granted consent), the route returns 200 with a message that the account is already connected.
 *
 * On error the function captures the exception via Sentry and returns a 500 Response.
 *
 * @param req - The incoming OAuth callback request containing `code` and `state` query parameters.
 * @returns A Response indicating success or the specific error status (401, 400, 500).
 */
// --- GEMINI PROPOSED CHANGE START ---
export async function GET(req: Request) {
  if (!supabaseAdmin) {
      return getErrorResponse('Server missing Supabase config', 500);
  }

  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  const missingVars = [];
  if (!GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
  if (!GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');
  if (!GOOGLE_REDIRECT_URI) missingVars.push('GOOGLE_REDIRECT_URI');

  if (missingVars.length > 0) {
      return getErrorResponse('Missing Google OAuth configuration', 500, { missingVars });
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') || ''
    const cookieState = cookies().get('gmail_oauth_state')?.value || ''
    
    cookies().delete('gmail_oauth_state') // Delete cookie regardless of outcome

    if (!state || !cookieState || state !== cookieState) {
        return getErrorResponse('Invalid OAuth state', 400, {
            hasState: !!state,
            hasCookieState: !!cookieState,
            stateFromUrl: state,
            stateFromCookie: cookieState,
        });
    }
    if (!code) {
      return getErrorResponse('Authorization code not found', 400);
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    )

    let tokens;
    try {
        const response = await oauth2Client.getToken(code);
        tokens = response.tokens;
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
            const errorWithResponse = error as { response?: { data?: { error?: string } } }
            if (errorWithResponse.response?.data?.error === 'redirect_uri_mismatch') {
                console.error('[GMAIL_OAUTH_CALLBACK] Redirect URI Mismatch.', {
                    configured: GOOGLE_REDIRECT_URI,
                    errorDetails: errorWithResponse.response.data
                });
                Sentry.captureException(error, { extra: { message: 'Redirect URI Mismatch' } });
                return getErrorResponse('A redirect URI mismatch was detected. Please check server configuration.', 500);
            }
        }
        throw error; // Re-throw other token errors
    }
    
    oauth2Client.setCredentials(tokens)

    if (!tokens.refresh_token) {
        console.log('[GMAIL_OAUTH_CALLBACK] No refresh token received. User may have already granted consent.');
        return new Response('Gmail account is already connected. You can close this window.', { status: 200 })
    }

    // Get user's email from Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress;

    if (!email) {
        return getErrorResponse('Could not retrieve email address from Google.', 500);
    }

    // 1. Upsert user
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ clerk_id: userId, email: email }, { onConflict: 'clerk_id' })
      .select('id')
      .single()

    if (userError) throw userError
    if (!userData) throw new Error('Failed to upsert user.')
    const dbUserId = userData.id

    // 2. Store Gmail tokens
    const { error: tokenError } = await supabaseAdmin
      .from('gmail_tokens')
      .upsert({
        user_id: dbUserId,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      }, { onConflict: 'user_id' })

    if (tokenError) throw tokenError
    
    return new Response('Connected! You can now close this window.', { status: 200 })
  } catch (error) {
    console.error('[GMAIL_OAUTH_CALLBACK] Unhandled error in callback:', error);
    Sentry.captureException(error);
    
    let errorMessage = 'Failed to connect Gmail';
    if (error instanceof Error && error.message.includes('invalid_grant')) {
        errorMessage = 'The authorization code was invalid or has expired. Please try again.';
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 })
  }
}
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// export async function GET(req: Request) {
//   if (!supabaseAdmin) return new Response('Server missing Supabase config', { status: 500 })

//   try {
//     const { userId } = await auth()
//     if (!userId) {
//       return new Response('Unauthorized', { status: 401 })
//     }

//     const url = new URL(req.url)
//     const code = url.searchParams.get('code')
//     const state = url.searchParams.get('state') || ''
//     const cookieState = cookies().get('gmail_oauth_state')?.value || ''
//     if (!state || !cookieState || state !== cookieState) {
//       cookies().delete('gmail_oauth_state')
//       return new Response('Invalid OAuth state', { status: 400 })
//     }
//     if (!code) {
//       throw new Error('Authorization code not found.')
//     }

//     if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
//       throw new Error('Missing Google OAuth configuration')
//     }
//     const oauth2Client = new google.auth.OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET,
//       process.env.GOOGLE_REDIRECT_URI
//     )

//     const { tokens } = await oauth2Client.getToken(code)
//     oauth2Client.setCredentials(tokens)

//     if (!tokens.refresh_token) {
//         // This happens on subsequent authorizations if the user has already granted consent.
//         // We can just confirm the connection is active.
//         cookies().delete('gmail_oauth_state')
//         return new Response('Gmail account is already connected. You can close this window.', { status: 200 })
//     }

//     // Get user's email from Gmail API
//     const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
//     const profile = await gmail.users.getProfile({ userId: 'me' });
//     const email = profile.data.emailAddress;


//     // 1. Upsert user
//     const { data: userData, error: userError } = await supabaseAdmin
//       .from('users')
//       .upsert({ clerk_id: userId, email: email }, { onConflict: 'clerk_id' })
//       .select('id')
//       .single()

//     if (userError) throw userError
//     if (!userData) throw new Error('Failed to upsert user.')
//     const dbUserId = userData.id

//     // 2. Store Gmail tokens
//     const { error: tokenError } = await supabaseAdmin
//       .from('gmail_tokens')
//       .upsert({
//         user_id: dbUserId,
//         refresh_token: tokens.refresh_token,
//         scope: tokens.scope,
//         token_type: tokens.token_type,
//         expiry_date: tokens.expiry_date,
//       }, { onConflict: 'user_id' })

//     if (tokenError) throw tokenError
    
//     cookies().delete('gmail_oauth_state')
//     return new Response('Connected! You can now close this window.', { status: 200 })
//   } catch (error) {
//     console.error('[API GMAIL CALLBACK ERROR]', error)
//     Sentry.captureException(error)
//     return new Response(JSON.stringify({ success: false, error: 'Failed to connect Gmail' }), { status: 500 })
//   }
// }
// --- OLD CODE TO BE DELETED END ---
