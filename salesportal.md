# DONNA Member and Sales Portal Build File

**Suggested path:** `.cursor/plans/donna-member-sales-portal.md`

This file is designed to be the plan document that Composer 2 reads before it writes code. Cursor’s planning workflow saves plans as Markdown in `.cursor/plans/`, Cursor supports persistent repo instructions through project rules and `AGENTS.md`, and Cursor’s own guidance recommends planning first, saving the plan to the workspace, and then building against that spec. Composer 2 is explicitly positioned for long-horizon coding tasks, which fits a portal build with auth, data, chat, and workflow logic. citeturn25view0turn20view0turn18view2turn26view0

The public entity["company","GitHub","developer platform"] repos for this project family show two practical constraints. The current `bemdonna` landing-page repo is auto-synced from v0 and deployed on entity["company","Vercel","cloud platform"], so you should treat v0 as a possible overwrite source until you intentionally cut over to a normal Git workflow. The newer `donna-facelift` repo already includes entity["company","Clerk","auth platform"] and entity["company","Supabase","backend platform"] dependencies, but its preview mode disables Clerk and short-circuits Supabase-backed functionality. In other words: keep the public landing page stable, add the portal as protected app routes, and remove either the v0 overwrite path or the preview/auth bypasses before shipping protected features. citeturn12view1turn12view2turn24view1

The `wsgvrbot` repo is the right pattern for the **human handoff** portion of the build. It already uses Next.js App Router, route handlers, a staff dashboard at `/employee/chat`, AI-session takeover endpoints, and a persistent chat store. But its own documentation also warns that the current employee identity model is based on browser `localStorage` and should be replaced with real authentication, session management, and role-based access control in production. Reuse the flow, not the auth shortcut. citeturn13view0turn14view0turn15view0turn15view3turn11view1turn16view0

## Architecture decisions

Build this as a **single protected portal area** inside the active DONNA Next.js app unless you deliberately choose a separate portal app because of v0 sync risk. Keep all marketing pages public. Add a protected `/portal` area for free members and partners, and a separate `/admin` area for staff and admins. Use Clerk middleware and server-side auth helpers to protect routes, because Clerk does **not** protect any routes by default. Use Next.js Route Handlers inside `app/api/...` for writes, chat, handoff, and lead assignment logic. Store portal data in Supabase Postgres and portal files in Supabase Storage, because Supabase supports Clerk as a third-party auth provider and applies Row Level Security to both database access and storage access. citeturn22search1turn22search18turn22search2turn23search2turn23search15turn22search0turn22search8

On the visual side, keep the member portal extremely close to your chamber-style reference by using a clean protected shell with a left navigation rail, summary cards, and profile-first navigation. On the DONNA side specifically, reuse the current glass/neon design system already summarized in `donna-facelift`: `GlassCard`, `NeonButton`, `FuturisticInput`, and `ChatBubble` are already defined and intended for incremental reuse. That gives you a portal that still feels native to the current DONNA site rather than a bolted-on admin app. citeturn24view2

Use this route and file layout as the target structure:

```text
app/
  page.tsx
  portal/
    layout.tsx
    page.tsx
    profile/page.tsx
    can-donna/page.tsx
    sales/page.tsx
    documents/page.tsx
    socials/page.tsx
    forum/page.tsx
    forum/[slug]/page.tsx
    leads/
      claim/page.tsx
      round-robin/page.tsx
  admin/
    layout.tsx
    page.tsx
    members/page.tsx
    partners/page.tsx
    sales/page.tsx
    documents/page.tsx
    forum/page.tsx
    leads/page.tsx
    live-chat/page.tsx
  api/
    portal/
      me/route.ts
      profile/route.ts
      sales/route.ts
      documents/route.ts
      socials/route.ts
    forum/
      posts/route.ts
      replies/route.ts
    chat/
      session/route.ts
      message/route.ts
      live/route.ts
      takeover/route.ts
      staff-status/route.ts
    leads/
      claim/route.ts
      round-robin/route.ts
      assign/route.ts

components/
  portal/
  admin/
  chat/
  forum/
  sales/

lib/
  auth/
  portal/
  chat/
  forum/
  sales/
  leads/
  supabase/

supabase/
  migrations/
```

