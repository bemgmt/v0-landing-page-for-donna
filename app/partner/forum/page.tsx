import Link from "next/link"
import ForumNewPost from "@/components/portal/forum-new-post"
import { getPortalSession } from "@/lib/portal/session"

export default async function ForumIndexPage() {
  const session = await getPortalSession()
  if (!session) return null

  const [{ data: categories }, { data: posts }] = await Promise.all([
    session.supabase.from("forum_categories").select("id, slug, title").eq("is_active", true),
    session.supabase
      .from("forum_posts")
      .select("id, slug, title, created_at, category_id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(40),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Forum</h1>
        <p className="text-sm text-muted-foreground mt-1">Ideas and sales questions.</p>
      </div>

      <ForumNewPost categories={categories ?? []} />

      <ul className="space-y-2">
        {(posts ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/portal/forum/${p.slug}`} className="block rounded-lg border border-white/10 px-4 py-3 hover:border-cyan-400/30">
              <span className="font-medium">{p.title}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(p.created_at).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {(posts ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No threads yet — start one above.</p>
      ) : null}
    </div>
  )
}
