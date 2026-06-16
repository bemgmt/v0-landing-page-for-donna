"use client"

import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

export function WelcomeHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.06] via-transparent to-cyan-500/[0.06] p-8 md:p-10 mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.04] to-cyan-500/[0.04]" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-medium">
            Network Active
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-light tracking-wide text-white mb-3">
          Welcome to the DIN
        </h1>
        <p className="text-sm text-white/50 max-w-lg leading-relaxed mb-6">
          The DONNA Intelligence Network connects verified business nodes through a governed
          exchange layer. Discover opportunities, submit bids, and track intelligence — all from
          one operational command center.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/din/needs/open-bids"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.08] border border-white/[0.12] text-sm text-white hover:bg-white/[0.12] transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Bid Board
          </Link>
          <Link
            href="/din/needs/submit-request"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/20 text-sm text-white hover:from-violet-500/30 hover:to-cyan-500/30 transition-colors"
          >
            Submit a Request
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
