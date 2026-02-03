"use client"

import type { CSSProperties } from "react"
import { useInView } from "react-intersection-observer"

interface SignalPulsesVisualizationProps {
  className?: string
}

const emitters = [
  { id: "emitter-1", x: 85, y: 80 },
  { id: "emitter-2", x: 260, y: 75 },
  { id: "emitter-3", x: 90, y: 190 },
  { id: "emitter-4", x: 245, y: 190 },
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
          <radialGradient id="pulseBackdrop" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(86, 126, 255, 0.18)" />
            <stop offset="100%" stopColor="rgba(24, 30, 60, 0)" />
          </radialGradient>
          <radialGradient id="emitterGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(207, 218, 255, 0.75)" />
            <stop offset="60%" stopColor="rgba(126, 156, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(126, 156, 255, 0)" />
          </radialGradient>
          <filter id="emitterBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <rect width="360" height="260" fill="url(#pulseBackdrop)" opacity="0.8" />

        {emitters.map((emitter, emitterIndex) => (
          <g key={emitter.id} transform={`translate(${emitter.x} ${emitter.y})`}>
            <circle
              className="signal-emitter"
              cx="0"
              cy="0"
              r="14"
              fill="url(#emitterGlow)"
              filter="url(#emitterBlur)"
              opacity="0.75"
            />
            {[0, 1, 2, 3].map((ringIndex) => {
              const style: CSSProperties = {
                "--ring-delay": `${(emitterIndex * 0.6) + ringIndex * 1.6}s`,
                "--ring-duration": `${6.5 + ringIndex * 1.35}s`,
              }
              const isDashed = ringIndex === 2 && emitterIndex % 2 === 1
              return (
                <circle
                  key={`${emitter.id}-ring-${ringIndex}`}
                  className={`signal-ring ${isDashed ? "is-dashed" : ""}`}
                  cx="0"
                  cy="0"
                  r="24"
                  style={style}
                  stroke="rgba(175, 196, 255, 0.45)"
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
