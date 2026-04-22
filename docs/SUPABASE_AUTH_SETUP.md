# Supabase auth setup (Google OAuth, redirects, email + password)

Use this checklist when Google sign-in fails, magic links land on the wrong host, or password sign-in returns errors.

## Site URL and redirects

1. Open the Supabase Dashboard → **Authentication** → **URL configuration**.
2. Set **Site URL** to your canonical app origin (no trailing slash), e.g. `https://yourdomain.com`. Match `www` vs apex consistently with how users open the app.
3. Under **Redirect URLs**, add every origin that should complete OAuth or magic links, including:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (local dev)
   - Preview URLs if you use Vercel previews, e.g. `https://*.vercel.app/auth/callback` if your Supabase project allows wildcards (confirm in current Supabase docs).

The app builds `redirectTo` as `{origin}/auth/callback?next=...` for Google OAuth and magic links (`NEXT_PUBLIC_SITE_URL` is a fallback when `window` is unavailable).

## Google provider

1. **Authentication** → **Providers** → **Google**: enable and paste **Client ID** and **Client secret** from Google Cloud Console.
2. In **Google Cloud Console** → **APIs & Services** → **Credentials** → your **OAuth 2.0 Client ID** (Web application):
   - **Authorized JavaScript origins**: your site origins (e.g. `https://yourdomain.com`).
   - **Authorized redirect URIs**: must include Supabase’s callback,  
     `https://<project-ref>.supabase.co/auth/v1/callback`  
     (copy the exact redirect URL shown in the Supabase Google provider settings).

## Email + password

1. **Authentication** → **Providers** → **Email**: enable.
2. Turn **on** password-based sign-in (disable “passwordless only” / enable passwords, depending on dashboard wording).
3. If **Confirm email** is required, users must verify email before `signInWithPassword` succeeds; admins can still set passwords via the admin API.

## Environment

- Set `NEXT_PUBLIC_SITE_URL` in production to the same canonical origin as Supabase **Site URL** when possible (helps server-rendered links and metadata).

## Debugging

- After a failed OAuth round-trip, check **Authentication** → **Logs** in Supabase.
- The app redirects failed code exchange to `/login?error=oauth&reason=...` so the message is visible on the login page.
