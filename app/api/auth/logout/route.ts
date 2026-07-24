import { NextResponse } from "next/server"
import { getSiteUrl } from "@/lib/site-url"

const DEFAULT_COGNITO_DOMAIN = "https://donna-production.auth.us-east-1.amazoncognito.com"

// Clears the shared Cognito Hosted UI session after NextAuth sign-out so the
// portal and the Donna app (same hosted-UI domain) both end up signed out.
export async function GET() {
  const domain = (process.env.COGNITO_DOMAIN?.trim() || DEFAULT_COGNITO_DOMAIN).replace(/\/$/, "")
  const clientId = process.env.COGNITO_CLIENT_ID?.trim() ?? ""
  const logoutUri = getSiteUrl()

  const url = `${domain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`
  return NextResponse.redirect(url)
}
