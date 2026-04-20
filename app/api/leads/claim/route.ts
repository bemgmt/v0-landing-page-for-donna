import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"
import { hasPartnerCapabilities } from "@/lib/auth/roles"

const bodySchema = z.object({
  evidence_notes: z.string().min(3).max(8000),
  sale_id: z.string().uuid().optional().nullable(),
})

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasPartnerCapabilities(session.profile.role, session.subscriptionActive)) {
    return NextResponse.json({ error: "Partner access required" }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await session.supabase
    .from("sale_claims")
    .insert({
      sale_id: parsed.data.sale_id ?? null,
      claimant_profile_id: session.profile.id,
      evidence_notes: parsed.data.evidence_notes,
      status: "pending",
    })
    .select("id")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ claim: data })
}
