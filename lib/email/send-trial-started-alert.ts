import "server-only"

import { getGlassmorphicLayout, sendEmail } from "@/lib/email/resend"
import {
  buildTrialStartedWorkflowBody,
  TRIAL_STARTED_WORKFLOW_SUBJECT,
  type TrialStartedWorkflowPayload,
  WORKFLOW_NOTIFICATION_RECIPIENT,
} from "@/lib/email/workflow-alert-content"

export async function sendTrialStartedAlert(
  payload: TrialStartedWorkflowPayload,
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[trial-started-alert] Resend API key not configured")
    return false
  }

  try {
    await sendEmail({
      to: WORKFLOW_NOTIFICATION_RECIPIENT,
      subject: TRIAL_STARTED_WORKFLOW_SUBJECT,
      html: getGlassmorphicLayout({
        title: "New Trial Started",
        preheader: "Free trial workflow trigger",
        bodyHtml: buildTrialStartedWorkflowBody(payload),
      }),
      reply_to: payload.email,
      idempotencyKey: `trial-started-${payload.cognitoUserSub ?? payload.email}`,
    })
    return true
  } catch (error) {
    console.error("[trial-started-alert] Resend send failed", error)
    return false
  }
}
