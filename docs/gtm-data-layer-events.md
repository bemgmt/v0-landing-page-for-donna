# GTM `dataLayer` events (marketing site)

Configure Google Tag Manager to listen for **Custom Event** names below and forward to GA4 (or other tags) as needed. Events are pushed from `lib/data-layer.ts` via `pushDataLayer()`.

| Event name | When | Suggested parameters |
|------------|------|----------------------|
| `pricing_cta_click` | User clicks a primary pricing CTA (hero, header, final CTA) | `placement` (e.g. `hero_primary`, `header`, `final_cta`) |
| `schedule_demo_click` | User clicks to scroll to / book discovery (`pricing_questions`, `cta_footer`) | `placement` |
| `sign_up_click` | Pilot / early-adopter style CTAs | `placement` (e.g. `cta_footer_pilot`, `early_adopter_section`) |
| `contact_submit` | Discovery form submit started | `form_type`: `discovery` |
| `generate_lead` | Discovery form submitted successfully | `form_type`, `method`: `demo_form` |
| `chatbot_open` | Chat widget opened | — |
| `chatbot_submit` | Chat message sent and assistant reply received | `chat_id` |
| `outbound_click` | External link (explore section, footer email) | `link_url`, `link_text` |

**Setup notes**

- Set `NEXT_PUBLIC_GTM_ID` in Vercel (and locally in `.env.local`) so `GoogleTagManager` loads in `app/layout.tsx`.
- Prefer **one** GA4 path: GA4 configured inside GTM, not a second hardcoded `gtag.js` unless intentional.
- `@vercel/analytics` `track()` calls remain for Vercel Analytics; they do not replace GTM.

**Post-deploy checks**

- GTM Preview: confirm container loads once, events appear when exercising CTAs and the form.
- GA4 Realtime: confirm events after mapping them in GTM.
