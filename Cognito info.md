Here's from me:

* Cognito region: `us-east-1`  
* Cognito user pool ID: `us-east-1_TolJXTHO0`  
* Cognito app client ID: `5lipli7frilfh2tcg2fgdc7ksk`  
* Cognito Hosted UI domain: [`https://donna-production.auth.us-east-1.amazoncognito.com`](https://donna-production.auth.us-east-1.amazoncognito.com/)  
* OAuth flow: authorization code flow  
* Required scopes: `openid`, `email`, `profile`  
* Supported provider: `COGNITO`  
* JWT issuer: [`https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TolJXTHO0`](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TolJXTHO0)  
* JWKS URL: [`https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TolJXTHO0/.well-known/jwks.json`](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TolJXTHO0/.well-known/jwks.json)  
* OIDC discovery URL: [`https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TolJXTHO0/.well-known/openid-configuration`](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TolJXTHO0/.well-known/openid-configuration)  
* Current Donna callback URL: [`https://app.bemdonna.com/api/v1/auth/callback`](https://app.bemdonna.com/api/v1/auth/callback)  
* Current Donna logout URL: [`https://app.bemdonna.com`](https://app.bemdonna.com/)  
* Current billing status endpoint: [`https://bjeqnokehrjviowntlng.supabase.co/functions/v1/billing-status`](https://bjeqnokehrjviowntlng.supabase.co/functions/v1/billing-status)  
* Auth header for billing status: `Authorization: Bearer <server-side token>`  
* Server token delivery: do not send in chat. We will place/rotate it through the deployment secret store.  
* Target billing lookup request body:

{  
  "cognito\_sub": "from\_verified\_cognito\_jwt\_sub",  
  "email": "from\_verified\_cognito\_jwt\_email",  
  "requested\_at": "ISO timestamp",  
  "contract\_version": "2026-07-08"  
}

* Checkout metadata requirements:

{  
  "cognito\_sub": "verified Cognito sub",  
  "email": "normalized verified email",  
  "billing\_account\_id": "internal billing account id if available"  
}

* Stripe webhook projection requirements:  
  * Verify webhook signature.  
  * Dedupe by Stripe event id.  
  * Resolve by `stripe_customer_id` first.  
  * Store/update subscription status, plan, period end, cancel flag, seat count, and entitlements.  
  * Link Stripe customer/subscription back to `cognito_sub`.  
  * Email fallback is migration-only.

DISCLAIMER:  
Cognito should only be identity. Stripe remains payment truth. Supabase can remain the billing database for this phase. You should add/link `cognito_sub` in the existing billing records. 

....  
What I'll need or need confirmed:

1\. Staging landing URL  
Proposed: [https://staging.aidonna.co](https://staging.aidonna.co/)  
If wrong: send the deployed staging URL where the landing/pricing/checkout flow will be tested.

2\. Production landing URL  
Proposed: [https://aidonna.co](https://aidonna.co/)  
If wrong: send the live customer-facing landing/pricing URL.

3\. Staging Cognito callback URL  
Proposed: [https://staging.aidonna.co/api/auth/callback/cognito](https://staging.aidonna.co/api/auth/callback/cognito)  
If wrong: send the route your auth library will use after Cognito redirects back. Look for callbackUrl, redirectUri, auth/callback, or OAuth callback config.

4\. Production Cognito callback URL  
Proposed: [https://aidonna.co/api/auth/callback/cognito](https://aidonna.co/api/auth/callback/cognito)  
If wrong: same as above, but production.

5\. Staging logout/return URL  
Proposed: [https://staging.aidonna.co](https://staging.aidonna.co/)  
If wrong: send the URL users should land on after Cognito logout in staging.

6\. Production logout/return URL  
Proposed: [https://aidonna.co](https://aidonna.co/)  
If wrong: send the URL users should land on after Cognito logout in production.

7\. Cognito UI mode  
Proposed: Cognito Hosted UI.  
If wrong: tell us if the site must keep custom sign-in/sign-up forms. Identity will still be Cognito either way.

8\. Supabase role  
Proposed: Supabase will be database/functions only, not identity.  
If wrong: check whether the site currently uses Supabase Auth methods like signUp, signInWithPassword, magic links, auth callbacks, or auth.users.

9\. Checkout function  
Proposed: create-checkout-session.  
If wrong: send the server route/function that will call stripe.checkout.sessions.create.

10\. Stripe webhook function  
Proposed: stripe-webhook.  
If wrong: send the route/function that will verify Stripe webhook signatures and handle checkout.session.completed, customer.subscription.updated, invoice.payment\_failed, etc.

11\. Email to Stripe customer mapping  
Proposed: billing\_accounts.email \+ billing\_accounts.stripe\_customer\_id.  
If wrong: send the table/columns where an email will be linked to a Stripe customer ID like cus\_....

12\. Subscription status  
Proposed: billing\_subscriptions.status, plan\_key, stripe\_subscription\_id, stripe\_customer\_id.  
If wrong: send the table/columns that will store active/past\_due/canceled/trialing and the Stripe subscription ID.

13\. Seats  
Proposed: billing\_subscriptions.seats\_purchased plus seat-holder emails in billing\_seats.email or billing\_accounts.seat\_emails.  
If wrong: send where the purchased seat count and added user emails will be stored.

14\. Add cognito\_sub  
Proposed: yes, add billing\_accounts.cognito\_sub with a unique index.  
If wrong: tell us which billing/customer account table should own Cognito sub instead. We need one durable unique mapping from Cognito sub to Stripe customer.

15\. Core $500 Stripe price ID  
Proposed product: prod\_UMBRkhYIl37Is2  
Need: the actual Stripe price ID, starts with price\_....  
If wrong: send the product/price used for the $500 Core plan.

16\. Full $1000 Stripe price ID  
Proposed product: prod\_UNVLc9soDBbtfH  
Need: the actual Stripe price ID, starts with price\_....  
If wrong: send the product/price used for the $1000 Full plan.  
