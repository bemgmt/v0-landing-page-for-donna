"use client"

import { createElement, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID ?? ""
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

export default function StripePricingTableEmbed() {
  const [clientReferenceId, setClientReferenceId] = useState("")

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setClientReferenceId(data.user?.id ?? "")
    })
  }, [])

  if (!pricingTableId || !publishableKey) return null

  const props: Record<string, string> = {
    "pricing-table-id": pricingTableId,
    "publishable-key": publishableKey,
  }
  if (clientReferenceId) {
    props["client-reference-id"] = clientReferenceId
  }

  return <div key={clientReferenceId || "anon"}>{createElement("stripe-pricing-table", props)}</div>
}
