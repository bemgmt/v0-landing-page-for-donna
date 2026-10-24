# DONNA cinematic booking implementation

Route: /booking. Branch: feature/cinematic-la-booking.

Approved rules:
- Monday–Friday 9:00 AM–5:00 PM America/Los_Angeles.
- Discovery Call: 30 minutes; Product Demo: 45 minutes; Strategic Discussion: 60 minutes.
- 15-minute buffer; 24-hour minimum notice; 30-day booking horizon.
- Calendar owner: derek@bem.studio.

## Before activation
1. Add four aligned cinematic background assets to public/booking-scenes/la-{morning,day,evening,night}.webp. These paths are referenced by the UI; they are not yet committed. Ensure 4K source, optimized WebP and consistent camera geometry.
2. Set up Google OAuth 2.0 for server-side access to derek@bem.studio. The shareable calendar link is not sufficient. Store refresh tokens encrypted server-side, never in NEXT_PUBLIC_* or the repository.
3. Implement GET /api/booking/availability: validate date and duration, enforce rules above, query Google Calendar free/busy with authenticated OAuth, account for buffer, and return {times: string[]} in Pacific time.
4. Implement POST /api/booking: validate name/email/date/time/type, recheck free/busy before inserting an event, create Google Meet conference and invitee, and return confirmation. Add rate limiting and abuse protection.
5. Run end-to-end tests on a Vercel preview; verify booking emails and timezone conversion. Do not merge until these steps are done.

Currently both endpoints return 503 intentionally so the site cannot accept phantom bookings.
