"use client"

import type { MouseEvent } from "react"
import { track } from "@vercel/analytics"

/** Home page: smooth-scroll to #pricing. Other routes: let Next.js navigate to /#pricing. */
export function onPricingCtaNavClick(placement: string, e: MouseEvent<HTMLAnchorElement>) {
  track("pricing_cta_click", { placement })
  if (window.location.pathname === "/") {
    e.preventDefault()
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }
}
