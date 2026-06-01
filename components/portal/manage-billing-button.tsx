"use client"

import { useState } from "react"

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/billing-portal", {
        method: "POST",
        credentials: "same-origin",
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Could not open billing portal.")
        return
      }
      if (typeof data.url === "string" && data.url.length > 0) {
        window.location.assign(data.url)
        return
      }
      setError("No billing portal URL returned.")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="rounded-full px-5 py-2 text-sm font-semibold bg-accent text-background hover:bg-accent/90 disabled:opacity-60 transition-colors"
      >
        {loading ? "Opening…" : "Manage billing"}
      </button>
      <p className="text-xs text-muted-foreground mt-1.5">
        Update payment method, view invoices, or cancel your subscription.
      </p>
      {error ? <p className="text-sm text-destructive mt-2">{error}</p> : null}
    </div>
  )
}
