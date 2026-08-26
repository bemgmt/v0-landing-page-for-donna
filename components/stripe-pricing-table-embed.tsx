"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { startStripeCheckout, type CheckoutTier } from "@/lib/start-checkout"

export default function StripePricingTableEmbed() {
  const [pendingTier, setPendingTier] = useState<CheckoutTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function beginCheckout(tier: CheckoutTier) {
    setPendingTier(tier)
    setError(null)
    const result = await startStripeCheckout(tier)
    if (result.ok) return

    if (result.error?.toLowerCase().includes("unauthorized")) {
      await signIn("cognito", { callbackUrl: `/api/checkout?tier=${tier}` })
      return
    }

    setError(result.error ?? "Checkout could not be started.")
    setPendingTier(null)
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {([
        {
          tier: "core" as const,
          title: "Core DONNA",
          price: "$500",
          seats: "3 total seats",
          description: "Operational workspace, connected context, and foundational DONNA access.",
        },
        {
          tier: "full" as const,
          title: "Full Access DONNA",
          price: "$1,000",
          seats: "6 total seats",
          description: "Expanded workspace capacity, workflows, and team access.",
        },
      ]).map((plan) => (
        <div key={plan.tier} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-left sm:p-8">
          <h3 className="text-xl font-semibold">{plan.title}</h3>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
            <span className="pb-1 text-sm text-foreground/50">/ month</span>
          </div>
          <p className="mt-2 text-sm font-medium text-accent">{plan.seats}</p>
          <p className="mt-2 text-sm text-foreground/70">{plan.description}</p>
          <ul className="mt-5 space-y-2 text-sm text-foreground/65">
            <li>• 30-day free trial</li>
            <li>• Credit card required</li>
            <li>• Plan usage limits apply</li>
          </ul>
          <button
            type="button"
            onClick={() => void beginCheckout(plan.tier)}
            disabled={pendingTier !== null}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {pendingTier === plan.tier ? "Opening checkout…" : `Start ${plan.title} trial`}
          </button>
        </div>
      ))}
      {error ? <p className="md:col-span-2 text-center text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
