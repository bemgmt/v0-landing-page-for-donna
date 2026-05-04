import LeadAssignForm from "@/components/admin/lead-assign-form"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLeadsPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from("lead_pool")
    .select("id, lead_name, lead_email, status, assigned_partner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(80)

  const { data: claims } = await supabase
    .from("sale_claims")
    .select("id, status, evidence_notes, created_at, claimant_profile_id")
    .order("created_at", { ascending: false })
    .limit(40)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Leads & claims</h1>
        <p className="text-sm text-muted-foreground mt-1">Assign pooled leads and review manual sale claims.</p>
      </div>

      <LeadAssignForm />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Lead pool</h2>
        <div className="rounded-xl border border-white/10 overflow-auto text-sm">
          <table className="w-full">
            <thead className="bg-white/5 text-muted-foreground text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).map((l) => (
                <tr key={l.id} className="border-t border-white/10">
                  <td className="p-2 font-mono text-xs">{l.id}</td>
                  <td className="p-2">
                    {l.lead_name} · {l.lead_email}
                  </td>
                  <td className="p-2">{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Sale claims</h2>
        <ul className="space-y-2 text-sm">
          {(claims ?? []).map((c) => (
            <li key={c.id} className="rounded-lg border border-white/10 px-4 py-3">
              <p className="text-muted-foreground text-xs">{c.id}</p>
              <p>{c.evidence_notes}</p>
              <p className="text-xs mt-2">
                Status: {c.status} · {new Date(c.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
