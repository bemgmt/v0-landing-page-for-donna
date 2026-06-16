"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Lock, User } from 'lucide-react'
import { NeonButton } from '@/components/ui/neon-button'
import { FuturisticInput } from '@/components/ui/futuristic-input'
import { GlassCard } from '@/components/ui/glass-card'

export default function Page() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // If already authenticated and initialized, redirect to home
  useEffect(() => {
    const demoSession = localStorage.getItem('donna_demo_session')
    const isInitialized = sessionStorage.getItem('donna_context_initialized')
    
    if (demoSession === 'true' && isInitialized === 'true') {
      // User is authenticated and initialized, redirect to home
      router.push('/')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Demo credentials
    if (username === 'DONNA' && password === 'DONNA123') {
      setIsLoading(true)
      
      // Store demo session in localStorage (for client-side checks)
      localStorage.setItem('donna_demo_session', 'true')
      localStorage.setItem('donna_demo_user', username)
      localStorage.setItem('donna_investor_preview', 'true')
      
      // Set cookie for server-side API routes (accessible in preview mode)
      document.cookie = `donna_demo_session=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      document.cookie = `donna_demo_user=${username}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      
      // Simulate login delay
      setTimeout(() => {
        setIsLoading(false)
        // Redirect to home - initialization will happen there if needed
        router.push('/')
      }, 500)
    } else {
      setError('Invalid username or password. Use DONNA / DONNA123 for the investor preview.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0C0F16] to-[#10121A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-donna-purple to-donna-cyan mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-semibold text-white">Welcome to DONNA</h1>
            <p className="text-white/70">Sign in to your account</p>
          </div>

          {/* Demo Credentials Info */}
          <div className="p-4 rounded-lg bg-donna-purple/10 border border-donna-purple/20">
            <p className="text-xs text-white/60 mb-2">Demo Credentials:</p>
            <p className="text-sm text-white/80 font-mono">Username: DONNA</p>
            <p className="text-sm text-white/80 font-mono">Password: DONNA123</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-white/70 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </label>
              <FuturisticInput
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Enter username"
                className="w-full"
                autoFocus
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-white/70 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <FuturisticInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <NeonButton
              type="submit"
              className="w-full"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </NeonButton>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-xs text-white/50">
              This is a demo environment. Use the credentials above to sign in.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
