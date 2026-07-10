import { type NextAuthOptions } from "next-auth"
import CognitoProvider from "next-auth/providers/cognito"

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
    async jwt({ token, user, account, profile }) {
      if (profile) {
        token.sub = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Expose cognito_sub on the session object
        (session as any).cognito_sub = token.sub
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
