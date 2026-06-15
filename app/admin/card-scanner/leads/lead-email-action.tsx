"use client"

import { EmailLeadButton } from "@/components/card-scanner/email-lead-button"

type Props = {
  leadId: string
}

export function LeadEmailAction({ leadId }: Props) {
  return <EmailLeadButton leadId={leadId} />
}
