import type { ReactNode } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export function MarketingSubpageShell({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb />
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          {lead ? <p className="text-foreground/70 text-lg">{lead}</p> : null}
        </header>
        <div className="mt-10 max-w-4xl mx-auto space-y-12 text-foreground/85">
          <div>{children}</div>
          
          {/* Global DONNA conversion banner at the bottom of every subpage */}
          <div className="relative mt-16 p-8 rounded-2xl border border-accent/20 liquid-glass shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left max-w-2xl">
                <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2 text-foreground">
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                  Upgrade to Operational Autopilot
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tired of managing fragmented AI assistants, prompts, and coding setups? Get a DONNA, our unified AI operational infrastructure designed to complement or completely replace these individual tools, running your business workflows on autopilot with built-in human-in-the-loop oversight.
                </p>
              </div>
              <Link
                href="/"
                className="w-full md:w-auto shrink-0 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-accent to-primary text-black font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg glow-accent"
              >
                Discover DONNA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
