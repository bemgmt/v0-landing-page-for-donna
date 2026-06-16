"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, FileText, Eye, CheckCircle2 } from "lucide-react"

type InitializationStatus = 'idle' | 'initializing' | 'complete' | 'error'

type ProgressItem = {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'loading' | 'complete' | 'error'
}

interface DonnaContextInitializerProps {
  onComplete: () => void
  onError?: (error: Error) => void
}

export default function DonnaContextInitializer({ 
  onComplete, 
  onError 
}: DonnaContextInitializerProps) {
  const [status, setStatus] = useState<InitializationStatus>('idle')
  const [progress, setProgress] = useState<ProgressItem[]>([
    {
      id: 'safety',
      label: 'Safety Policies',
      icon: <Shield className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 'governance',
      label: 'Governance Rules',
      icon: <FileText className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 'ui',
      label: 'UI Awareness',
      icon: <Eye className="w-5 h-5" />,
      status: 'pending'
    }
  ])

  useEffect(() => {
    // Start initialization
    setStatus('initializing')
    initializeContext()
  }, [])

  const updateProgress = (id: string, newStatus: ProgressItem['status']) => {
    setProgress(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      )
    )
  }

  const initializeContext = async () => {
    try {
      // Initialize Safety Policies
      updateProgress('safety', 'loading')
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate loading
      
      // In a real implementation, this would load from /donna/governance/
      // For now, we'll just mark it as complete
      updateProgress('safety', 'complete')

      // Initialize Governance Rules
      updateProgress('governance', 'loading')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Load governance policy (if available)
      try {
        const governanceResponse = await fetch('/api/governance/policy')
        if (governanceResponse.ok) {
          await governanceResponse.json()
        }
      } catch (error) {
        // Non-critical, continue initialization
        console.warn('Could not load governance policy:', error)
      }
      
      updateProgress('governance', 'complete')

      // Initialize UI Awareness
      updateProgress('ui', 'loading')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Load UI awareness (if available)
      try {
        const uiResponse = await fetch('/api/contexts/ui-awareness')
        if (uiResponse.ok) {
          await uiResponse.json()
        }
      } catch (error) {
        // Non-critical, continue initialization
        console.warn('Could not load UI awareness:', error)
      }
      
      updateProgress('ui', 'complete')

      // Mark initialization as complete
      setStatus('complete')
      
      // Store initialization completion in sessionStorage
      sessionStorage.setItem('donna_context_initialized', 'true')
      sessionStorage.setItem('donna_context_init_time', Date.now().toString())
      
      // Don't automatically set demo session - require login even in preview mode

      // Wait a moment to show completion state, then call onComplete
      setTimeout(() => {
        onComplete()
      }, 500)
    } catch (error) {
      console.error('DONNA Context initialization error:', error)
      setStatus('error')
      if (onError) {
        onError(error instanceof Error ? error : new Error('Initialization failed'))
      }
    }
  }

  const allComplete = progress.every(item => item.status === 'complete')
  const hasError = progress.some(item => item.status === 'error')

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center">
      {/* Main loading content */}
      <div className="flex flex-col items-center justify-center max-w-md w-full px-6">
        {/* Brain logo with pulse animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl mb-4"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🧠
          </motion.div>
        </motion.div>

        {/* DONNA text */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-light mb-2 tracking-wider"
        >
          DONNA
        </motion.div>

        {/* Initialization status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-white/70 mb-8"
        >
          {status === 'initializing' && 'Initializing Context...'}
          {status === 'complete' && 'Context Initialized'}
          {status === 'error' && 'Initialization Error'}
        </motion.div>

        {/* Progress items */}
        <div className="w-full space-y-3 mb-8">
          <AnimatePresence>
            {progress.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className={`flex-shrink-0 ${
                  item.status === 'complete' ? 'text-green-400' :
                  item.status === 'loading' ? 'text-blue-400 animate-pulse' :
                  item.status === 'error' ? 'text-red-400' :
                  'text-white/40'
                }`}>
                  {item.status === 'complete' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">
                    {item.label}
                  </div>
                  {item.status === 'loading' && (
                    <div className="text-xs text-white/50 mt-1">
                      Loading...
                    </div>
                  )}
                </div>
                {item.status === 'loading' && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {status === 'initializing' && (
          <div className="w-full max-w-xs">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-donna-purple to-donna-cyan"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(progress.filter(p => p.status === 'complete').length / progress.length) * 100}%` 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