If your local workspace includes the original `chambersite` repo, tell Composer to **inspect that local repo for shell/layout patterns only**. It should mirror navigation and portal UX from there, but it should **not** blindly inherit whatever auth or storage assumptions that old project used.

## Permissions and data model

The portal should support four roles:

- `free_member`
- `partner`
- `staff`
- `admin`

The access rules should be simple:

- `free_member` can access **Profile**, **Can DONNA**, **Documents** with member-safe categories, **Socials**, and **Forum**.
- `partner` gets everything a free member gets, plus **Promo Code**, **Sales Dashboard**, **Claim a Sale**, and **Round Robin / Unclaimed Leads**.
- `staff` gets moderation and support tools, especially **Live Chat**, forum moderation, lead review, and basic member support.
- `admin` gets full CRUD access across members, partners, documents, forum, leads, sales adjustments, and system settings.

Because Clerk leaves routes public by default, do not rely on UI hiding alone. Protect routes in middleware, then repeat the role check in every write path and every admin route handler. Supabase RLS should be the final backstop for row-level access, especially for documents, forum content tied to authorship, chat sessions tied to users, and partner sales tied to promo code ownership. citeturn22search1turn22search18turn22search0turn22search8turn23search2

Use this core schema:

```text
member_profiles
- id uuid pk
- clerk_user_id text unique not null
- role text not null check (role in ('free_member','partner','staff','admin'))
- display_name text
- email text
- avatar_url text
- company_name text
- bio text
- phone text
- website_url text
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz

promo_codes
- id uuid pk
- partner_profile_id uuid fk -> member_profiles.id
- code text unique not null
- share_slug text unique
- status text default 'active'
- notes text
- created_at timestamptz
- updated_at timestamptz

sales
- id uuid pk
- promo_code_id uuid fk -> promo_codes.id null
- partner_profile_id uuid fk -> member_profiles.id null
- external_sale_id text null
- customer_name text null
- customer_email text null
- amount numeric(12,2) default 0
- status text check (status in ('pending','approved','rejected','paid'))
- attribution_source text check (attribution_source in ('promo_code','manual_claim','round_robin','admin'))
- sale_date timestamptz
- created_at timestamptz
- updated_at timestamptz

sale_claims
- id uuid pk
- sale_id uuid fk -> sales.id null
- claimant_profile_id uuid fk -> member_profiles.id
- evidence_notes text
- evidence_file_url text null
- status text check (status in ('pending','approved','rejected'))
- reviewed_by uuid fk -> member_profiles.id null
- reviewed_at timestamptz null
- created_at timestamptz
- updated_at timestamptz

lead_pool
- id uuid pk
- lead_name text
- lead_email text
- lead_phone text
- notes text
- status text check (status in ('unclaimed','assigned','claimed','closed'))
- assigned_partner_id uuid fk -> member_profiles.id null
- source text
- created_at timestamptz
- updated_at timestamptz

round_robin_state
- id uuid pk
- queue_name text unique
- current_partner_id uuid fk -> member_profiles.id null
- current_index integer default 0
- updated_at timestamptz

documents
- id uuid pk
- title text
- description text
- category text
- storage_path text
- mime_type text
- min_role text check (min_role in ('free_member','partner','staff','admin'))
- is_active boolean default true
- sort_order integer default 0
- created_at timestamptz
- updated_at timestamptz

social_links
- id uuid pk
- platform text
- label text
- url text
- icon text
- is_active boolean default true
- sort_order integer default 0

forum_categories
- id uuid pk
- slug text unique
- title text
- description text
- is_active boolean default true

forum_posts
- id uuid pk
- category_id uuid fk -> forum_categories.id
- author_profile_id uuid fk -> member_profiles.id
- slug text unique
- title text
- body_md text
- is_pinned boolean default false
- status text default 'published'
- created_at timestamptz
- updated_at timestamptz

forum_replies
- id uuid pk
- post_id uuid fk -> forum_posts.id
- author_profile_id uuid fk -> member_profiles.id
- body_md text
- is_staff_answer boolean default false
- created_at timestamptz
- updated_at timestamptz

chat_sessions
- id uuid pk
- member_profile_id uuid fk -> member_profiles.id
- status text check (status in ('ai','waiting_for_staff','live','closed'))
- staff_profile_id uuid fk -> member_profiles.id null
- requested_human boolean default false
- capability_mode boolean default true
- created_at timestamptz
- updated_at timestamptz

chat_messages
- id uuid pk
- session_id uuid fk -> chat_sessions.id
- role text check (role in ('user','assistant','staff','system'))
- message text
- metadata jsonb default '{}'
- created_at timestamptz

staff_presence
- profile_id uuid pk fk -> member_profiles.id
- availability text check (availability in ('online','away','offline'))
- updated_at timestamptz

audit_events
- id uuid pk
- actor_profile_id uuid fk -> member_profiles.id null
- event_type text
- entity_type text
- entity_id text
- payload jsonb default '{}'
- created_at timestamptz
```

