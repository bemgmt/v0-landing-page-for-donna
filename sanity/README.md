# Sanity content (optional)

Create a Sanity project and set:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET` (default `production`)
- `NEXT_PUBLIC_SANITY_API_VERSION` (optional, default `2024-01-01`)

Recommended document types (create in Sanity Studio):

1. **`siteSettings`** singleton `_id: siteSettings` — `siteName` (string).
2. **`portalCopy`** singleton `_id: portalCopy` — `portalNavLabel`, `portalHelpMarkdown` (text).

The app reads these via [`lib/sanity/client.ts`](../lib/sanity/client.ts). If env vars are unset, portal copy falls back to null and pages still render.
