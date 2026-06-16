"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Compass, Zap, BookOpen, ArrowRight } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useTour } from '@/contexts/TourContext'
import { dashboardTour, quickTips } from '@/lib/tours/dashboard-tour'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'

export function TourStep() {
  const { completeStep } = useOnboarding()
  const { startTour } = useTour()
  const [selectedOption, setSelectedOption] = useState<'full' | 'quick' | 'skip' | null>(null)

  const handleStartFullTour = () => {
    setSelectedOption('full')
    setTimeout(() => {
      startTour(dashboardTour)
      completeStep('tour')
    }, 500)
  }

  const handleStartQuickTips = () => {
    setSelectedOption('quick')
    setTimeout(() => {
      startTour(quickTips)
      completeStep('tour')
    }, 500)
  }

  const handleSkip = () => {
    setSelectedOption('skip')
    setTimeout(() => {
      completeStep('tour')
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-donna-purple to-donna-cyan mb-4"
          >
            <Compass className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-semibold text-white">Ready to Explore?</h1>
          <p className="text-white/70">Let me show you around, or jump right in!</p>
        </div>

        {/* Tour Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Full Tour */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard
              className={`p-6 cursor-pointer transition-all h-full ${
                selectedOption === 'full'
                  ? 'border-donna-purple ring-2 ring-donna-purple/50'
                  : 'hover:border-donna-purple/30'
              }`}
              onClick={handleStartFullTour}
            >
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-donna-purple/20 flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6 text-donna-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Full Tour</h3>
                  <p className="text-sm text-white/70">
                    Complete walkthrough of all features and capabilities (~5 min)
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-donna-purple">Recommended for new users</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard
              className={`p-6 cursor-pointer transition-all h-full ${
                selectedOption === 'quick'
                  ? 'border-donna-cyan ring-2 ring-donna-cyan/50'
                  : 'hover:border-donna-cyan/30'
              }`}
              onClick={handleStartQuickTips}
            >
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-donna-cyan/20 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-donna-cyan" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Quick Tips</h3>
                  <p className="text-sm text-white/70">
                    Just the essentials to get you started (~2 min)
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-donna-cyan">Fast & focused</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Skip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard
              className={`p-6 cursor-pointer transition-all h-full ${
                selectedOption === 'skip'
                  ? 'border-white/40 ring-2 ring-white/30'
                  : 'hover:border-white/30'
              }`}
              onClick={handleSkip}
            >
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                  <ArrowRight className="w-6 h-6 text-white/70" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Skip Tour</h3>
                  <p className="text-sm text-white/70">
                    I&apos;ll explore on my own. I can always ask DONNA for help!
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-white/50">You can restart tours anytime</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-white/60">
            💡 Tip: You can pause, skip, or restart any tour by asking me in the chat!
          </p>
        </div>
      </motion.div>
    </div>
  )
}

