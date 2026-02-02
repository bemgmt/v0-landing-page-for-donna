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
  const maxValue = Math.max(...chartData.map((item) => item.value)) * 1.08

  return (
    <div ref={ref} className={`pricing-chart ${inView ? "is-visible" : ""}`}>
      <div className="pricing-chart-grid">
        {chartData.map((item, index) => {
          const height = `${(item.value / maxValue) * 100}%`
          const style: CSSProperties = {
            "--bar-height": height,
            "--bar-delay": `${index * 0.08}s`,
          }

          return (
            <div key={item.id} className="pricing-chart-column">
              <div className="pricing-chart-value">{formatCurrency(item.value)}</div>
              <div className="pricing-chart-rail">
                <div className="pricing-chart-bar" style={style}>
                  <div className={`pricing-chart-fill ${item.highlight ? "is-highlight" : ""}`}>
                    {item.highlight ? <span className="pricing-chart-sweep" /> : null}
                  </div>
                </div>
              </div>
              <div className="pricing-chart-label">
                <div className="pricing-chart-title">{item.label}</div>
                <div className="pricing-chart-note">{item.note}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
