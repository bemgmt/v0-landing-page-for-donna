import { afterEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
const send = vi.hoisted(() => vi.fn())
vi.mock("@/lib/email/resend", () => ({ sendEmail: send, getGlassmorphicLayout: ({ bodyHtml }: { bodyHtml: string }) => bodyHtml }))
import { sendCardScanAlert } from "@/lib/email/send-card-scan-alert"

const payload = { leadId: "lead-1", fullName: "Test", company: null, jobTitle: null,
  email: null, phone: null, website: null, eventOrLocation: null, notes: null }

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
describe("card scan email delivery", () => {
  it("uses the same idempotency key when retrying a saved lead", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key")
    send.mockResolvedValue({ id: "message-1" })
    expect(await sendCardScanAlert(payload)).toBe(true)
    expect(await sendCardScanAlert(payload)).toBe(true)
    for (const [params] of send.mock.calls) {
      expect(params).toMatchObject({ to: "derek@aidonna.co", subject: "New card scanned", idempotencyKey: "card-scan-lead-1" })
      expect(params.signal).toBeInstanceOf(AbortSignal)
    }
  })
  it("reports provider failures without throwing away the saved lead", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key")
    send.mockRejectedValue(new Error("Provider unavailable"))
    expect(await sendCardScanAlert(payload)).toBe(false)
  })
  it("reports a missing email configuration without attempting delivery", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    expect(await sendCardScanAlert(payload)).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
})
