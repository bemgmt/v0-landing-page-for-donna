# Landing page for DONNA

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/dereks-projects-64128cef/v0-landing-page-for-donna)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/vdYLbV4HDSb)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/dereks-projects-64128cef/v0-landing-page-for-donna](https://vercel.com/dereks-projects-64128cef/v0-landing-page-for-donna)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/vdYLbV4HDSb](https://v0.app/chat/vdYLbV4HDSb)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Member portal (Supabase + Stripe + optional Sanity)

This app includes a protected **member/partner portal** at `/portal` and **staff/admin** tools at `/admin`.

- **Auth & data:** Supabase Auth + Postgres + Storage (see `supabase/migrations/`). Apply migrations with the Supabase CLI or SQL editor.
- **Billing:** Stripe Checkout requires a signed-in user; webhook syncs subscription state to `billing_subscriptions` (`/api/webhooks/stripe`). Configure `STRIPE_WEBHOOK_SECRET` and point Stripe to your deployed URL.
- **CMS:** Optional Sanity project for editable portal copy (`lib/sanity/client.ts`). See `sanity/README.md`.
- **Env:** Copy `.env.example` and set `NEXT_PUBLIC_SUPABASE_*`, Stripe keys, and `NEXT_PUBLIC_SITE_URL` for return URLs.

Local scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`.

Promote the first staff or admin user in the Supabase SQL editor:  
`update member_profiles set role = 'admin' where email = 'you@company.com';`
