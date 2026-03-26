# DONNA Chatbot Setup Guide

## Overview

The landing page chat widget uses the **hosted DONNA Logic API** on `app.bemdonna.com` (same behavior as the batch embed). The UI lives in [`components/chatbot.tsx`](components/chatbot.tsx).

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_DONNA_WIDGET_TOKEN` | Yes | Widget token from **Chatbot Control → API tokens** |
| `NEXT_PUBLIC_DONNA_API_BASE` | No | Default `https://app.bemdonna.com` |
| `NEXT_PUBLIC_DONNA_USER_PROFILE` | No | Default `general` |
| `NEXT_PUBLIC_DONNA_GREETING` | No | First assistant message when the panel opens |

`NEXT_PUBLIC_*` values are exposed to the browser (same as any client-side embed). Rotate the token in Chatbot Control if it is ever leaked.

## Vercel

Project → Settings → Environment Variables: add the same `NEXT_PUBLIC_DONNA_*` keys for Production (and Preview if needed), then redeploy.

## Customization

Edit [`components/chatbot.tsx`](components/chatbot.tsx) for layout, colors, and the floating button. Logic and prompts are configured on the DONNA app side.

## Testing

```bash
npm run dev
```

Open the site and use the chat control in the bottom-right corner.

## Troubleshooting

- **“Missing widget token”**: Set `NEXT_PUBLIC_DONNA_WIDGET_TOKEN` and rebuild.
- **Network / CORS errors**: Ensure `app.bemdonna.com` allows your site’s origin for the Logic API.
- **Other errors**: Check the assistant message text from the API, or the browser Network tab for `POST .../api/v1/donna/logic`.

## Support

- Email: info@bemdonna.com
- Support: support@bemdonna.com
