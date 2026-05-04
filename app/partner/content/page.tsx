import Link from "next/link"
import { getPortalSession } from "@/lib/portal/session"

const NOTEBOOKLM_URL =
  "https://notebooklm.google.com/notebook/ef6a20e1-9bc3-402a-91f0-11f286c2c943"
const INVESTOR_DEMO_URL = "https://www.donna.business/"

export default async function ContentPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { data: docs } = await session.supabase
    .from("documents")
    .select("id, title, description, category, min_role, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Member downloads and links to explore DONNA further.
        </p>
      </div>

      <section className="rounded-xl border border-white/10 liquid-glass p-4 md:p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Explore DONNA</h2>
        <ul className="space-y-4">
          <li className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
            <div>
              <p className="font-medium">NotebookLM</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ask questions, review curated material, and listen to podcasts about DONNA.
              </p>
            </div>
            <a
              href={NOTEBOOKLM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-300 hover:underline shrink-0"
            >
              Open in NotebookLM (new tab)
            </a>
          </li>
          <li className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <p className="font-medium">Investor demo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Earlier prototype interface and the DONNA Intelligence Network on our demo site.
              </p>
            </div>
            <a
              href={INVESTOR_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-300 hover:underline shrink-0"
            >
              Visit donna.business (new tab)
            </a>
          </li>
        </ul>
      </section>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Downloads</h2>
        <p className="text-sm text-muted-foreground">Files respect your membership level.</p>
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
          <p className="text-sm text-muted-foreground">No downloadable files yet.</p>
        ) : null}
      </div>
    </div>
  )
}
