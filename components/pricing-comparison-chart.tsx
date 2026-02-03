"use client"

import type { CSSProperties } from "react"
import { useInView } from "react-intersection-observer"

const plans = [
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

const featureRows = [
  {
    id: "lead-capture",
    label: "Lead capture",
    values: {
      "single-tool": true,
      "tool-stack": true,
      "part-time": true,
      donna: true,
    },
  },
  {
    id: "crm-workflows",
    label: "CRM + email workflows",
    values: {
      "single-tool": false,
      "tool-stack": true,
      "part-time": true,
      donna: true,
    },
  },
  {
    id: "ops-coverage",
    label: "Ops coverage",
    values: {
      "single-tool": false,
      "tool-stack": false,
      "part-time": true,
      donna: true,
    },
  },
  {
    id: "ai-automation",
    label: "AI automation",
    values: {
      "single-tool": false,
      "tool-stack": false,
      "part-time": false,
      donna: true,
    },
  },
  {
    id: "unified-pipeline",
    label: "Unified pipeline",
    values: {
      "single-tool": false,
      "tool-stack": false,
      "part-time": false,
      donna: true,
    },
  },
]

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`

export default function PricingComparisonChart() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  return (
    <div ref={ref} className={`pricing-chart ${inView ? "is-visible" : ""}`}>
      <div className="pricing-chart-table">
        <div className="pricing-chart-labels" aria-hidden="true">
          <div className="pricing-chart-label pricing-chart-label--spacer" />
          {featureRows.map((feature) => (
            <div key={feature.id} className="pricing-chart-label">
              {feature.label}
            </div>
          ))}
          <div className="pricing-chart-label pricing-chart-label--spacer" />
        </div>

        {plans.map((plan, index) => {
          const style: CSSProperties = {
            "--row-delay": `${index * 0.1}s`,
          }

          return (
            <div
              key={plan.id}
              className={`pricing-chart-plan ${plan.highlight ? "is-highlight" : ""}`}
              style={style}
            >
              <div className="pricing-chart-plan-header">
                <div className="pricing-chart-plan-name">{plan.label}</div>
                <div className="pricing-chart-plan-note">{plan.note}</div>
                <div className="pricing-chart-plan-price">
                  <span className="pricing-chart-price">{formatCurrency(plan.value)}</span>
                  <span className="pricing-chart-price-unit">/month</span>
                </div>
              </div>
              {featureRows.map((feature) => {
                const isIncluded = feature.values[plan.id as keyof typeof feature.values]
                return (
                  <div
                    key={feature.id}
                    className="pricing-chart-plan-row"
                    data-label={feature.label}
                  >
                    <span
                      className={`pricing-chart-marker ${isIncluded ? "is-on" : "is-off"}`}
                      role="img"
                      aria-label={isIncluded ? "Included" : "Not included"}
                    />
                  </div>
                )
              })}
              <div className="pricing-chart-plan-footer">
                {plan.highlight ? (
                  <span className="pricing-chart-pill">Best value</span>
                ) : (
                  <span className="pricing-chart-footer-spacer" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
