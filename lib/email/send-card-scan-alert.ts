import "server-only"

import { getGlassmorphicLayout, sendEmail } from "@/lib/email/resend"
import {
  buildCardScanWorkflowBody,
  CARD_SCAN_WORKFLOW_SUBJECT,
  type CardScanWorkflowPayload,
  WORKFLOW_NOTIFICATION_RECIPIENT,
} from "@/lib/email/workflow-alert-content"

export async function sendCardScanAlert(
  payload: CardScanWorkflowPayload,
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[card-scan-alert] Resend API key not configured")
    return false
  }

  try {
    await sendEmail({
      to: WORKFLOW_NOTIFICATION_RECIPIENT,
      subject: CARD_SCAN_WORKFLOW_SUBJECT,
      html: getGlassmorphicLayout({
        title: "New Card Scanned",
        preheader: "Business card workflow trigger",
        bodyHtml: buildCardScanWorkflowBody(payload),
      }),
      idempotencyKey: `card-scan-${payload.leadId}`,
    })
    return true
  } catch (error) {
    console.error("[card-scan-alert] Resend send failed", error)
    return false
  }
}
