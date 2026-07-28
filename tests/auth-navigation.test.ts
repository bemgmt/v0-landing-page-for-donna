import { describe, expect, it } from "vitest"
import { buildCognitoLogoutUrl } from "@/lib/auth/cognito-logout"
import { portalReturnPath, safeReturnPath } from "@/lib/auth/return-path"

describe("safeReturnPath", () => {
  it("preserves local nested routes and query strings", () => {
    expect(safeReturnPath("/portal/profile?tab=security")).toBe("/portal/profile?tab=security")
  })

  it("rejects protocol-relative and backslash paths", () => {
    expect(safeReturnPath("//example.com/steal")).toBe("/portal")
    expect(safeReturnPath("/\\example.com/steal")).toBe("/portal")
  })
})

describe("portalReturnPath", () => {
  it("preserves portal destinations", () => {
    expect(portalReturnPath("/portal/profile")).toBe("/portal/profile")
  })

  it("does not accept another protected area as a portal destination", () => {
    expect(portalReturnPath("/admin")).toBe("/portal")
  })
})

describe("buildCognitoLogoutUrl", () => {
  it("creates a hosted logout URL with an exact post-logout destination", () => {
    const url = buildCognitoLogoutUrl({
      domain: "example.auth.us-east-1.amazoncognito.com",
      clientId: "client-123",
      logoutUri: "https://aidonna.co/",
    })

    expect(url.origin).toBe("https://example.auth.us-east-1.amazoncognito.com")
    expect(url.pathname).toBe("/logout")
    expect(url.searchParams.get("client_id")).toBe("client-123")
    expect(url.searchParams.get("logout_uri")).toBe("https://aidonna.co/")
  })
})
