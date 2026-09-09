import "server-only"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isRole, type MemberRole } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"

export async function requirePortalRole(allowedRoles: readonly MemberRole[]) {
  const authSession = await getServerSession(authOptions)
  const cognitoSub = (
    authSession as (typeof authSession & { cognito_sub?: unknown }) | null
  )?.cognito_sub

  if (
    !authSession?.user?.email ||
    typeof cognitoSub !== "string" ||
    !cognitoSub.trim()
  ) {
    return null
  }

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from("member_profiles")
    .select("id, role, is_active")
    .eq("cognito_sub", cognitoSub)
    .maybeSingle()

  if (error) {
    console.error("[auth] portal role lookup failed", error)
    return null
  }

  if (
    !profile ||
    !profile.is_active ||
    !isRole(profile.role) ||
    !allowedRoles.includes(profile.role)
  ) {
    return null
  }

  return {
    user: {
      cognitoSub,
      email: authSession.user.email,
    },
    profile: {
      id: profile.id,
      role: profile.role,
    },
  }
}

export async function requireAdmin() {
  return requirePortalRole(["admin"])
}
