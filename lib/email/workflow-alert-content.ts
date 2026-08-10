export const WORKFLOW_NOTIFICATION_RECIPIENT = "derek@aidonna.co"
export const CARD_SCAN_WORKFLOW_SUBJECT = "New card scanned"
export const TRIAL_STARTED_WORKFLOW_SUBJECT = "New trial started"

export type CardScanWorkflowPayload = {
  leadId: string
  fullName: string | null
  company: string | null
  jobTitle: string | null
  email: string | null
  phone: string | null
  website: string | null
  eventOrLocation: string | null
  notes: string | null
}

export type TrialStartedWorkflowPayload = {
  email: string
  cognitoUserSub: string | null
  userConfirmed: boolean
  startedAt: string
}

export function escapeEmailHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function displayValue(value: string | null | undefined): string {
  const normalized = value?.trim()
  return normalized
    ? escapeEmailHtml(normalized).replace(/\r?\n/g, "<br>")
    : "&mdash;"
}

function dataRow(label: string, value: string | null | undefined): string {
  return `
    <div class="data-row">
      <p class="data-label">${escapeEmailHtml(label)}</p>
      <p class="data-value">${displayValue(value)}</p>
    </div>`
}

export function buildCardScanWorkflowBody(payload: CardScanWorkflowPayload): string {
  return `
    <p class="text-paragraph">A new business card has been scanned and is ready for the contact workflow.</p>
    <div class="data-table-card">
      ${dataRow("Full Name", payload.fullName)}
      ${dataRow("Company", payload.company)}
      ${dataRow("Job Title", payload.jobTitle)}
      ${dataRow("Email", payload.email)}
      ${dataRow("Phone", payload.phone)}
      ${dataRow("Website", payload.website)}
      ${dataRow("Event / Location", payload.eventOrLocation)}
      ${dataRow("Notes / Conversation Topics", payload.notes)}
      ${dataRow("Lead ID", payload.leadId)}
    </div>`
}

export function buildTrialStartedWorkflowBody(payload: TrialStartedWorkflowPayload): string {
  return `
    <p class="text-paragraph">A new user has created a DONNA account and started a free trial.</p>
    <div class="data-table-card">
      ${dataRow("Email", payload.email)}
      ${dataRow("Cognito User ID", payload.cognitoUserSub)}
      ${dataRow("Email Confirmed", payload.userConfirmed ? "Yes" : "No")}
      ${dataRow("Trial Started At", payload.startedAt)}
    </div>`
}
