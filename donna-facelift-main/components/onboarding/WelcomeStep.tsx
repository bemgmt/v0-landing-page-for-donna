"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Upload, Check, FileText } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { ChatBubble } from '@/components/ui/chat-bubble'
import { FuturisticInput } from '@/components/ui/futuristic-input'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'

interface Message {
  id: string
  role: 'assistant' | 'user'
  text: string
  timestamp: Date
}

export function WelcomeStep() {
  const { updateUserData, completeStep } = useOnboarding()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userData, setUserData] = useState({ name: '', businessName: '' })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const questions = [
    {
      id: 'greeting',
      text: "Hi there! I'm DONNA, your AI business assistant. I'm so excited to meet you! 🎉\n\nWhat should I call you?",
      field: 'name' as const
    },
    {
      id: 'business',
      text: (name: string) => `Great to meet you, ${name}! 😊\n\nWhat's the name of your business?`,
      field: 'businessName' as const
    },
    {
      id: 'documents',
      text: (name: string, business: string) => 
        `Perfect! Now, would you like to upload any documents to help me understand your business better? (Optional)\n\nYou can upload business plans, product catalogs, or any relevant files.`,
      field: null,
      isOptional: true
    },
    {
      id: 'complete',
      text: (name: string, business: string) => 
        `Excellent, ${name}! I'm ready to help ${business} succeed.\n\nLet's continue setting up your experience!`,
      field: null
    }
  ]

  // Initialize with first question
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage('assistant', questions[0].text as string)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-advance when on complete step - use useEffect for reliable timer (survives re-renders)
  const isCompleteStep = currentQuestion === questions.length - 1
  useEffect(() => {
    if (!isCompleteStep) return
    const timer = setTimeout(() => {
      completeStep('welcome')
    }, 3000)
    return () => clearTimeout(timer)
  }, [isCompleteStep, completeStep])

  const addMessage = (role: 'assistant' | 'user', text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])

    // Trigger light bar animation for DONNA messages
    if (role === 'assistant') {
      window.dispatchEvent(new CustomEvent('donna:start-speaking', {
        detail: { intensity: 0.8 }
      }))
      setTimeout(() => {
        window.dispatchEvent(new Event('donna:stop-speaking'))
      }, 2000)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentInput.trim()) return

    const question = questions[currentQuestion]
    const value = currentInput.trim()

    // Add user message
    addMessage('user', value)
    setCurrentInput('')

    // Update user data
    if (question.field) {
      const newUserData = { ...userData, [question.field]: value }
      setUserData(newUserData)
      updateUserData(newUserData)
      
      // Show visual confirmation
      setShowConfirmation(question.field)
      setTimeout(() => {
        setShowConfirmation(null)
      }, 2000)
    }

    // Move to next question
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion)
        const nextQ = questions[nextQuestion]
        const text = typeof nextQ.text === 'function'
          ? nextQ.text(userData.name || value, userData.businessName)
          : nextQ.text
        addMessage('assistant', text)
        // useEffect handles auto-complete when we reach the last question
      }
    }, 800)
  }

  const handleSkip = () => {
    completeStep('welcome')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setIsUploading(true)
      setTimeout(() => {
        setUploadedFiles(files)
        setIsUploading(false)
        // Show confirmation
        setShowConfirmation('documents')
        setTimeout(() => {
          setShowConfirmation(null)
        }, 2000)
      }, 500)
    }
  }

  const handleSkipDocuments = () => {
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion)
        const nextQ = questions[nextQuestion]
        const text = typeof nextQ.text === 'function'
          ? nextQ.text(userData.name, userData.businessName)
          : nextQ.text
        addMessage('assistant', text)
        // useEffect handles auto-complete when we reach the last question
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <GlassCard className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-donna-purple to-donna-cyan mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-semibold text-white">Welcome to DONNA</h1>
            <p className="text-sm text-white/70">Let&apos;s get to know each other</p>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  variant={message.role === 'assistant' ? 'donna' : 'user'}
                  className={message.role === 'user' ? 'ml-auto' : ''}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                </ChatBubble>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          {currentQuestion < questions.length - 1 && questions[currentQuestion].field && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <FuturisticInput
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full"
                  autoFocus
                />
                {/* Visual Confirmation */}
                {showConfirmation === questions[currentQuestion].field && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-donna-purple to-donna-cyan flex items-center justify-center relative"
                    >
                      {/* Expanding glow */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-donna-purple/50"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6, repeat: 1 }}
                      />
                      <Check className="w-4 h-4 text-white relative z-10" />
                    </motion.div>
                  </motion.div>
                )}
              </div>
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
                <NeonButton type="submit" disabled={!currentInput.trim()}>
                  <Send className="w-4 h-4" />
                  Send
                </NeonButton>
              </div>
            </form>
          )}

          {/* Complete step: visible Continue button (auto-advances in 3s too) */}
          {isCompleteStep && (
            <div className="flex justify-end pt-2">
              <NeonButton onClick={() => completeStep('welcome')}>
                Continue
              </NeonButton>
            </div>
          )}

          {/* Document Upload Section */}
          {currentQuestion < questions.length - 1 && questions[currentQuestion].id === 'documents' && (
            <div className="space-y-4">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-donna-purple/50 transition-colors relative overflow-hidden"
                >
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-donna-purple/10 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-donna-purple border-t-transparent rounded-full"
                      />
                    </motion.div>
                  )}
                  <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-white/50">TXT, PDF, DOC, DOCX, XLS, PPT (max 10MB each)</p>
                  {showConfirmation === 'documents' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-4 inline-flex items-center gap-2 text-donna-purple"
                    >
                      <Check className="w-5 h-5" />
                      <span className="text-sm">Files uploaded successfully!</span>
                    </motion.div>
                  )}
                </motion.div>
              </label>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-white/70 mb-2">Uploaded files:</p>
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <FileText className="w-4 h-4 text-donna-purple" />
                      <span className="text-sm text-white/80 flex-1">{file.name}</span>
                      <span className="text-xs text-white/50">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleSkipDocuments}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
                <NeonButton
                  onClick={() => {
                    setTimeout(() => {
                      const nextQuestion = currentQuestion + 1
                      if (nextQuestion < questions.length) {
                        setCurrentQuestion(nextQuestion)
                        const nextQ = questions[nextQuestion]
                        const text = typeof nextQ.text === 'function'
                          ? nextQ.text(userData.name, userData.businessName)
                          : nextQ.text
                        addMessage('assistant', text)
                        // useEffect handles auto-complete when we reach the last question
                      }
                    }, 800)
                  }}
                >
                  Continue
                </NeonButton>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}

