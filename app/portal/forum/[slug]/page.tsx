import Link from "next/link"
import { notFound } from "next/navigation"
import ForumReplyForm from "@/components/portal/forum-reply-form"
import { getPortalSession } from "@/lib/portal/session"

export default async function ForumPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getPortalSession()
  if (!session) return null

  const { data: post } = await session.supabase
    .from("forum_posts")
    .select("id, title, body_md, created_at, author_profile_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (!post) notFound()

  const { data: replies } = await session.supabase
    .from("forum_replies")
    .select("id, body_md, created_at, is_staff_answer, author_profile_id")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-8">
      <Link href="/portal/forum" className="text-sm text-cyan-300 hover:underline">
        ← Back to forum
      </Link>
      <article className="space-y-4">
        <h1 className="text-2xl font-semibold">{post.title}</h1>
        <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">{post.body_md}</div>
      </article>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Replies</h2>
        <ul className="space-y-3">
          {(replies ?? []).map((r) => (
            <li
              key={r.id}
              className={`rounded-lg border px-4 py-3 text-sm whitespace-pre-wrap ${
                r.is_staff_answer ? "border-cyan-400/40 bg-cyan-400/5" : "border-white/10"
              }`}
            >
              {r.body_md}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(r.created_at).toLocaleString()}
                {r.is_staff_answer ? " · Staff" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <ForumReplyForm postId={post.id} />
    </div>
  )
}
