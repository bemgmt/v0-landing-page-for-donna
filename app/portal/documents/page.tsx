import Link from "next/link"
import { getPortalSession } from "@/lib/portal/session"

export default async function DocumentsPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { data: docs } = await session.supabase
    .from("documents")
    .select("id, title, description, category, min_role, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Downloads respect your membership level.</p>
      </div>
      <ul className="space-y-3">
        {(docs ?? []).map((d) => (
          <li
            key={d.id}
            className="rounded-xl border border-white/10 liquid-glass px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <p className="font-medium">{d.title}</p>
              {d.description ? <p className="text-sm text-muted-foreground">{d.description}</p> : null}
              <p className="text-xs text-muted-foreground mt-1">
                Category: {d.category} · Min role: {d.min_role}
              </p>
            </div>
            <Link
              href={`/api/portal/documents/${d.id}/download`}
              className="text-sm text-cyan-300 hover:underline shrink-0"
            >
              Download
            </Link>
          </li>
        ))}
      </ul>
      {(docs ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : null}
    </div>
  )
}
