"use client"

import { useInvestorPreviewOptional } from "@/contexts/InvestorPreviewContext"

/**
 * After the investor welcome wizard is dismissed, surfaces a control to replay the sequence.
 */
export function InvestorWelcomeRestartControl() {
  const inv = useInvestorPreviewOptional()
  if (!inv?.isInvestorPreview || !inv.welcomeComplete) return null

  return (
    <button
      type="button"
      onClick={() => inv.restartInvestorWelcome()}
      className="text-left text-[11px] sm:text-xs leading-snug text-donna-cyan/90 hover:text-donna-cyan border border-donna-cyan/35 hover:border-donna-cyan/55 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 transition-colors max-w-[min(100%,20rem)] sm:max-w-md"
    >
      Investors click here to restart the overlay sequence
    </button>
  )
}
