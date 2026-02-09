"use client"

import { useInView } from "react-intersection-observer"

const comparisonRows = [
  { capability: "Lead capture & qualification", donna: "✓ Built-in", stack: "ZoomInfo — $1,500/mo" },
  { capability: "CRM + email workflows", donna: "✓ Built-in", stack: "GHL + tools — $500/mo" },
  { capability: "Live chat + messaging", donna: "✓ Built-in", stack: "Intercom — $400/mo" },
  { capability: "Operations coordination", donna: "✓ Built-in", stack: "Part-time ops — $3,750/mo" },
  { capability: "AI-powered automation", donna: "✓ Built-in", stack: "Zapier + bots — $350/mo" },
  { capability: "Unified pipeline & intelligence", donna: "✓ Built-in", stack: "Not available" },
]

export default function PricingComparisonChart() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  return (
    <div ref={ref} className={`comparison-table-wrapper ${inView ? "is-visible" : ""}`}>
      <div className="comparison-table" role="table" aria-label="DONNA vs. fragmented tool stack">
        <div className="comparison-table-header" role="row">
          <div role="columnheader">Capability</div>
          <div role="columnheader">DONNA</div>
          <div role="columnheader">Tool Stack</div>
        </div>
        {comparisonRows.map((row, index) => (
          <div key={index} className="comparison-table-row" role="row">
            <div className="comparison-table-feature" role="cell">{row.capability}</div>
            <div className="comparison-table-donna" role="cell">{row.donna}</div>
            <div className="comparison-table-stack" role="cell">{row.stack}</div>
          </div>
        ))}
        <div className="comparison-table-total" role="row">
          <div role="cell">Total Monthly Cost</div>
          <div className="comparison-table-donna" role="cell">$1,500/mo</div>
          <div className="comparison-table-stack-highlight" role="cell">$6,500+/mo</div>
        </div>
      </div>
    </div>
  )
}
