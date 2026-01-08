"use client"

import { useInView } from "react-intersection-observer"

interface NetworkVisualizationProps {
  className?: string
  size?: number
}

export default function NetworkVisualization({ className = "", size = 400 }: NetworkVisualizationProps) {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  // Calculate node positions in a network pattern
  const centerX = size / 2
  const centerY = size / 2
  const radius = size * 0.3
  const nodeRadius = size * 0.04

  // Create 6 nodes around a central node
  const nodes = [
    { x: centerX, y: centerY, isCenter: true }, // Central node
    { x: centerX, y: centerY - radius, isCenter: false }, // Top
    { x: centerX + radius * 0.866, y: centerY - radius * 0.5, isCenter: false }, // Top-right
    { x: centerX + radius * 0.866, y: centerY + radius * 0.5, isCenter: false }, // Bottom-right
    { x: centerX, y: centerY + radius, isCenter: false }, // Bottom
    { x: centerX - radius * 0.866, y: centerY + radius * 0.5, isCenter: false }, // Bottom-left
    { x: centerX - radius * 0.866, y: centerY - radius * 0.5, isCenter: false }, // Top-left
  ]

  // Create connections from center to all outer nodes, plus some interconnections
  const connections = [
    // From center to all outer nodes
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 0, to: 3 },
    { from: 0, to: 4 },
    { from: 0, to: 5 },
    { from: 0, to: 6 },
    // Some interconnections between outer nodes
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 1 },
  ]

  return (
    <div ref={ref} className={`flex items-center justify-center ${className} ${inView ? "animate-fade-in" : "opacity-0"}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto max-w-md text-accent"
      >
        <defs>
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        <g className="network-lines">
          {connections.map((conn, index) => {
            const fromNode = nodes[conn.from]
            const toNode = nodes[conn.to]
            return (
              <line
                key={`line-${index}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                className={inView ? "animate-pulse-line" : ""}
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g className="network-nodes">
          {nodes.map((node, index) => (
            <g key={`node-${index}`}>
              {/* Glow effect for center node */}
              {node.isCenter && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius * 1.8}
                  fill="currentColor"
                  opacity="0.2"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={node.isCenter ? "url(#nodeGradient)" : "currentColor"}
                opacity={node.isCenter ? "1" : "0.6"}
                filter={node.isCenter ? "url(#glow)" : "none"}
                className="transition-all duration-500"
                style={{
                  transform: inView ? "scale(1)" : "scale(0)",
                  transformOrigin: `${node.x}px ${node.y}px`,
                }}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
