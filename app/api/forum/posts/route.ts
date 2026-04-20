import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"
import { slugifySegment } from "@/lib/string/slug"

const postSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  body_md: z.string().max(20000).default(""),
})

export async function GET(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const categoryId = url.searchParams.get("category_id")

  let q = session.supabase
    .from("forum_posts")
    .select("id, slug, title, created_at, category_id, is_pinned, author_profile_id")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  if (categoryId) {
    q = q.eq("category_id", categoryId)
  }

  const { data, error } = await q.limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const slug = slugifySegment(parsed.data.title)

  const { data, error } = await session.supabase
    .from("forum_posts")
    .insert({
      category_id: parsed.data.category_id,
      author_profile_id: session.profile.id,
      slug,
      title: parsed.data.title,
      body_md: parsed.data.body_md,
      status: "published",
    })
    .select("id, slug")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ post: data })
}
