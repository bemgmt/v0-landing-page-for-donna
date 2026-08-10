/** Donna app host; override with NEXT_PUBLIC_DONNA_APP_URL in env (no trailing slash). */
export const DONNA_APP_URL = (process.env.NEXT_PUBLIC_DONNA_APP_URL?.trim() || "https://app.bemdonna.com").replace(
  /\/$/,
  "",
)

/** App sign-in entry that immediately starts the shared Cognito Hosted UI flow (silent SSO from the portal). */
export const DONNA_APP_HANDOFF_URL = `${DONNA_APP_URL}/sign-in?sso=portal`
