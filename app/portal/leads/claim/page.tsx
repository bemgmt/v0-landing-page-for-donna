import LeadClaimForm from "@/components/portal/lead-claim-form"
import { requirePartnerPortal } from "@/lib/portal/require-partner"

export default async function ClaimSalePage() {
  await requirePartnerPortal()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Claim a sale</h1>
        <p className="text-sm text-muted-foreground mt-1">Manual attribution requests go to staff for approval.</p>
      </div>
      <LeadClaimForm />
    </div>
  )
}
