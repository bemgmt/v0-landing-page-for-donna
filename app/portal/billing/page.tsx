import { format } from "date-fns"
import { getPortalSession } from "@/lib/portal/session"
import SeatInvitesForm from "@/components/portal/seat-invites-form"
import { resolveActiveSeatInvitePlan, resolveSubscriptionPlan } from "@/lib/billing/resolve-subscription-plan"

export default async function PortalBillingPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { billing, seatAccess, supabase, user } = session

  const active = billing?.status === "active" || billing?.status === "trialing"
  const purchaserPlan =
    billing && active && !seatAccess ? await resolveSubscriptionPlan(supabase, billing) : null
  const invitePlan = seatAccess ? await resolveActiveSeatInvitePlan(user.email ?? session.profile.email) : null

  const summary = seatAccess ? invitePlan : purchaserPlan
  const periodEnd =
    billing?.current_period_end && !seatAccess
      ? format(new Date(billing.current_period_end), "MMM d, yyyy")
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Billing & seats</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage who can access the partner portal on your subscription. Seat limits follow your Stripe plan
          (Core vs Full Access).
        </p>
      </div>

      {summary ? (
        <section className="rounded-xl border border-white/10 liquid-glass p-4 space-y-2 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscription</p>
          <p className="text-lg font-medium text-foreground">{summary.planLabel}</p>
          <div className="text-muted-foreground space-y-1">
            {seatAccess ? (
              <p>Partner access through a team seat on this plan.</p>
            ) : billing ? (
              <>
                <p>
                  Status:{" "}
                  <span className="text-foreground/90 capitalize">{billing.status.replace("_", " ")}</span>
                </p>
                {periodEnd ? (
                  <p>
                    Current period ends: <span className="text-foreground/90">{periodEnd}</span>
                  </p>
                ) : null}
                <p>
                  Seat allowance: <span className="text-foreground/90 font-medium">{summary.seatsAllowance}</span>
                </p>
              </>
            ) : null}
            <p className="text-xs pt-1">
              Lookup key: <span className="font-mono text-foreground/80">{summary.planKey || "—"}</span>
            </p>
          </div>
        </section>
      ) : !seatAccess && billing && !active ? (
        <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
          <p className="text-foreground/90 font-medium">No active subscription</p>
          <p className="mt-1">When your plan is active, your plan name and renewal date will appear here.</p>
        </section>
      ) : null}

      <SeatInvitesForm />
    </div>
  )
}
