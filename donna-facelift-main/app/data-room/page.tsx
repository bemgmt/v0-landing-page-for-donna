"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Download, FileText, Presentation } from "lucide-react"
import {
  DECK_PATH,
  GENERATED_PDFS,
  SAFE_BULLETS,
  SAFE_NARRATIVE_PARAGRAPHS,
  SAFE_TIERS,
} from "@/lib/data-room/content"

export default function DataRoomPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 glass-dark backdrop-blur text-white"
      data-tour="data-room-content"
    >
      <div className="border-b border-white/20 px-6 py-6 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          data-tour="data-room-back-dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-light tracking-wide">Data Room</h1>
        <p className="text-sm text-white/60 mt-2 max-w-2xl leading-relaxed">
          Confidential diligence materials for DONNA — pitch deck, proposed SAFE economics, and supporting documents.
          Demo preview; not investment advice.
        </p>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-12">
        <section data-tour="data-room-deck" aria-labelledby="deck-heading">
          <h2 id="deck-heading" className="text-lg font-light text-white mb-4 flex items-center gap-2">
            <Presentation className="w-5 h-5 text-emerald-400/90" />
            Pitch deck
          </h2>
          <div className="glass border border-white/15 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-white/95">AI-DONNA-Co</p>
              <p className="text-sm text-white/55 mt-1">Company overview deck (PDF).</p>
            </div>
            <a
              href={DECK_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/15 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Open PDF
            </a>
          </div>
        </section>

        <section data-tour="data-room-safe" aria-labelledby="safe-heading">
          <h2 id="safe-heading" className="text-lg font-light text-white mb-4">
            Proposed SAFE structure
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{SAFE_NARRATIVE_PARAGRAPHS[0]}</p>

          <div className="overflow-x-auto rounded-xl border border-white/15 glass mb-6">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-wider text-xs">
                  <th className="px-4 py-3 font-medium">Investment amount</th>
                  <th className="px-4 py-3 font-medium">Valuation cap</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                </tr>
              </thead>
              <tbody>
                {SAFE_TIERS.map((row) => (
                  <tr key={row.investmentLabel} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white/90">{row.investmentLabel}</td>
                    <td className="px-4 py-3 text-white/80">{row.valuationCap}</td>
                    <td className="px-4 py-3 text-white/80">{row.discount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-white/70 leading-relaxed mb-4">{SAFE_NARRATIVE_PARAGRAPHS[1]}</p>
          <ul className="list-none space-y-2 mb-6">
            {SAFE_BULLETS.map((b) => (
              <li key={b.label} className="flex gap-2 text-sm text-white/85">
                <span className="text-emerald-400/90 shrink-0">•</span>
                <span>
                  <strong className="text-white">{b.label}</strong> — {b.detail}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white/65 leading-relaxed">{SAFE_NARRATIVE_PARAGRAPHS[2]}</p>
        </section>

        <section data-tour="data-room-documents" aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="text-lg font-light text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-white/70" />
            Documents
          </h2>
          <p className="text-sm text-white/55 mb-4">
            Generated from repo Markdown via <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">npm run data-room:pdf</code>.
            If a link 404s, run that script locally or add the file under <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">public/data-room/pdfs/</code>.
          </p>
          <ul className="space-y-2">
            {GENERATED_PDFS.map((doc) => (
              <li key={doc.href}>
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <div>
                    <span className="font-medium text-white/95 group-hover:text-white">{doc.title}</span>
                    <p className="text-xs text-white/50 mt-0.5">{doc.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300/90 shrink-0">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-xs text-white/40 border-t border-white/10 pt-8 pb-12">
          Materials are provided for diligence discussion only. Economics and outcomes are illustrative; consult counsel
          for any investment decision.
        </footer>
      </div>
    </motion.div>
  )
}
