import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function ensureReferralPromoCode(memberProfileId: string, email: string): Promise<any[]> {
  const admin = createAdminClient()

  // 1. Check if they already have one
  const { data: existing } = await admin
    .from("promo_codes")
    .select("*")
    .eq("partner_profile_id", memberProfileId)
    .eq("status", "active")
    
  if (existing && existing.length > 0) {
    return existing
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey?.trim()) {
    console.warn("[ensureReferralPromoCode] Stripe secret key missing")
    return []
  }
  
  const stripe = new Stripe(secretKey)
  
  // 2. Generate a random short code using their email prefix + random string
  const emailPrefix = email.split("@")[0].substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, "")
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase()
  const codeClean = `${emailPrefix}${randomSuffix}`

  try {
    // 3. Create Coupon in Stripe for 25% off for 1 month
    const couponParams: Stripe.CouponCreateParams = {
      duration: "repeating",
      duration_in_months: 1,
      percent_off: 25,
      name: `${codeClean} - Member Referral (25% off 1 month)`,
    }

    const coupon = await stripe.coupons.create(couponParams)

    // 4. Create Promotion Code in Stripe linked to Coupon
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: codeClean,
      active: true,
    })

    // 5. Insert into Supabase
    const { data: newRow, error } = await admin
      .from("promo_codes")
      .insert({
        partner_profile_id: memberProfileId,
        code: codeClean,
        share_slug: codeClean.toLowerCase(),
        status: "active",
        notes: "Auto-generated referral code",
        stripe_promotion_code_id: promoCode.id,
        stripe_coupon_id: coupon.id,
      })
      .select("*")
      .single()

    if (error || !newRow) {
      console.error("[ensureReferralPromoCode] Supabase insert failed", error)
      return []
    }
    
    return [newRow]
  } catch (err) {
    console.error("[ensureReferralPromoCode] Error generating code", err)
    return []
  }
}
