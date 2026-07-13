import { describe, expect, it } from "vitest"
import {
  primaryPlanKey,
  seatInviteCapacityForPlanKey,
  seatsAllowanceForPlanKey,
  STRIPE_PRICE_LOOKUP_CORE,
  STRIPE_PRICE_LOOKUP_FULL,
} from "@/lib/billing/plan-seats"

describe("billing plan seat entitlements", () => {
  it("counts the purchaser inside the included seat total", () => {
    expect(seatsAllowanceForPlanKey(STRIPE_PRICE_LOOKUP_CORE)).toBe(3)
    expect(seatInviteCapacityForPlanKey(STRIPE_PRICE_LOOKUP_CORE)).toBe(2)
    expect(seatsAllowanceForPlanKey(STRIPE_PRICE_LOOKUP_FULL)).toBe(6)
    expect(seatInviteCapacityForPlanKey(STRIPE_PRICE_LOOKUP_FULL)).toBe(5)
  })

  it("uses the synced Stripe item lookup key as the authoritative plan", () => {
    expect(
      primaryPlanKey({
        price_lookup_key: null,
        stripe_price_id: "price_fallback",
        items: [{ price_lookup_key: STRIPE_PRICE_LOOKUP_FULL, stripe_price_id: "price_full" }],
      }),
    ).toBe(STRIPE_PRICE_LOOKUP_FULL)
  })
})