type CognitoLogoutConfig = {
  domain: string
  clientId: string
  logoutUri: string
}

export function buildCognitoLogoutUrl({ domain, clientId, logoutUri }: CognitoLogoutConfig) {
  if (!domain.trim() || !clientId.trim()) {
    throw new Error("Cognito logout is not configured")
  }

  const origin = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`
  const logoutUrl = new URL("/logout", origin)
  logoutUrl.searchParams.set("client_id", clientId)
  logoutUrl.searchParams.set("logout_uri", logoutUri)
  return logoutUrl
}
