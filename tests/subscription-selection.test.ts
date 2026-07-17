import { describe, expect, it } from "vitest"
import {
  isEntitledSubscriptionStatus,
  shouldProjectIncomingSubscription,
} from "@/lib/billing/subscription-selection"

describe("Stripe subscription projection selection", () => {
  it("projects a first active or trialing subscription", () => {
    expect(shouldProjectIncomingSubscription(null, { id: "sub_active", status: "active" })).toBe(true)
    expect(shouldProjectIncomingSubscription(null, { id: "sub_trial", status: "trialing" })).toBe(true)
    expect(shouldProjectIncomingSubscription(null, { id: "sub_canceled", status: "canceled" })).toBe(false)
  })

  it("always updates the currently projected subscription", () => {
    expect(
      shouldProjectIncomingSubscription(
        { id: "sub_same", status: "active" },
        { id: "sub_same", status: "canceled" },
      ),
    ).toBe(true)
  })

  it("does not let a different canceled subscription revoke active access", () => {
    expect(
      shouldProjectIncomingSubscription(
        { id: "sub_current", status: "active" },
        { id: "sub_old", status: "canceled" },
      ),
    ).toBe(false)
  })

  it("prefers active over trialing and keeps an existing equal-priority subscription", () => {
    expect(
      shouldProjectIncomingSubscription(
        { id: "sub_trial", status: "trialing" },
        { id: "sub_active", status: "active" },
      ),
    ).toBe(true)
    expect(
      shouldProjectIncomingSubscription(
        { id: "sub_active", status: "active" },
        { id: "sub_trial", status: "trialing" },
      ),
    ).toBe(false)
    expect(
      shouldProjectIncomingSubscription(
        { id: "sub_current", status: "active" },
        { id: "sub_duplicate", status: "active" },
      ),
    ).toBe(false)
  })

  it("recognizes only active and trialing as entitled", () => {
    expect(isEntitledSubscriptionStatus("active")).toBe(true)
    expect(isEntitledSubscriptionStatus("trialing")).toBe(true)
    expect(isEntitledSubscriptionStatus("past_due")).toBe(false)
    expect(isEntitledSubscriptionStatus("canceled")).toBe(false)
  })
})
