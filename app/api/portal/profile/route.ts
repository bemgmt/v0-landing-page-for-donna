import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"

const bodySchema = z.object({
  display_name: z.string().max(200).optional().nullable(),
  company_name: z.string().max(200).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website_url: z.string().max(500).optional().nullable(),
})

export async function PATCH(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { supabase, profile } = session
  const updates: Record<string, unknown> = {
    ...parsed.data,
    email: session.user.email ?? profile.email,
  }

  const { data, error } = await supabase
    .from("member_profiles")
    .update(updates)
    .eq("id", profile.id)
    .select("*")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ profile: data })
}
