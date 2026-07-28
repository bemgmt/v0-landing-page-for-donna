import { NextResponse, type NextRequest } from "next/server"
import { buildCognitoLogoutUrl } from "@/lib/auth/cognito-logout"

export function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || request.nextUrl.origin
  const logoutUri = new URL(siteUrl).origin

  try {
    const logoutUrl = buildCognitoLogoutUrl({
      domain: process.env.COGNITO_DOMAIN || "",
      clientId: process.env.COGNITO_CLIENT_ID || "",
      logoutUri,
    })
    return NextResponse.redirect(logoutUrl, 303)
  } catch (error) {
    console.error("[auth] Cognito logout redirect unavailable", error)
    return NextResponse.redirect(logoutUri, 303)
  }
}
