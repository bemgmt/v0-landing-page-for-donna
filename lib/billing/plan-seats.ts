/** Stripe Price.lookup_key values (set in Dashboard on each recurring price). */
export const STRIPE_PRICE_LOOKUP_CORE = "core_cloud_workspace_500" as const
export const STRIPE_PRICE_LOOKUP_FULL = "full_toolkit_1000" as const

export type BillingPlanLookupKey =
  | typeof STRIPE_PRICE_LOOKUP_CORE
  | typeof STRIPE_PRICE_LOOKUP_FULL

/** Included seats per product (not Stripe line-item quantity). */
export function seatsAllowanceForPlanKey(planKey: string | null | undefined): number {
  const k = (planKey ?? "").trim()
  if (k === STRIPE_PRICE_LOOKUP_CORE) return 2
  if (k === STRIPE_PRICE_LOOKUP_FULL) return 6
  return 1
}

/** Human-readable plan for portal UI (lookup_key is the stable identifier). */
export function planDisplayLabel(planKey: string | null | undefined): string {
  const k = (planKey ?? "").trim()
  if (k === STRIPE_PRICE_LOOKUP_CORE) return "DONNA Early Adopter (Core)"
  if (k === STRIPE_PRICE_LOOKUP_FULL) return "DONNA Early Adopter (Full Access)"
  if (k.startsWith("price_")) return "Current plan (Stripe)"
  if (k.length > 0) return "Current plan"
  return "—"
}

/** Compact label for dashboard cards (e.g. Active · Core). */
export function planShortLabel(planKey: string | null | undefined): string {
  const k = (planKey ?? "").trim()
  if (k === STRIPE_PRICE_LOOKUP_CORE) return "Core"
  if (k === STRIPE_PRICE_LOOKUP_FULL) return "Full Access"
  return ""
}

/**
 * Primary plan key from synced subscription row + first line item (matches billing_status_view.plan).
 */
export function primaryPlanKey(row: {
  price_lookup_key: string | null
  stripe_price_id: string | null
  items?: { price_lookup_key: string | null; stripe_price_id: string | null }[] | null
}): string {
  const first = row.items?.[0]
  if (first) {
    return first.price_lookup_key?.trim() || first.stripe_price_id?.trim() || ""
  }
  return row.price_lookup_key?.trim() || row.stripe_price_id?.trim() || ""
}
