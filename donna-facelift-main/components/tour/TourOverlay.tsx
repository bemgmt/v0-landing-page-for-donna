"use client"

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Play, Sparkles, Compass } from 'lucide-react'
import { useTour } from '@/contexts/TourContext'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'

interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

export function TourOverlay() {
  const { 
    activeTour, 
    currentStep, 
    currentStepIndex, 
    isActive,
    nextStep,
    previousStep,
    pauseTour,
    resumeTour,
    skipTour
  } = useTour()

  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Calculate position of highlighted element; fallback to centered when element not found
  useEffect(() => {
    if (!currentStep || !isActive) {
      setElementPosition(null)
      return
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStep.target)
      const padding = currentStep.highlightPadding || 8

      if (element) {
        const rect = element.getBoundingClientRect()
        setElementPosition({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2
        })
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        // Fallback: centered tooltip when target element doesn't exist (e.g. wrong page)
        const size = 1
        setElementPosition({
          top: window.innerHeight / 2 - size / 2,
          left: window.innerWidth / 2 - size / 2,
          width: size,
          height: size
        })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [currentStep, isActive])

  // Execute step action when step changes
  useEffect(() => {
    if (currentStep?.action && isActive) {
      currentStep.action()
    }
  }, [currentStep, isActive])

  // Handle tour completion
  const handleNextWithCelebration = () => {
    if (activeTour && currentStepIndex === activeTour.steps.length - 1) {
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        nextStep()
      }, 2000)
    } else {
      nextStep()
    }
  }

  if (!activeTour || !currentStep || !isActive) {
    return null
  }

  const handlePauseToggle = () => {
    if (isPaused) {
      resumeTour()
      setIsPaused(false)
    } else {
      pauseTour()
      setIsPaused(true)
    }
  }

  const tooltipPlacement = currentStep.placement || 'bottom'
  const totalSteps = activeTour.steps.length

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {/* Dark overlay with spotlight cutout (or full dim when element not found) */}
        <div className="absolute inset-0 bg-black/70 pointer-events-auto">
          {elementPosition && elementPosition.width > 10 && elementPosition.height > 10 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1
              }}
              transition={{ 
                duration: 0.4,
                ease: 'easeOut'
              }}
              className="absolute"
              style={{
                top: elementPosition.top,
                left: elementPosition.left,
                width: elementPosition.width,
                height: elementPosition.height,
                borderRadius: '8px',
                border: '2px solid rgba(168, 85, 247, 0.6)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.5)',
                pointerEvents: 'none'
              }}
            >
              {/* Expanding glow rings */}
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(49, 210, 242, 0.2) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Tooltip */}
        {elementPosition && (
          <TourTooltip
            position={elementPosition}
            placement={tooltipPlacement}
            title={currentStep.title}
            description={currentStep.description}
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            canGoBack={currentStepIndex > 0}
            canSkip={activeTour.canSkip !== false}
            canPause={activeTour.canPause !== false}
            isPaused={isPaused}
            tourType={activeTour.type}
            onNext={handleNextWithCelebration}
            onPrevious={previousStep}
            onPause={handlePauseToggle}
            onSkip={skipTour}
          />
        )}

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="relative"
              >
                {/* Expanding rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-4 border-donna-purple"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ 
                      scale: [0, 2 + i * 0.5],
                      opacity: [1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      ease: 'easeOut'
                    }}
                  />
                ))}
                {/* Center sparkle */}
                <motion.div
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-donna-purple to-donna-cyan flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    scale: { duration: 0.5, repeat: Infinity },
                    rotate: { duration: 2, repeat: Infinity, ease: 'linear' }
                  }}
                >
                  <Sparkles className="w-16 h-16 text-white" />
                </motion.div>
                {/* Success text */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">Tour Complete! 🎉</h3>
                  <p className="text-white/70">You&apos;re all set to explore!</p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

interface TourTooltipProps {
  position: ElementPosition
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  title: string
  description: string
  currentStep: number
  totalSteps: number
  canGoBack: boolean
  canSkip: boolean
  canPause: boolean
  isPaused: boolean
  tourType?: 'full' | 'section' | 'mini'
  onNext: () => void
  onPrevious: () => void
  onPause: () => void
  onSkip: () => void
}

function TourTooltip({
  position,
  placement,
  title,
  description,
  currentStep,
  totalSteps,
  canGoBack,
  canSkip,
  canPause,
  isPaused,
  tourType,
  onNext,
  onPrevious,
  onPause,
  onSkip
}: TourTooltipProps) {
  const handleDeeperTour = () => {
    // Trigger event for Cursor to handle deeper tour
    window.dispatchEvent(new CustomEvent('donna:tour-control', {
      detail: {
        action: 'start',
        tourId: 'dashboard-full-tour'
      }
    }))
  }
  const getTooltipPosition = () => {
    const offset = 20
    const tooltipWidth = 400
    const tooltipHeight = 200

    switch (placement) {
      case 'top':
        return {
          top: position.top - tooltipHeight - offset,
          left: position.left + position.width / 2 - tooltipWidth / 2
        }
      case 'bottom':
        return {
          top: position.top + position.height + offset,
          left: position.left + position.width / 2 - tooltipWidth / 2
        }
      case 'left':
        return {
          top: position.top + position.height / 2 - tooltipHeight / 2,
          left: position.left - tooltipWidth - offset
        }
      case 'right':
        return {
          top: position.top + position.height / 2 - tooltipHeight / 2,
          left: position.left + position.width + offset
        }
      case 'center':
      default:
        return {
          top: window.innerHeight / 2 - tooltipHeight / 2,
          left: window.innerWidth / 2 - tooltipWidth / 2
        }
    }
  }

  const tooltipPos = getTooltipPosition()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute pointer-events-auto"
      style={{
        top: tooltipPos.top,
        left: tooltipPos.left,
        maxWidth: '400px'
      }}
    >
      <GlassCard className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/70 mt-1">{description}</p>
          </div>
          {canSkip && (
            <button
              onClick={onSkip}
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-donna-purple to-donna-cyan"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* "Want a deeper tour?" CTA for section tours */}
        {tourType === 'section' && currentStep === totalSteps && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-lg bg-gradient-to-r from-donna-purple/10 to-donna-cyan/10 border border-donna-purple/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Compass className="w-5 h-5 text-donna-purple" />
              <p className="text-sm text-white/90 font-medium">Want a deeper tour?</p>
            </div>
            <p className="text-xs text-white/70 mb-3">
              Get a complete walkthrough of all features and capabilities.
            </p>
            <NeonButton
              variant="glass"
              size="sm"
              onClick={handleDeeperTour}
              className="w-full"
            >
              <Sparkles className="w-4 h-4" />
              Start Full Tour
            </NeonButton>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {canGoBack && (
              <NeonButton
                variant="glass"
                size="sm"
                onClick={onPrevious}
                disabled={!canGoBack}
                className="relative overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-donna-purple/20 to-donna-cyan/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">Back</span>
              </NeonButton>
            )}
            {canPause && (
              <NeonButton
                variant="glass"
                size="sm"
                onClick={onPause}
                className="relative overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-donna-purple/20 to-donna-cyan/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center gap-1">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </span>
              </NeonButton>
            )}
          </div>
          <NeonButton
            variant="default"
            size="sm"
            onClick={onNext}
            className="relative overflow-hidden group"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-donna-purple to-donna-cyan"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
            <motion.span
              className="absolute inset-0 bg-white/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {currentStep === totalSteps ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </>
              )}
            </span>
          </NeonButton>
        </div>
      </GlassCard>
    </motion.div>
  )
}