A few design notes matter here:

- Keep **public marketing content** where it already lives today if you are using your current content pipeline, but keep **portal data** in Supabase.
- Store portal documents in a **private storage bucket** and expose downloads only after permission checks.
- Do **not** hardcode social URLs and video links into components. Put them in `social_links`, and optionally add a `featured_videos` table later if you want thumbnails and descriptions.
- Use `forum_categories` with exactly two seeded categories on day one: `ideas` and `sales-questions`.

## Implementation phases

### Prepare the workspace

1. Detect which repo is actually active in the Cursor workspace.
2. Inspect `package.json`, `middleware.ts`, `app/layout.tsx`, `app/page.tsx`, the current design system files, and any existing auth/chat utilities.
3. Freeze framework versions for this branch. Do **not** upgrade Next.js, React, Tailwind, or Radix just because Composer suggests it.
4. If the active repo is `bemdonna`, decide whether to stop the v0 auto-sync workflow before build-out. If not, move the portal work into a separate app or a new non-v0-managed branch/repo.
5. If the active repo is `donna-facelift`, make sure production work does **not** ship with `FACELIFT_PREVIEW=true` or auth bypass flags still enabled. citeturn12view1turn24view1

**Acceptance criteria**

- Composer has identified the source repo correctly.
- The branch contains no framework-major upgrades.
- Public pages are unchanged.
- A placeholder `/portal` route and `/admin` route compile cleanly.

### Protect sign-in and roles

1. If Clerk is already present in the active repo, wire it in fully. If it is missing, add it now.
2. Add middleware protection for:
   - `/portal(.*)`
   - `/admin(.*)`
   - portal/admin API routes
3. Add role helpers in `lib/auth/roles.ts`.
4. On first successful sign-in, upsert a `member_profiles` row with default role `free_member`.
5. Add a **Not Authorized** pattern for signed-in users who lack a role.
6. Add a simple admin-only member management page to change roles.

**Acceptance criteria**

- Guests cannot access `/portal` or `/admin`.
- Signed-in members reach `/portal`.
- Only `staff` and `admin` can access `/admin`.
- Role changes immediately affect navigation and route access.

### Persist portal data

1. Add Supabase server and browser clients.
2. Add migrations for all core tables listed above.
3. Create a private storage bucket for portal documents.
4. Add RLS policies:
   - users can read/update only their own profile
   - partners can read only their own promo codes, claims, and attributed sales
   - free members can read only role-approved documents
   - staff/admin can moderate forum and support data
5. Seed:
   - forum categories
   - placeholder social links
   - a few demo documents
   - a few fake leads and partner records for QA
6. Add repository/service modules so components do not call Supabase directly all over the tree.

**Acceptance criteria**

- Fresh database bootstrap works from migrations only.
- Demo seed data populates the dashboard.
- Protected documents require auth and role checks.
- No portal page relies on mock JSON after this phase.

