import { createAdminClient } from "@/lib/supabase/admin"
import PromoCodeForm from "@/components/admin/promo-code-form"
import PromoCodesList from "@/components/admin/promo-codes-list"

export const dynamic = "force-dynamic"

export default async function AdminPartnersPage() {
  const admin = createAdminClient()

  // 1. Fetch all partners
  const { data: partners } = await admin
    .from("member_profiles")
    .select("id, email, display_name")
    .eq("role", "partner")
    .eq("is_active", true)

  // 2. Fetch all promo codes
  const { data: promoCodes } = await admin
    .from("promo_codes")
    .select(`
      id,
      code,
      share_slug,
      status,
      notes,
      created_at,
      stripe_promotion_code_id,
      stripe_coupon_id,
      partner:partner_profile_id(id, display_name, email)
    `)
    .order("created_at", { ascending: false })

  const partnersList = partners ?? []
  const promoCodesList = (promoCodes ?? []) as any[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Partners & Sales Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate Stripe-backed promo codes, assign them to partners (salespeople), and manage active referrals.
        </p>
      </div>

      <PromoCodeForm partners={partnersList} />

      <PromoCodesList promoCodes={promoCodesList} />
    </div>
  )
}

