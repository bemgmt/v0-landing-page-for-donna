import SalesView from "@/components/portal/sales-view"
import { requirePartnerPortal } from "@/lib/portal/require-partner"

export default async function PartnerSalesPage() {
  const session = await requirePartnerPortal()
  return <SalesView supabase={session.supabase} partnerProfileId={session.profile.id} />
}
