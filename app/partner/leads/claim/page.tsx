import LeadClaimForm from "@/components/portal/lead-claim-form"
import { PageHeader } from "@/components/portal/dashboard/page-header"
import { requirePartnerPortal } from "@/lib/portal/require-partner"

export default async function PartnerClaimSalePage() {
  await requirePartnerPortal()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leads"
        title="Claim a sale"
        subtitle="Manual attribution requests go to staff for approval."
      />
      <LeadClaimForm />
    </div>
  )
}
