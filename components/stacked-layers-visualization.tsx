"use client"

import type { CSSProperties } from "react"
import { useInView } from "react-intersection-observer"

interface StackedLayersVisualizationProps {
  className?: string
}

const layers = [
  { id: "layer-1", offsetX: -8, offsetY: -6, opacity: 0.35 },
  { id: "layer-2", offsetX: 6, offsetY: -4, opacity: 0.4 },
  { id: "layer-3", offsetX: -4, offsetY: 6, opacity: 0.38 },
  { id: "layer-4", offsetX: 5, offsetY: 8, opacity: 0.45, spotlight: true },
  { id: "layer-5", offsetX: -6, offsetY: 10, opacity: 0.35 },
  { id: "layer-6", offsetX: 3, offsetY: -10, opacity: 0.32 },
]

export default function StackedLayersVisualization({ className = "" }: StackedLayersVisualizationProps) {
  const { ref, inView } = useInView({ threshold: 0.25, once: true })

  return (
    <div
      ref={ref}
      className={`stacked-layers ${inView ? "is-visible" : ""} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 360 260"
        className="w-full h-auto"
        role="img"
        aria-label="Stacked operational layers"
      >
        <defs>
          <linearGradient id="layerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
          </linearGradient>
          <filter id="layerBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
          <filter id="spotlightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {layers.map((layer) => {
          const style: CSSProperties = {
            "--offset-x": `${layer.offsetX}px`,
            "--offset-y": `${layer.offsetY}px`,
            "--layer-opacity": `${layer.opacity}`,
          }

          return (
            <g
              key={layer.id}
              className={`stacked-layer ${layer.spotlight ? "is-spotlight" : ""}`}
              style={style}
            >
              {layer.spotlight ? (
                <rect
                  x="56"
                  y="56"
                  width="248"
                  height="148"
                  rx="28"
                  fill="rgba(122, 92, 255, 0.12)"
                  filter="url(#spotlightGlow)"
                />
              ) : null}
              <rect
                x="56"
                y="56"
                width="248"
                height="148"
                rx="28"
                fill="url(#layerGradient)"
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth="1"
                filter="url(#layerBlur)"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
