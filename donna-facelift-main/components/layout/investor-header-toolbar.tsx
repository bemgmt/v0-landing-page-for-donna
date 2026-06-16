"use client"

import Link from "next/link"
import { FolderArchive, Globe } from "lucide-react"
import dynamic from "next/dynamic"
import { useInvestorPreviewOptional } from "@/contexts/InvestorPreviewContext"
import { DashboardLink } from "@/components/DashboardLink"
import { AuthStatus } from "@/components/AuthStatus"
import SettingsButton from "@/components/SettingsButton"

const VoiceNavButton = dynamic(() => import("@/components/voice/VoiceNavButton"), { ssr: false })

export function InvestorHeaderToolbar() {
  const inv = useInvestorPreviewOptional()
  const lockChrome = inv?.isInvestorPreview ?? false

  return (
    <div className="flex items-center gap-3 text-xs opacity-70">
      <Link
        href="/din"
        className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>Access the DIN</span>
      </Link>
      <Link
        href="/data-room"
        data-tour="data-room-nav"
        className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
      >
        <FolderArchive className="w-3.5 h-3.5" />
        <span>Data Room</span>
      </Link>
      <DashboardLink />
      <AuthStatus />
      <div
        className={lockChrome ? "pointer-events-none opacity-40 select-none" : ""}
        aria-hidden={lockChrome}
        title={lockChrome ? "Disabled in investor preview" : undefined}
      >
        <VoiceNavButton />
      </div>
      <div
        className={lockChrome ? "pointer-events-none opacity-40 select-none" : ""}
        aria-hidden={lockChrome}
        title={lockChrome ? "Disabled in investor preview" : undefined}
      >
        <SettingsButton />
      </div>
    </div>
  )
}