### Build the member and partner portal

1. Create a protected `portal/layout.tsx` with:
   - left nav
   - mobile drawer nav
   - top summary bar
   - role badge
   - sign-out action
2. Build the dashboard cards:
   - profile completeness
   - promo code
   - sales count
   - approved sales value
   - open leads
   - unread forum activity
3. Build `/portal/profile`:
   - editable member profile
   - partner profile extras
   - promo code display and share URL
4. Build `/portal/sales`:
   - KPI cards
   - simple chart
   - recent sales list
   - claim sale CTA
5. Build `/portal/documents`:
   - filter by category
   - download action
   - role-aware visibility
6. Build `/portal/socials`:
   - all social profile cards
   - featured video links section
7. Build `/portal/forum` and `/portal/forum/[slug]`:
   - category filter
   - post list
   - post detail
   - reply composer
   - staff answer styling

**Acceptance criteria**

- `free_member` role sees only allowed sections.
- `partner` role sees sales and lead pages.
- Profile changes persist.
- Document downloads work securely.
- Forum posting and replies work with author attribution.

### Build Can DONNA and human support

1. Create `/portal/can-donna` as a **member-only** page.
2. Make the assistant answer in a structured way:
   - `verdict`: `yes`, `partial`, `no`, or `needs-human`
   - `summary`
   - `why`
   - `recommended_next_step`
   - `offer_handoff`
3. Use a capability-focused system prompt, not a generic public marketing chatbot.
4. Add “Talk to a human” only for signed-in members. If staff is online, convert the session to a live queue. If nobody is online, create a callback/help request and show that clearly.
5. Create `/admin/live-chat` by adapting the `wsgvrbot` flow:
   - tabs for AI / waiting / live
   - takeover button
   - live response panel
   - close conversation
6. Do **not** reuse the localStorage employee-auth shortcut from `wsgvrbot`. Staff access must be Clerk-protected and role-gated. citeturn14view0turn15view0turn15view1turn15view2turn15view3turn11view1

**Acceptance criteria**

- Guests cannot access Can DONNA.
- Free members can access it after sign-in.
- Staff/admin can see waiting and live sessions.
- A live takeover moves the thread from AI to staff mode.
- Offline state is handled gracefully instead of showing a broken button.

### Build claim sale and round robin

1. Add `/portal/leads/claim` for partner manual sale claims.
2. Add `/portal/leads/round-robin` for partner-side unclaimed lead visibility and queue context.
3. Add `/admin/leads` for staff/admin review.
4. Implement round-robin assignment rules:
   - only active partners in the queue
   - skip inactive or paused partners
   - log every assignment
   - keep cursor/index state in `round_robin_state`
5. When a sale or lead comes in without a promo-code attribution:
   - if it should be auto-assigned, use round robin
   - if it should be manually claimed, create a pending `sale_claim`
6. Prevent duplicate credit:
   - unique external sale ID if present
   - duplicate email/order checks
   - admin approval for manual claims

**Acceptance criteria**

- A partner can submit a manual sale claim.
- Admin can approve or reject claims.
- New unclaimed leads can be assigned by round robin.
- Assignment history is visible in audit events.

### Harden and release

1. Add tests for:
   - middleware protection
   - role helpers
   - sales attribution rules
   - round-robin edge cases
   - document authorization
   - chat takeover flow
2. Add seed/dev scripts so Composer can populate a realistic local portal quickly.
3. Add empty states, loading states, and error toasts everywhere.
4. Add audit logging for role changes, lead assignments, sale approvals, and document uploads.
5. Update README with setup, env vars, and route summary.
6. Run the strongest verification set available in the active repo.

**Acceptance criteria**

- Lint, build, and test commands pass.
- No protected data leaks into the public site.
- Every main portal page has loading, empty, and error states.
- README covers setup well enough for another developer to run the project locally.

## Composer workflow

