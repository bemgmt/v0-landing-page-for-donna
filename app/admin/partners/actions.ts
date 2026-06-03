"use server"

import Stripe from "stripe"
import { getPortalSession } from "@/lib/portal/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export type GeneratePromoResult =
  | { success: true; promoCodeId: string }
  | { success: false; error: string }

export async function generatePromoCodeAction(formData: {
  partnerProfileId: string
  code: string
  discountType: "percentage" | "amount"
  discountValue: number
  duration: "once" | "forever" | "repeating"
  durationInMonths?: number
  notes?: string
}): Promise<GeneratePromoResult> {
  const session = await getPortalSession()
  if (!session || session.profile.role !== "admin") {
    return { success: false, error: "Unauthorized: Admins only." }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey?.trim()) {
    return { success: false, error: "Stripe secret key is not configured." }
  }

  const codeClean = formData.code.trim().toUpperCase()
  if (!codeClean) {
    return { success: false, error: "Promo code string is required." }
  }

  if (!formData.partnerProfileId) {
    return { success: false, error: "Salesperson (partner) is required." }
  }

  const stripe = new Stripe(secretKey)
  const admin = createAdminClient()

  // 1. Check if the code already exists in our database
  const { data: existingCode } = await admin
    .from("promo_codes")
    .select("id")
    .ilike("code", codeClean)
    .maybeSingle()

  if (existingCode) {
    return { success: false, error: `Promo code "${codeClean}" already exists in the database.` }
  }

  try {
    // 2. Create Coupon in Stripe
    const couponParams: Stripe.CouponCreateParams = {
      duration: formData.duration,
      name: `${codeClean} - Partner Discount`,
    }

    if (formData.duration === "repeating" && formData.durationInMonths) {
      couponParams.duration_in_months = formData.durationInMonths
    }

    if (formData.discountType === "percentage") {
      couponParams.percent_off = formData.discountValue
    } else {
      couponParams.amount_off = formData.discountValue // in cents, e.g. 1000 for $10
      couponParams.currency = "usd"
    }

    const coupon = await stripe.coupons.create(couponParams)

    // 3. Create Promotion Code in Stripe linked to Coupon
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: codeClean,
      active: true,
    })

    // 4. Insert into Supabase promo_codes table
    const { data: newRow, error: insertError } = await admin
      .from("promo_codes")
      .insert({
        partner_profile_id: formData.partnerProfileId,
        code: codeClean,
        share_slug: codeClean.toLowerCase(),
        status: "active",
        notes: formData.notes || null,
        stripe_promotion_code_id: promoCode.id,
        stripe_coupon_id: coupon.id,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("[generatePromoCodeAction] Supabase insert failed", insertError)
      // Cleanup Stripe promotion code if possible
      try {
        await stripe.promotionCodes.update(promoCode.id, { active: false })
      } catch (cleanupErr) {
        console.error("[generatePromoCodeAction] Cleanup failed", cleanupErr)
      }
      return { success: false, error: `Database insert failed: ${insertError.message}` }
    }

    revalidatePath("/admin/partners")
    return { success: true, promoCodeId: newRow.id }
  } catch (err) {
    console.error("[generatePromoCodeAction] Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to generate promo code"
    return { success: false, error: msg }
  }
}

export async function togglePromoCodeStatusAction(
  id: string,
  currentStatus: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getPortalSession()
  if (!session || session.profile.role !== "admin") {
    return { success: false, error: "Unauthorized: Admins only." }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey?.trim()) {
    return { success: false, error: "Stripe secret key is not configured." }
  }

  const stripe = new Stripe(secretKey)
  const admin = createAdminClient()

  const nextStatus = currentStatus === "active" ? "inactive" : "active"
  const activeParam = nextStatus === "active"

  try {
    // 1. Fetch stripe promo code ID
    const { data: row } = await admin
      .from("promo_codes")
      .select("stripe_promotion_code_id")
      .eq("id", id)
      .single()

    if (!row) {
      return { success: false, error: "Promo code not found." }
    }

    // 2. Update Stripe if stripe_promotion_code_id is present
    if (row.stripe_promotion_code_id) {
      await stripe.promotionCodes.update(row.stripe_promotion_code_id, {
        active: activeParam,
      })
    }

    // 3. Update DB
    const { error: updateError } = await admin
      .from("promo_codes")
      .update({ status: nextStatus })
      .eq("id", id)

    if (updateError) {
      throw updateError
    }

    revalidatePath("/admin/partners")
    return { success: true }
  } catch (err) {
    console.error("[togglePromoCodeStatusAction] Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to toggle status"
    return { success: false, error: msg }
  }
}
