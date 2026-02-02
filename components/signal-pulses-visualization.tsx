"use client"

import type { CSSProperties } from "react"
import { useInView } from "react-intersection-observer"

interface SignalPulsesVisualizationProps {
  className?: string
}

const emitters = [
  { id: "emitter-1", x: 90, y: 90 },
  { id: "emitter-2", x: 250, y: 70 },
  { id: "emitter-3", x: 210, y: 190 },
]

export default function SignalPulsesVisualization({ className = "" }: SignalPulsesVisualizationProps) {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  return (
    <div
      ref={ref}
      className={`signal-pulses ${inView ? "is-visible" : ""} ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 360 260" className="w-full h-auto" role="img" aria-label="Signal pulses">
        <defs>
          <radialGradient id="emitterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
          <filter id="emitterBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {emitters.map((emitter, emitterIndex) => (
          <g key={emitter.id} transform={`translate(${emitter.x} ${emitter.y})`}>
            <circle
              className="signal-emitter"
              cx="0"
              cy="0"
              r="16"
              fill="url(#emitterGlow)"
              filter="url(#emitterBlur)"
              opacity="0.6"
            />
            {[0, 1, 2].map((ringIndex) => {
              const style: CSSProperties = {
                "--ring-delay": `${(emitterIndex * 0.6) + ringIndex * 1.6}s`,
                "--ring-duration": `${7 + ringIndex * 1.4}s`,
              }
              const isDashed = emitterIndex === 1 && ringIndex === 2
              return (
                <circle
                  key={`${emitter.id}-ring-${ringIndex}`}
                  className={`signal-ring ${isDashed ? "is-dashed" : ""}`}
                  cx="0"
                  cy="0"
                  r="22"
                  style={style}
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="1"
                  fill="none"
                />
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}
