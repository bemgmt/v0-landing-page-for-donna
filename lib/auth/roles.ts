export type MemberRole = "free_member" | "partner" | "staff" | "admin"

const rank: Record<MemberRole, number> = {
  free_member: 1,
  partner: 2,
  staff: 3,
  admin: 4,
}

export function isRole(value: unknown): value is MemberRole {
  return (
    value === "free_member" ||
    value === "partner" ||
    value === "staff" ||
    value === "admin"
  )
}

export function roleAtLeast(role: MemberRole, minimum: MemberRole): boolean {
  return rank[role] >= rank[minimum]
}

export function canAccessPortalSection(
  role: MemberRole,
  section:
    | "profile"
    | "can_donna"
    | "content"
    | "socials"
    | "forum"
    | "sales"
    | "promo"
    | "leads_claim"
    | "leads_rr"
    | "admin",
): boolean {
  switch (section) {
    case "profile":
    case "can_donna":
    case "content":
    case "socials":
    case "forum":
      return roleAtLeast(role, "free_member")
    case "sales":
    case "promo":
    case "leads_claim":
    case "leads_rr":
      return roleAtLeast(role, "partner")
    case "admin":
      return role === "staff" || role === "admin"
    default:
      return false
  }
}

/** Partner UX: paid subscription (Stripe) or explicit partner/staff/admin role. */
export function hasPartnerCapabilities(
  role: MemberRole,
  subscriptionActive: boolean,
): boolean {
  if (role === "staff" || role === "admin") return true
  if (role === "partner") return true
  return subscriptionActive
}
