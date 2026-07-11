import { type NextAuthOptions } from "next-auth"
import CognitoProvider from "next-auth/providers/cognito"
import { logAuthEvent } from "@/lib/auth/diagnostics"

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID || "",
      clientSecret: process.env.COGNITO_CLIENT_SECRET || "",
      issuer: process.env.COGNITO_ISSUER || "",
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Record login start or success/failure
      const isSuccess = !!user

      await logAuthEvent({
        event_name: isSuccess ? "cognito_callback_success" : "cognito_callback_failure",
        correlation_id: `cb-${Date.now()}`,
        environment: process.env.NODE_ENV || "development",
        is_success: isSuccess,
        cognito_client_id: process.env.COGNITO_CLIENT_ID,
        subject_hash: profile?.sub || user?.id,
      })
      return true
    },
    async redirect({ url, baseUrl }) {
      const cleanBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL || baseUrl).replace(/\/$/, "")

      // Relative path — just prepend the base
      if (url.startsWith("/")) {
        return `${cleanBaseUrl}${url}`
      }

      // Absolute URL — preserve the pathname but enforce our domain
      try {
        const parsed = new URL(url)
        if (parsed.origin === cleanBaseUrl) {
          // Same origin, pass through
          return url
        }
        // Different origin (e.g. Vercel deployment URL) — keep the path, fix the origin
        const corrected = `${cleanBaseUrl}${parsed.pathname}${parsed.search}`
        console.log("[auth] redirect origin corrected:", { from: parsed.origin, to: cleanBaseUrl, path: parsed.pathname })
        return corrected
      } catch {
        // Invalid URL — fall back to base
        return cleanBaseUrl
      }
    },
    async jwt({ token, user, account, profile }) {
      if (profile) {
        token.sub = profile.sub
        if (profile.email) {
          token.email = profile.email
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Expose cognito_sub on the session object
        (session as any).cognito_sub = token.sub
        if (token.email) {
          session.user.email = token.email as string
        }
      }

      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}
