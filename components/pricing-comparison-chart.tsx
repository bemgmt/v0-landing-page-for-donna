"use client"

import type { CSSProperties } from "react"
import { useInView } from "react-intersection-observer"

const chartData = [
  {
    id: "single-tool",
    label: "Single tool",
    note: "Lead gen software",
    value: 1500,
  },
  {
    id: "tool-stack",
    label: "Tool stack",
    note: "CRM + email + chat",
    value: 1400,
  },
  {
    id: "part-time",
    label: "Part-time ops",
    note: "Monthly equivalent",
    value: 3750,
  },
  {
    id: "donna",
    label: "DONNA Beta",
    note: "$1,500 / mo",
    value: 1500,
    highlight: true,
  },
]

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`

export default function PricingComparisonChart() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  return (
    <div ref={ref} className={`pricing-chart ${inView ? "is-visible" : ""}`}>
      <div className="pricing-chart-table">
        <div className="pricing-chart-header">
          <span>Approach</span>
          <span>Monthly cost</span>
        </div>
        {chartData.map((item, index) => {
          const style: CSSProperties = {
            "--row-delay": `${index * 0.08}s`,
          }

          return (
            <div
              key={item.id}
              className={`pricing-chart-row ${item.highlight ? "is-highlight" : ""}`}
              style={style}
            >
              <div className="pricing-chart-cell">
                <div className="pricing-chart-title">{item.label}</div>
                <div className="pricing-chart-note">{item.note}</div>
              </div>
              <div className="pricing-chart-cell pricing-chart-amount">
                <span className="pricing-chart-value">{formatCurrency(item.value)}</span>
                {item.highlight ? <span className="pricing-chart-pill">Best value</span> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
