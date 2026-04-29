import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "What is DONNA",
  description:
    "DONNA is AI operational infrastructure for SMBs — one layer for communication, coordination, and execution. Not a chatbot; infrastructure you run the business on.",
  path: "/what-is-donna",
})

export default function WhatIsDonnaPage() {
  return (
    <MarketingSubpageShell
      title="What is DONNA?"
      lead="Operational intelligence — not software you log into occasionally, but infrastructure your business runs on."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          DONNA unifies messages, tasks, handoffs, and follow-ups so deals and operations keep moving. It is built
          for high-communication industries where dropped balls are expensive: real estate, mortgage, title, home
          services, contractors, and similar SMB operators.
        </p>
        <p>
          Unlike a generic chatbot, DONNA is designed around workflows and accountability across people and systems —
          calm, infrastructure-grade automation with human oversight where it matters.
        </p>
        <p>
          Read more in the{" "}
          <Link href="/faq" className="text-accent hover:underline">
            FAQ
          </Link>
          , explore the{" "}
          <Link href="/donna-intelligence-network" className="text-accent hover:underline">
            DONNA Intelligence Network
          </Link>
          , or{" "}
          <Link href="/contact" className="text-accent hover:underline">
            request access
          </Link>
          .
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
