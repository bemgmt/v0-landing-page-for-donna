import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"

const patchSchema = z.object({
  availability: z.enum(["online", "away", "offline"]),
})

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data } = await session.supabase
    .from("staff_presence")
    .select("availability, updated_at")
    .eq("profile_id", session.profile.id)
    .maybeSingle()

  return NextResponse.json({
    availability: data?.availability ?? "offline",
    updated_at: data?.updated_at ?? null,
  })
}

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await session.supabase.from("staff_presence").upsert(
    {
      profile_id: session.profile.id,
      availability: parsed.data.availability,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
