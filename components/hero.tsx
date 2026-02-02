"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const dots: Array<{ x: number; y: number; vx: number; vy: number; opacity: number }> = []
    const dotCount = 50

    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgba(132, 204, 255, 0.15)"
      ctx.strokeStyle = "rgba(132, 204, 255, 0.1)"
      ctx.lineWidth = 1

      dots.forEach((dot) => {
        dot.x += dot.vx
        dot.y += dot.vy

        if (dot.x < 0) dot.x = canvas.width
        if (dot.x > canvas.width) dot.x = 0
        if (dot.y < 0) dot.y = canvas.height
        if (dot.y > canvas.height) dot.y = 0

        ctx.globalAlpha = dot.opacity
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1

      dots.forEach((dot, i) => {
        dots.slice(i + 1).forEach((other) => {
          const dx = dot.x - other.x
          const dy = dot.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.globalAlpha = (1 - distance / 100) * 0.1
            ctx.beginPath()
            ctx.moveTo(dot.x, dot.y)
            ctx.lineTo(other.x, other.y)
            ctx.stroke()
          }
        })
      })

      ctx.globalAlpha = 1
      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-ai-brain-wide.jpg"
          alt="AI Brain - DONNA Office Assistant"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark blur overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      {/* Animated canvas overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-30 z-10" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background/60 z-20" />

      <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {/* Left: Text content */}
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              <span className="gradient-text">Meet DONNA</span>
              <br />
              Digital Operations Neural Network Assistant
            </h1>

            <p className="text-base md:text-lg text-foreground/80 mb-4 leading-relaxed">
              Not a chatbot. Not a CRM. Not a workflow tool.
            </p>
            <p className="text-base md:text-lg text-foreground/70 mb-2 italic">
              DONNA is your Digital Operations Layer
            </p>

            <p className="text-lg md:text-xl text-foreground/90 mb-8 leading-relaxed">
              An agentic, multi-modal AI operations platform that functions as your digital employee layer. DONNA controls tools, coordinates workflows, and connects with other DONNAs across your network, handling calls, emails, scheduling, sales, marketing, and operations 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => {
                  const form = document.getElementById("demo-form")
                  form?.scrollIntoView({ behavior: "smooth" })
                }}
                className="px-8 py-3 rounded-lg bg-accent text-background hover:bg-accent/90 transition-all duration-300 font-semibold text-lg glow-accent hover:shadow-[0_0_30px_rgba(132,204,255,0.5)]"
              >
                Join the Waitlist
              </button>
            </div>

            {/* Trust badge */}
            <div className="text-sm text-foreground/70 flex items-center gap-2">
              <span>⬢</span>
              <span>Enterprise-grade security • GDPR compliant • SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
