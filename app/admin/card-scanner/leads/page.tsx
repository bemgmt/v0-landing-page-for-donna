import Link from "next/link"
import { format } from "date-fns"
import { createAdminClient } from "@/lib/supabase/admin"
import { CreditCard, ArrowLeft } from "lucide-react"
import { LeadStatusEditor } from "./status-editor"
import { LeadEmailAction } from "./lead-email-action"

function profileLabel(
  p: { display_name: string | null; email: string | null } | undefined
): string {
  if (!p) return "—"
  return p.display_name?.trim() || p.email || "—"
}

export default async function CardScannerLeadsPage() {
  const supabase = createAdminClient()

  const [{ data: leads }, { data: shares }] = await Promise.all([
    supabase
      .from("business_card_leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("business_card_shares")
      .select(
        "id, lead_id, from_profile_id, to_profile_id, note, created_at"
      )
      .order("created_at", { ascending: false }),
  ])

  // Index shares by lead
  const shareList = shares ?? []
  const byLead = new Map<string, typeof shareList>()
  for (const s of shareList) {
    const arr = byLead.get(s.lead_id) ?? []
    arr.push(s)
    byLead.set(s.lead_id, arr)
  }

  // Gather profile IDs for lookup
  const profileIds = new Set<string>()
  for (const l of leads ?? []) {
    if (l.scanned_by) profileIds.add(l.scanned_by)
  }
  for (const s of shareList) {
    profileIds.add(s.from_profile_id)
    profileIds.add(s.to_profile_id)
  }
  const ids = [...profileIds]
  const { data: profiles } =
    ids.length > 0
      ? await supabase
          .from("member_profiles")
          .select("id, display_name, email")
          .in("id", ids)
      : {
          data: [] as {
            id: string
            display_name: string | null
            email: string | null
          }[],
        }

  const profileById = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  )

  const statusColors: Record<string, string> = {
    new: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    contacted: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    qualified: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    closed: "text-muted-foreground border-white/10 bg-white/5",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="size-6 text-cyan-400" />
            <h1 className="text-2xl font-semibold gradient-text">
              Card Leads
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            All scanned business cards, who saved each lead, and member shares.
          </p>
        </div>
        <Link
          href="/admin/card-scanner"
          className="shrink-0 flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Scanner
        </Link>
      </div>

      <div className="space-y-4">
        {leads?.map((lead) => {
          const refs = [...(byLead.get(lead.id) ?? [])].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          const scanner = lead.scanned_by
            ? profileById[lead.scanned_by]
            : undefined
          return (
            <div
              key={lead.id}
              className="rounded-xl border border-white/10 liquid-glass p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-lg">
                    {lead.full_name || "Unknown name"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {[lead.company, lead.job_title].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.primary_email || "—"}
                    {lead.phone ? ` · ${lead.phone}` : ""}
                  </p>
                  {lead.website ? (
                    <p className="text-sm text-cyan-400/70 mt-0.5">
                      {lead.website}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium uppercase tracking-wider ${statusColors[lead.status] || statusColors.new}`}
                  >
                    {lead.status}
                  </span>
                  <LeadStatusEditor
                    leadId={lead.id}
                    currentStatus={lead.status}
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                <p>
                  {format(
                    new Date(lead.created_at),
                    "MMMM d, yyyy 'at' h:mm a"
                  )}
                  {lead.event_tag ? ` · ${lead.event_tag}` : ""}
                </p>
                <p>
                  <span className="text-foreground/80 font-medium">
                    Scanned by:{" "}
                  </span>
                  {lead.scanned_by
                    ? profileLabel(scanner)
                    : "Not attributed"}
                </p>
                <p>
                  <span className="text-foreground/80 font-medium">
                    Shares:{" "}
                  </span>
                  {refs.length}
                </p>
              </div>

              {/* Email action */}
              <div className="mb-3">
                <LeadEmailAction leadId={lead.id} />
              </div>

              {/* Share log */}
              {refs.length > 0 ? (
                <details className="text-sm border-t border-white/5 pt-3 mt-2">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                    Share log ({refs.length})
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {refs.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs sm:text-sm"
                      >
                        <p>
                          <span className="text-muted-foreground">To: </span>
                          {profileLabel(profileById[r.to_profile_id])}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            From:{" "}
                          </span>
                          {profileLabel(profileById[r.from_profile_id])}
                        </p>
                        <p className="text-muted-foreground">
                          {format(
                            new Date(r.created_at),
                            "MMM d, yyyy h:mm a"
                          )}
                        </p>
                        {r.note ? (
                          <p className="text-foreground mt-1 whitespace-pre-wrap border-l-2 border-cyan-500/30 pl-2">
                            {r.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {/* OCR markdown */}
              {lead.ocr_markdown ? (
                <details className="text-sm mt-3">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    OCR markdown
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-white/[0.03] border border-white/5 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
                    {lead.ocr_markdown}
                  </pre>
                </details>
              ) : null}
            </div>
          )
        })}

        {(!leads || leads.length === 0) && (
          <div className="text-center py-16 rounded-xl border border-white/10 liquid-glass">
            <CreditCard className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No card leads yet.</p>
            <Link
              href="/admin/card-scanner"
              className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block"
            >
              Scan your first card →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