Use **npm**, not pnpm, unless the active workspace proves otherwise. The public repos all use `package-lock.json`, npm scripts, and npm-first setup docs. If the active workspace is `donna-facelift`, use Node 20 because that repo’s engine requirement is `>=20 <21`. If the active workspace is `wsgvrbot`, its documentation says Node 18 or higher works, so Node 20 still keeps you inside the stricter shared-safe range. citeturn11view1turn12view2turn24view1

Start every Composer session in plan mode. Cursor’s own guidance is to plan first, save the plan, then execute against that plan in small phases. It also recommends adding rules only after you see repeated mistakes and giving the agent verifiable goals through types, linters, and tests. Use `/model` to select the model, `/plan` to switch into planning, and `/rules` only if you want to add a durable project rule after the first phase goes well. citeturn18view2turn20view0turn25view0turn26view0

Use this startup command set in the terminal:

```bash
npm ci
npm run
npm run dev
```

Use this reusable Composer header prompt for **every phase**:

```text
/model composer-2
/plan

Read .cursor/plans/donna-member-sales-portal.md before changing code.

Inspect package.json, middleware.ts, app/layout.tsx, app/page.tsx, current auth files, current chat files, and the current DONNA design-system components before proposing edits.

Do not upgrade Next.js, React, Tailwind, or UI libraries in this feature branch.

Prefer npm commands because this repo uses package-lock and npm scripts.

Keep the public landing page behavior unchanged unless the task explicitly targets a public portal entry point.

Use Clerk for authentication and role gating.
Use Supabase for portal persistence, storage, forum data, sales data, and lead workflows.
Use app/api route handlers for writes and chat endpoints.

Reuse the DONNA visual design system where available.
If the local workspace contains chambersite, inspect it for portal shell/layout patterns only.

Implement only this phase: <PASTE PHASE NAME HERE>

After coding, run only the verification scripts that actually exist in package.json, summarize what passed, what failed, and what still needs manual environment setup.
Stop when this phase is complete.
```

If you want to make Cursor even more reliable, add a minimal root `AGENTS.md` after the first successful phase:

```markdown
# DONNA Portal Instructions

- Read `.cursor/plans/donna-member-sales-portal.md` before coding.
- Do not upgrade framework major versions in this branch.
- Prefer npm.
- Protect all portal and admin routes.
- Use Clerk for authentication and roles.
- Use Supabase for persistence and storage.
- Keep the public landing page stable.
- Reuse the DONNA design system for portal components.
- Run available verification scripts at the end of each phase.
- Implement one phase at a time and stop.
```

## Definition of done

Cursor’s own best-practice guidance is right for this project: ask for plans, keep the scope tight, review carefully, and give the agent verifiable checks. Treat the list below as the release gate, not as a nice-to-have. citeturn25view0

The build is done only when all of the following are true:

1. The public landing page is still intact and the portal is linked cleanly from it.
2. Guests cannot access `/portal`, `/portal/can-donna`, or `/admin`.
3. A newly registered user becomes a `free_member` automatically and can access:
   - Can DONNA
   - member-safe documents
   - socials/video links
   - forum
4. A `partner` can:
   - edit their profile
   - see their promo code
   - see sales totals and recent attributed sales
   - submit a claim
   - see the round-robin/unclaimed-lead area
5. `staff` and `admin` can:
   - manage member roles
   - manage documents
   - moderate forum posts/replies
   - review claims
   - take over live chats
6. Portal documents are stored privately and do not resolve for unauthorized users.
7. The Can DONNA page returns a clear verdict and a next action, not vague chatbot copy.
8. Human handoff works when staff is available and degrades cleanly when unavailable.
9. Route protection, role checks, sale attribution, and round-robin logic all have tests.
10. The repo README explains local setup, environment variables, migration steps, seed steps, and the protected route map.

Use this environment checklist before deploy:

```text
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

If you are deploying from the `donna-facelift` line, make sure preview bypasses are off for production:

```text
FACELIFT_PREVIEW=false
AUTH_DISABLE_CLERK=false
```

If you are deploying from the `bemdonna` line, make sure the repo is no longer being treated as an auto-synced v0 output before you trust it as the source of truth for a protected portal. citeturn12view1turn24view1