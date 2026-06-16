"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Check, Sparkles, MessageSquare } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { PERSONALITY_PRESETS } from '@/lib/constants/personalities'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'

type SelectionMode = 'choose' | 'upload' | 'preset'

export function PersonalityStep() {
  const { updatePersonality, completeStep } = useOnboarding()
  const [mode, setMode] = useState<SelectionMode>('choose')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId)
    updatePersonality({ type: 'preset', selectedPreset: presetId })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(files)
    updatePersonality({ type: 'upload', uploadedConversations: files })
  }

  const handleContinue = () => {
    setShowConfirmation(true)
    setTimeout(() => {
      completeStep('personality')
    }, 2000)
  }

  const handleSkip = () => {
    // Use default personality
    updatePersonality({ type: 'preset', selectedPreset: 'professional' })
    completeStep('personality')
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-donna-purple to-donna-cyan"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-semibold text-white">Perfect!</h2>
          <p className="text-white/70">Your personality is all set. Let&apos;s continue!</p>
        </motion.div>
      </div>
    )
  }

  if (mode === 'choose') {
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
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-semibold text-white">Choose DONNA&apos;s Personality</h1>
            <p className="text-white/70">How would you like DONNA to communicate with you?</p>
          </div>

          {/* Selection Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard
                className="p-6 cursor-pointer hover:border-donna-purple/50 transition-all group"
                onClick={() => setMode('preset')}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-donna-purple/20 flex items-center justify-center group-hover:bg-donna-purple/30 transition-colors">
                      <MessageSquare className="w-6 h-6 text-donna-purple" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">Choose a Preset</h3>
                      <p className="text-sm text-white/60">Select from our curated personalities</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Pick from professionally designed personalities that match different communication styles and business needs.
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard
                className="p-6 cursor-pointer hover:border-donna-cyan/50 transition-all group"
                onClick={() => setMode('upload')}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-donna-cyan/20 flex items-center justify-center group-hover:bg-donna-cyan/30 transition-colors">
                      <Upload className="w-6 h-6 text-donna-cyan" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">Upload Samples</h3>
                      <p className="text-sm text-white/60">Train DONNA with your style</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Upload sample conversations or communications to help DONNA learn your unique voice and style.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Skip - Use default personality
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (mode === 'preset') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-white">Select a Personality</h1>
            <p className="text-white/70">Choose the communication style that fits your needs</p>
          </div>

          {/* Personality Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERSONALITY_PRESETS.map((preset, index) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <GlassCard
                  className={`p-6 cursor-pointer transition-all relative overflow-hidden ${
                    selectedPreset === preset.id
                      ? 'border-donna-purple ring-2 ring-donna-purple/50'
                      : 'hover:border-donna-purple/30'
                  }`}
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  {/* Glowing background effect when selected */}
                  {selectedPreset === preset.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-donna-purple/10 to-donna-cyan/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Expanding glow on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-donna-purple/0 to-donna-cyan/0 pointer-events-none"
                    whileHover={{
                      background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  <div className="space-y-4 relative z-10">
                    {/* Icon and Name */}
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="text-4xl"
                        animate={selectedPreset === preset.id ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {preset.icon}
                      </motion.span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{preset.name}</h3>
                        {selectedPreset === preset.id && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center gap-1 text-xs text-donna-purple"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Check className="w-3 h-3" />
                            </motion.div>
                            Selected
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/70">{preset.description}</p>

                    {/* Traits */}
                    <div className="flex flex-wrap gap-2">
                      {preset.traits.map((trait, traitIndex) => (
                        <motion.span
                          key={trait}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + traitIndex * 0.05 }}
                          whileHover={{ 
                            scale: 1.1,
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            borderColor: 'rgba(168, 85, 247, 0.5)'
                          }}
                          className="px-2 py-1 text-xs rounded-full bg-white/5 text-white/60 border border-white/10 transition-colors cursor-default"
                        >
                          {trait}
                        </motion.span>
                      ))}
                    </div>

                    {/* Sample Response */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      whileHover={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderColor: 'rgba(168, 85, 247, 0.3)'
                      }}
                      className="p-3 rounded-lg bg-black/20 border border-white/10 transition-colors"
                    >
                      <p className="text-xs text-white/50 mb-1">Sample response:</p>
                      <p className="text-sm text-white/80 italic">&quot;{preset.sampleResponse}&quot;</p>
                    </motion.div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMode('choose')}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Skip
              </button>
              <NeonButton
                onClick={handleContinue}
                disabled={!selectedPreset}
              >
                Continue
              </NeonButton>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Upload mode
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white">Upload Sample Conversations</h1>
          <p className="text-white/70">Help DONNA learn your communication style</p>
        </div>

        {/* Upload Area */}
        <GlassCard className="p-8">
          <label className="block cursor-pointer">
            <input
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-donna-purple/50 transition-colors">
              <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/70 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-white/50">TXT, PDF, DOC, DOCX (max 10MB each)</p>
            </div>
          </label>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-2"
            >
              <p className="text-sm text-white/70 mb-3">Uploaded files:</p>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/80 flex-1">{file.name}</span>
                  <span className="text-xs text-white/50">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('choose')}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Skip
            </button>
            <NeonButton
              onClick={handleContinue}
              disabled={uploadedFiles.length === 0}
            >
              Continue
            </NeonButton>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
