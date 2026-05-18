import { NextResponse } from "next/server"
import { z } from "zod"
import { planDisplayLabel, primaryPlanKey, seatsAllowanceForPlanKey } from "@/lib/billing/plan-seats"
import { resolveActiveSeatInvitePlan } from "@/lib/billing/resolve-subscription-plan"
import { getPortalSession } from "@/lib/portal/session"
import { sendTeamSeatInvitation } from "@/lib/email/resend"

const putSchema = z.object({
  emails: z.union([z.string(), z.array(z.string())]),
})

function splitEmails(raw: string | string[]): string[] {
  const chunks = Array.isArray(raw) ? raw : raw.split(/[\r\n,;]+/)
  const out: string[] = []
  for (const c of chunks) {
    const t = c.trim().toLowerCase()
    if (t.length > 0) out.push(t)
  }
  return [...new Set(out)]
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { supabase, billing, user, seatAccess, profile } = session

  if (seatAccess) {
    const invited = await resolveActiveSeatInvitePlan(user.email ?? profile.email)
    return NextResponse.json({
      mode: "team_member" as const,
      invites: [],
      seatsAllowance: invited?.seatsAllowance ?? 0,
      planKey: invited?.planKey ?? "",
      planLabel: invited?.planLabel ?? "Team invitation",
    })
  }

  const active = billing?.status === "active" || billing?.status === "trialing"
  if (!billing?.stripe_subscription_id || !active) {
    return NextResponse.json({
      mode: "none" as const,
      invites: [],
      seatsAllowance: 0,
      planKey: "",
      planLabel: "",
    })
  }

  const { data: items } = await supabase
    .from("billing_subscription_items")
    .select("price_lookup_key, stripe_price_id")
    .eq("stripe_subscription_id", billing.stripe_subscription_id)
    .order("stripe_subscription_item_id", { ascending: true })
    .limit(1)

  const planKey = primaryPlanKey({
    price_lookup_key: billing.price_lookup_key ?? null,
    stripe_price_id: billing.stripe_price_id ?? null,
    items: items ?? [],
  })
  const seatsAllowance = seatsAllowanceForPlanKey(planKey)

  const { data: invites, error } = await supabase
    .from("billing_seat_invites")
    .select("email, created_at")
    .eq("purchaser_user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    mode: "purchaser" as const,
    invites: invites ?? [],
    seatsAllowance,
    planKey,
    planLabel: planDisplayLabel(planKey),
  })
}

export async function PUT(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.seatAccess) {
    return NextResponse.json({ error: "Only the subscription owner can edit seats." }, { status: 403 })
  }

  const { supabase, billing, user } = session
  const active = billing?.status === "active" || billing?.status === "trialing"
  if (!billing?.stripe_subscription_id || !active) {
    return NextResponse.json({ error: "No active subscription." }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const emails = splitEmails(parsed.data.emails)
  for (const e of emails) {
    if (!isValidEmail(e)) {
      return NextResponse.json({ error: `Invalid email: ${e}` }, { status: 400 })
    }
  }

  const { data: items } = await supabase
    .from("billing_subscription_items")
    .select("price_lookup_key, stripe_price_id")
    .eq("stripe_subscription_id", billing.stripe_subscription_id)
    .order("stripe_subscription_item_id", { ascending: true })
    .limit(1)

  const planKey = primaryPlanKey({
    price_lookup_key: billing.price_lookup_key ?? null,
    stripe_price_id: billing.stripe_price_id ?? null,
    items: items ?? [],
  })
  const seatsAllowance = seatsAllowanceForPlanKey(planKey)

  if (emails.length > seatsAllowance) {
    return NextResponse.json(
      {
        error: `You can add at most ${seatsAllowance} email(s) on your plan (${planKey || "current"}).`,
      },
      { status: 400 },
    )
  }

  // Retrieve existing invites before deletion to identify newly added teammates
  const { data: oldInvites } = await supabase
    .from("billing_seat_invites")
    .select("email")
    .eq("purchaser_user_id", user.id)

  const oldInviteSet = new Set((oldInvites ?? []).map((row) => row.email.trim().toLowerCase()))

  const { error: delErr } = await supabase.from("billing_seat_invites").delete().eq("purchaser_user_id", user.id)
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 })
  }

  if (emails.length > 0) {
    const rows = emails.map((email) => ({ purchaser_user_id: user.id, email }))
    const { error: insErr } = await supabase.from("billing_seat_invites").insert(rows)
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 })
    }
  }

  // Identify emails that were newly added in this request
  const newlyInvitedEmails = emails.filter((email) => !oldInviteSet.has(email.trim().toLowerCase()))
  const planLabel = planDisplayLabel(planKey)
  const purchaserEmail = user.email ?? session.profile?.email ?? "your teammate"

  if (newlyInvitedEmails.length > 0) {
    for (const newEmail of newlyInvitedEmails) {
      try {
        console.log(`[seats] Sending team seat invitation to ${newEmail} from ${purchaserEmail}`)
        await sendTeamSeatInvitation({
          inviteeEmail: newEmail,
          purchaserEmail,
          planLabel,
        })
        console.log(`[seats] Sent seat invite successfully to ${newEmail}`)
      } catch (inviteErr) {
        console.error(`[seats] Failed to send team seat invite to ${newEmail}:`, inviteErr)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    invites: emails.map((email) => ({ email, created_at: null })),
    seatsAllowance,
    planKey,
    planLabel,
  })
}
