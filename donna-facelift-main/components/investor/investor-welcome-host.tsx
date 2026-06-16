"use client"

import { useCallback, useEffect, useState } from "react"
import {
  useInvestorPreviewOptional,
} from "@/contexts/InvestorPreviewContext"
import { InvestorWelcomeWizard } from "./investor-welcome-wizard"

function isAppReady(): boolean {
  if (typeof window === "undefined") return false
  return (
    localStorage.getItem("donna_demo_session") === "true" &&
    sessionStorage.getItem("donna_context_initialized") === "true"
  )
}

export function InvestorWelcomeHost() {
  const ctx = useInvestorPreviewOptional()
  const [open, setOpen] = useState(false)

  const syncOpen = useCallback(() => {
    if (!ctx) return
    if (!ctx.isInvestorPreview) {
      setOpen(false)
      return
    }
    if (!isAppReady()) {
      setOpen(false)
      return
    }
    setOpen(ctx.welcomeNeedsShow)
  }, [ctx])

  useEffect(() => {
    syncOpen()
  }, [syncOpen])

  useEffect(() => {
    const onAuth = () => syncOpen()
    window.addEventListener("donna:auth-ready", onAuth)
    const t = setInterval(syncOpen, 600)
    return () => {
      window.removeEventListener("donna:auth-ready", onAuth)
      clearInterval(t)
    }
  }, [syncOpen])

  const handleClose = () => {
    ctx?.completeWelcome()
    setOpen(false)
  }

  if (!ctx?.isInvestorPreview) return null

  return <InvestorWelcomeWizard open={open} onClose={handleClose} />
}
