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
        { tier: "core" as const, title: "Core", description: "Cloud workspace and foundational DONNA access.", price: "$500" },
        { tier: "full" as const, title: "Full Toolkit", description: "Expanded toolkit, workflows, and team capacity.", price: "$1,000" },
      ]).map((plan) => (
        <div key={plan.tier} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <h3 className="text-xl font-semibold">{plan.title}</h3>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-cyan-300">{plan.price}</span>
            <span className="text-sm text-foreground/70">USD / month</span>
          </p>
          <p className="mt-1 text-xs text-foreground/60">Billed monthly. Due when checkout completes.</p>
          <p className="mt-2 text-sm text-foreground/70">{plan.description}</p>
          <button
            type="button"
            onClick={() => void beginCheckout(plan.tier)}
            disabled={pendingTier !== null}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {pendingTier === plan.tier ? "Opening checkout…" : "Continue to secure checkout"}
          </button>
        </div>
      ))}
      {error ? <p className="md:col-span-2 text-center text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
