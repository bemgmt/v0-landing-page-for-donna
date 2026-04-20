import { getPortalSession } from "@/lib/portal/session"

export default async function SocialsPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { data: links } = await session.supabase
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Socials</h1>
        <p className="text-sm text-muted-foreground mt-1">Community and video links from the team.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(links ?? []).map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30 transition-colors"
          >
            <p className="text-xs uppercase text-muted-foreground">{l.platform}</p>
            <p className="font-medium mt-1">{l.label}</p>
          </a>
        ))}
      </div>
      {(links ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No links configured.</p>
      ) : null}
    </div>
  )
}
