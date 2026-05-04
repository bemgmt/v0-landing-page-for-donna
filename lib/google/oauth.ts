import "server-only"

/**
 * Google OAuth 2.0 token management.
 *
 * Handles two separate Google accounts:
 * - GSC account (derek@bem.studio): Search Console + BigQuery
 * - Primary account (djtalbird@gmail.com): Flow + NotebookLM
 *
 * Each account gets its own OAuth client credentials and refresh token.
 * Access tokens are cached in-memory with a 50-minute TTL (tokens expire at 60 min).
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const TOKEN_TTL_MS = 50 * 60 * 1000 // 50 minutes

type TokenCache = {
  accessToken: string
  expiresAt: number
}

const cache: Record<string, TokenCache> = {}

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  cacheKey: string,
): Promise<string> {
  const cached = cache[cacheKey]
  if (cached && Date.now() < cached.expiresAt) {
    return cached.accessToken
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OAuth token refresh failed (${cacheKey}): ${res.status} ${body}`)
  }

  const json = (await res.json()) as { access_token: string; expires_in?: number }

  cache[cacheKey] = {
    accessToken: json.access_token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }

  return json.access_token
}

/**
 * Get an access token for the GSC account (derek@bem.studio).
 * Used for Search Console API and BigQuery queries.
 */
export async function getGscToken(): Promise<string> {
  const clientId = process.env.GSC_OAUTH_CLIENT_ID
  const clientSecret = process.env.GSC_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GSC_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GSC OAuth credentials (GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET, GSC_REFRESH_TOKEN)")
  }

  return refreshAccessToken(clientId, clientSecret, refreshToken, "gsc")
}

/**
 * Get an access token for the primary account (djtalbird@gmail.com).
 * Used for Google Flow and other primary-account services.
 */
export async function getFlowToken(): Promise<string> {
  const clientId = process.env.GOOGLE_FLOW_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_FLOW_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_FLOW_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Flow OAuth credentials (GOOGLE_FLOW_OAUTH_CLIENT_ID, GOOGLE_FLOW_OAUTH_CLIENT_SECRET, GOOGLE_FLOW_REFRESH_TOKEN)",
    )
  }

  return refreshAccessToken(clientId, clientSecret, refreshToken, "flow")
}
