import { describe, expect, it } from "vitest"
import { hasPartnerCapabilities, roleAtLeast } from "@/lib/auth/roles"

describe("roleAtLeast", () => {
  it("orders roles", () => {
    expect(roleAtLeast("partner", "free_member")).toBe(true)
    expect(roleAtLeast("free_member", "partner")).toBe(false)
    expect(roleAtLeast("admin", "staff")).toBe(true)
  })
})

describe("hasPartnerCapabilities", () => {
  it("grants partner role without subscription", () => {
    expect(hasPartnerCapabilities("partner", false)).toBe(true)
  })
  it("grants active subscription for free_member", () => {
    expect(hasPartnerCapabilities("free_member", true)).toBe(true)
  })
  it("denies without subscription", () => {
    expect(hasPartnerCapabilities("free_member", false)).toBe(false)
  })
})
