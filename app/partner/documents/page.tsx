import Link from "next/link"
import { PageHeader } from "@/components/portal/dashboard/page-header"
import { STRATEGIC_PARTNER_DOCS } from "@/lib/portal/strategic-partner-docs"
import { requirePartnerPortal } from "@/lib/portal/require-partner"

export default async function PartnerDocumentsPage() {
  const session = await requirePartnerPortal()
  const { data: docs } = await session.supabase
    .from("documents")
    .select("id, title, description, category, min_role, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const docList = docs ?? []
  const byCategory = new Map<string, (typeof docList)[number][]>()
  for (const d of docList) {
    const cat = d.category?.trim() || "General"
    const list = byCategory.get(cat) ?? []
    list.push(d)
    byCategory.set(cat, list)
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Library"
        title="Partner documents"
        subtitle="Sales enablement, policies, and downloadable assets. Strategic partner guides are versioned from the repo as Markdown downloads."
      />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sales and strategic partner pack
        </h2>
        <ul className="space-y-3">
          {STRATEGIC_PARTNER_DOCS.map((d) => (
            <li
              key={d.slug}
              className="rounded-xl border border-white/10 liquid-glass px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="font-medium text-foreground">{d.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
              </div>
              <a
                href={`/api/portal/strategic-partner-docs/${d.slug}`}
                className="text-sm text-cyan-300 hover:underline shrink-0 font-medium"
              >
                Download .md
              </a>
            </li>
          ))}
        </ul>
      </section>

      {docList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Portal file library
          </h2>
          <p className="text-sm text-muted-foreground">
            Additional files from the team (storage-backed). Access follows your role.
          </p>
          {[...byCategory.entries()].map(([category, rows]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-cyan-400/80">{category}</h3>
              <ul className="space-y-2">
                {rows.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-white/10 liquid-glass px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">{d.title}</p>
                      {d.description ? <p className="text-sm text-muted-foreground">{d.description}</p> : null}
                      <p className="text-xs text-muted-foreground mt-1">Min role: {d.min_role}</p>
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
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}
