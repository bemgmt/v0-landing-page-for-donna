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
      let finalUrl = baseUrl

      // Prevent staging/localhost/www leakage into production callback/redirects
      const isProd = process.env.NODE_ENV === "production"
      if (isProd) {
        // Enforce the clean production base URL, replacing www or staging if present
        const cleanBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || baseUrl
        if (url.startsWith("/")) {
          finalUrl = `${cleanBaseUrl}${url}`
        } else if (new URL(url).origin === cleanBaseUrl) {
          finalUrl = url
        } else {
          finalUrl = cleanBaseUrl
        }
      } else {
        // Dev behavior
        if (url.startsWith("/")) finalUrl = `${baseUrl}${url}`
        else if (new URL(url).origin === baseUrl) finalUrl = url
      }

      // strip trailing slash if it exists and isn't just the root
      if (finalUrl.length > 1 && finalUrl.endsWith("/")) {
        finalUrl = finalUrl.slice(0, -1)
      }

      return finalUrl
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
