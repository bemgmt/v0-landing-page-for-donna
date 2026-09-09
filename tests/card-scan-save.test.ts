import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), insert: vi.fn(), send: vi.fn(),
}))
vi.mock("@/lib/card-scanner/require-admin", () => ({ requireAdmin: mocks.auth }))
vi.mock("@/lib/card-scanner/extract-card", () => ({ CARD_SCAN_MODEL: "test" }))
vi.mock("@/lib/email/send-card-scan-alert", () => ({ sendCardScanAlert: mocks.send }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert: mocks.insert }) }),
}))
import { POST } from "@/app/api/card-scanner/save/route"

const request = () => new Request("https://example.com/api/card-scanner/save", {
  method: "POST",
  body: JSON.stringify({
    lead: { full_name: "Test Lead", company: "Example", job_title: "Owner",
      email: "test@example.com", phone: "555", website: "example.com" },
    notes: "Follow up tomorrow", event_tag: "Conference",
  }),
})

describe("card save email workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ profile: { id: "admin-id" } })
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({
      data: { id: "saved-id" }, error: null,
    }) }) })
    mocks.send.mockResolvedValue(true)
  })
  it("emails automatically after saving the reviewed details", async () => {
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ id: "saved-id", email_sent: true })
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ notes: "Follow up tomorrow", scanned_by: "admin-id" }))
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ leadId: "saved-id", email: "test@example.com", notes: "Follow up tomorrow" }))
  })
  it("preserves the saved lead and reports email failure for retry", async () => {
    mocks.send.mockResolvedValue(false)
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true, id: "saved-id", email_sent: false })
  })
  it("does not save or send without an administrator session", async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await POST(request())).status).toBe(403)
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it("does not email when persistence fails", async () => {
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: null, error: new Error("Database unavailable") }) }) })
    expect((await POST(request())).status).toBe(500)
    expect(mocks.send).not.toHaveBeenCalled()
  })
})
