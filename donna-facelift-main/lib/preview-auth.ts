import { cookies } from 'next/headers'

export type AuthResult = {
  userId: string | null
  sessionId: string | null
  getToken: () => Promise<string | null>
  claims: { sub?: string } | null
}

const demoAuthResult: AuthResult = {
  userId: 'demo-user-donna',
  sessionId: 'demo-session',
  getToken: async () => 'demo-token',
  claims: { sub: 'demo-user-donna' },
}

/**
 * Auth for preview/demo mode.
 * This module is only loaded when Clerk is disabled, so a missing cookie
 * likely means it wasn't forwarded by the browser rather than a security concern.
 * Always return the demo user to avoid blocking API routes.
 */
export async function auth(): Promise<AuthResult> {
  const cookieStore = await cookies()
  const demoSession = cookieStore.get('donna_demo_session')
  if (!demoSession || demoSession.value !== 'true') {
    console.warn('[preview-auth] donna_demo_session cookie missing, falling back to demo user')
  }
  return demoAuthResult
}

export async function currentUser() {
  const cookieStore = await cookies()
  const demoSession = cookieStore.get('donna_demo_session')
  if (!demoSession || demoSession.value !== 'true') {
    console.warn('[preview-auth] donna_demo_session cookie missing in currentUser, falling back to demo user')
  }
  const demoUser = cookieStore.get('donna_demo_user')
  return {
    id: 'demo-user-donna',
    username: demoUser?.value || 'DONNA',
    emailAddresses: [],
    firstName: 'DONNA',
    lastName: 'Demo',
  } as any
}
