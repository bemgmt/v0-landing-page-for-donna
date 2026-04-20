import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"

const replySchema = z.object({
  post_id: z.string().uuid(),
  body_md: z.string().min(1).max(20000),
})

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = replySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"

  const { data, error } = await session.supabase
    .from("forum_replies")
    .insert({
      post_id: parsed.data.post_id,
      author_profile_id: session.profile.id,
      body_md: parsed.data.body_md,
      is_staff_answer: isStaff,
    })
    .select("id")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ reply: data })
}
