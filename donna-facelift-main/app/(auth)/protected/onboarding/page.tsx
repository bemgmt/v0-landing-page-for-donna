"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VerticalOptionCard } from "@/components/VerticalOptionCard"
import { Button } from "@/components/ui/button"
import { VERTICALS, type VerticalKey } from "@/lib/constants/verticals"
import { Loader2 } from "lucide-react"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"

export default function OnboardingPage() {
  const router = useRouter()
  const { state } = useOnboarding()
  const [selectedVertical, setSelectedVertical] = useState<VerticalKey | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show new onboarding flow if not complete
  const showNewOnboarding = !state.isComplete

  const handleSelect = (key: VerticalKey) => {
    setSelectedVertical(key)
    setError(null)
  }

  const handleContinue = async () => {
    if (!selectedVertical) {
      setError("Please select an industry to continue")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/vertical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vertical: selectedVertical }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to save selection: ${response.statusText}`)
      }

      // Success - redirect to main dashboard
      router.push('/protected')
    } catch (err) {
      console.error('Error saving vertical selection:', err)
      setError(err instanceof Error ? err.message : 'Failed to save your selection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // If new onboarding is not complete, show the new flow
  if (showNewOnboarding) {
    return <OnboardingFlow />
  }

  // Otherwise show vertical selection (legacy onboarding)
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white">Select Your Industry</h1>
          <p className="text-white/70 text-sm">
            Choose the industry that best matches your business to customize your DONNA experience
          </p>
        </div>

        {/* Vertical Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VERTICALS.map((vertical) => (
            <VerticalOptionCard
              key={vertical.key}
              vertical={vertical}
              isSelected={selectedVertical === vertical.key}
              onSelect={() => handleSelect(vertical.key)}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedVertical || isSubmitting}
            variant="neon"
            size="lg"
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

