import { describe, expect, it } from "vitest"
import {
  buildCardScanWorkflowBody,
  buildTrialStartedWorkflowBody,
  CARD_SCAN_WORKFLOW_SUBJECT,
  TRIAL_STARTED_WORKFLOW_SUBJECT,
  WORKFLOW_NOTIFICATION_RECIPIENT,
} from "@/lib/email/workflow-alert-content"

describe("workflow email alerts", () => {
  it("uses the exact recipient and subjects required by the automations", () => {
    expect(WORKFLOW_NOTIFICATION_RECIPIENT).toBe("derek@aidonna.co")
    expect(CARD_SCAN_WORKFLOW_SUBJECT).toBe("New card scanned")
    expect(TRIAL_STARTED_WORKFLOW_SUBJECT).toBe("New trial started")
  })

  it("includes every card field and safely escapes personal notes", () => {
    const html = buildCardScanWorkflowBody({
      leadId: "lead-123",
      fullName: "Jane Doe",
      company: "Acme & Co",
      jobTitle: "Principal",
      email: "jane@example.com",
      phone: "+1 555 555 1212",
      website: "https://example.com",
      eventOrLocation: "CRE Summit — Los Angeles",
      notes: "Discussed <industrial> deals\nFollow up Tuesday",
    })

    for (const value of [
      "Jane Doe",
      "Acme &amp; Co",
      "Principal",
      "jane@example.com",
      "+1 555 555 1212",
      "https://example.com",
      "CRE Summit — Los Angeles",
      "lead-123",
    ]) {
      expect(html).toContain(value)
    }
    expect(html).toContain("Discussed &lt;industrial&gt; deals<br>Follow up Tuesday")
    expect(html).not.toContain("Discussed <industrial>")
  })

  it("includes the new trial identity and timestamp", () => {
    const html = buildTrialStartedWorkflowBody({
      email: "trial@example.com",
      cognitoUserSub: "cognito-123",
      userConfirmed: false,
      startedAt: "2026-08-10T12:00:00.000Z",
    })

    expect(html).toContain("trial@example.com")
    expect(html).toContain("cognito-123")
    expect(html).toContain("2026-08-10T12:00:00.000Z")
    expect(html).toContain("Email Confirmed")
    expect(html).toContain("No")
  })
})
