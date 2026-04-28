"use client"

import { useCallback, useMemo, useState } from "react"
import LoginForm from "@/components/auth/login-form"

type Tab = "member" | "partner"

function resolveInitialTab(nextFromUrl: string): Tab {
  return nextFromUrl.startsWith("/partner") ? "partner" : "member"
}

function nextForTab(tab: Tab, nextFromUrl: string): string {
  if (typeof nextFromUrl === "string" && nextFromUrl.startsWith("/")) {
    if (tab === "partner" && nextFromUrl.startsWith("/partner")) return nextFromUrl
    if (tab === "member" && !nextFromUrl.startsWith("/partner")) return nextFromUrl
  }
  return tab === "partner" ? "/partner" : "/portal"
}

type Props = {
  nextFromUrl: string
}

export default function LoginPanel({ nextFromUrl }: Props) {
  const initialTab = useMemo(() => resolveInitialTab(nextFromUrl), [nextFromUrl])
  const [tab, setTab] = useState<Tab>(initialTab)
  const nextPath = useMemo(() => nextForTab(tab, nextFromUrl), [tab, nextFromUrl])

  const selectMember = useCallback(() => setTab("member"), [])
  const selectPartner = useCallback(() => setTab("partner"), [])

  return (
    <div className="space-y-6">
      <div
        className="flex rounded-xl border border-white/10 p-1 bg-black/40"
        role="tablist"
        aria-label="Sign-in destination"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "member"}
          onClick={selectMember}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "member"
              ? "bg-white/10 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Member
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "partner"}
          onClick={selectPartner}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "partner"
              ? "bg-white/10 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Strategic partner
        </button>
      </div>

      {tab === "member" ? (
        <>
          <h1 className="text-2xl font-semibold gradient-text text-center">DONNA Member Portal</h1>
          <p className="text-sm text-muted-foreground text-center -mt-2">
            Billing, content, community, and support for subscribers and members.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold gradient-text text-center">Strategic Partner Network</h1>
          <p className="text-sm text-muted-foreground text-center -mt-2">
            Sales, commissions, partner documents, and lead tools for approved partners.
          </p>
        </>
      )}

      <LoginForm nextPath={nextPath} />
    </div>
  )
}
