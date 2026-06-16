"use client"

import { useEffect, useState, useRef } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SettingsInterface from "./interfaces/settings-interface"

export default function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Only set up event listener on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    
    const handleOpen = (e?: Event) => {
      // Find the settings button to anchor the modal
      const settingsButton = document.querySelector('[aria-label="Settings"]') as HTMLButtonElement
      if (settingsButton) {
        settingsButtonRef.current = settingsButton
      }
      setIsOpen(true)
    }
    
    // Listen for the custom event
    window.addEventListener('donna:open-settings', handleOpen as EventListener)
    
    return () => {
      window.removeEventListener('donna:open-settings', handleOpen as EventListener)
    }
  }, [])

  const [position, setPosition] = useState({ top: '80px', right: '24px', minWidth: '400px', maxWidth: '600px' })

  // Calculate position relative to settings button (should be at top of page)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const getModalPosition = () => {
      const button = settingsButtonRef.current || document.querySelector('[aria-label="Settings"]') as HTMLElement
      if (!button) {
        // Fallback to top-right if button not found
        return { top: '80px', right: '24px', minWidth: '400px', maxWidth: '600px' }
      }
      const rect = button.getBoundingClientRect()
      // Position modal below the header, aligned with the settings button at the top
      // Ensure it's always at the top of the page, not bottom
      return {
        top: `${Math.max(rect.bottom + 8, 80)}px`, // At least 80px from top
        right: `${window.innerWidth - rect.right}px`,
        left: 'unset',
        bottom: 'unset',
        minWidth: '400px',
        maxWidth: '600px'
      }
    }

    setPosition(getModalPosition())
  }, [isOpen])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed rounded-xl glass-dark border border-white/20 shadow-2xl"
          style={{
            position: 'fixed',
            top: position.top,
            right: position.right,
            left: position.left || 'unset',
            bottom: position.bottom || 'unset',
            minWidth: position.minWidth,
            maxWidth: position.maxWidth,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-medium text-white">Settings</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <SettingsInterface />
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

