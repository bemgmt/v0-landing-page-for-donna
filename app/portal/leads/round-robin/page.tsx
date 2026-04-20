import { requirePartnerPortal } from "@/lib/portal/require-partner"

export default async function RoundRobinPage() {
  const session = await requirePartnerPortal()
  const { supabase } = session

  const [{ data: queue }, { data: leads }] = await Promise.all([
    supabase.from("round_robin_state").select("*").eq("queue_name", "default").maybeSingle(),
    supabase
      .from("lead_pool")
      .select("id, lead_name, lead_email, status, created_at")
      .eq("status", "unclaimed")
      .order("created_at", { ascending: true })
      .limit(50),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Round robin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unclaimed leads in the pool. Staff assigns the next partner from the rotating queue.
        </p>
      </div>
      <div className="rounded-xl border border-white/10 liquid-glass p-4 text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">Queue cursor index:</span> {queue?.current_index ?? 0}
        </p>
        <p>
          <span className="text-muted-foreground">Current partner slot:</span>{" "}
          {queue?.current_partner_id ?? "—"}
        </p>
      </div>
      <ul className="space-y-2">
        {(leads ?? []).map((l) => (
          <li key={l.id} className="rounded-lg border border-white/10 px-4 py-3 text-sm">
            <span className="font-medium">{l.lead_name ?? "Lead"}</span>
            <span className="text-muted-foreground ml-2">{l.lead_email}</span>
            <span className="block text-xs text-muted-foreground mt-1">
              {new Date(l.created_at).toLocaleString()} · {l.status}
            </span>
          </li>
        ))}
      </ul>
      {(leads ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No unclaimed leads right now.</p>
      ) : null}
    </div>
  )
}
