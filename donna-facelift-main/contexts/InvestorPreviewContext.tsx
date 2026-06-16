"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const WELCOME_SESSION_KEY = "donna_investor_welcome_v1"
const PREVIEW_STORAGE_KEY = "donna_investor_preview"
const CHAT_OPENED_SESSION_KEY = "donna_investor_chat_opened_v1"

export type InvestorPreviewContextValue = {
  /** Demo login is treated as investor preview when this flag is set at sign-in. */
  isInvestorPreview: boolean
  /** Wizard finished this browser session. */
  welcomeComplete: boolean
  /** True when authenticated + initialized + investor + wizard not done. */
  welcomeNeedsShow: boolean
  /** Pulse the floating chat launcher until wizard done or chat opened. */
  shouldPulseChatbot: boolean
  completeWelcome: () => void
  /** Clear welcome + chat-opened flags so the investor wizard and guided flow can run again this session. */
  restartInvestorWelcome: () => void
  markChatOpened: () => void
  refreshFromStorage: () => void
}

const InvestorPreviewContext = createContext<InvestorPreviewContextValue | null>(
  null
)

function readPreviewFlag(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(PREVIEW_STORAGE_KEY) === "true"
}

function readWelcomeComplete(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(WELCOME_SESSION_KEY) === "done"
}

function readChatOpened(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(CHAT_OPENED_SESSION_KEY) === "true"
}

export function InvestorPreviewProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isInvestorPreview, setIsInvestorPreview] = useState(false)
  const [welcomeComplete, setWelcomeComplete] = useState(false)
  const [chatOpened, setChatOpened] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  const refreshFromStorage = useCallback(() => {
    setIsInvestorPreview(readPreviewFlag())
    setWelcomeComplete(readWelcomeComplete())
    setChatOpened(readChatOpened())
    setSessionReady(true)
  }, [])

  useEffect(() => {
    refreshFromStorage()
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === PREVIEW_STORAGE_KEY ||
        e.key === WELCOME_SESSION_KEY ||
        e.key === CHAT_OPENED_SESSION_KEY
      ) {
        refreshFromStorage()
      }
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("donna:auth-ready", refreshFromStorage)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("donna:auth-ready", refreshFromStorage)
    }
  }, [refreshFromStorage])

  const completeWelcome = useCallback(() => {
    if (typeof window === "undefined") return
    sessionStorage.setItem(WELCOME_SESSION_KEY, "done")
    setWelcomeComplete(true)
  }, [])

  const restartInvestorWelcome = useCallback(() => {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(WELCOME_SESSION_KEY)
    sessionStorage.removeItem(CHAT_OPENED_SESSION_KEY)
    setWelcomeComplete(false)
    setChatOpened(false)
  }, [])

  const markChatOpened = useCallback(() => {
    if (typeof window === "undefined") return
    if (!readPreviewFlag()) return
    sessionStorage.setItem(CHAT_OPENED_SESSION_KEY, "true")
    setChatOpened(true)
  }, [])

  const welcomeNeedsShow = useMemo(() => {
    if (!sessionReady || !isInvestorPreview) return false
    return !welcomeComplete
  }, [sessionReady, isInvestorPreview, welcomeComplete])

  const shouldPulseChatbot = useMemo(() => {
    if (!isInvestorPreview) return false
    return !(welcomeComplete || chatOpened)
  }, [isInvestorPreview, welcomeComplete, chatOpened])

  const value = useMemo<InvestorPreviewContextValue>(
    () => ({
      isInvestorPreview,
      welcomeComplete,
      welcomeNeedsShow,
      shouldPulseChatbot,
      completeWelcome,
      restartInvestorWelcome,
      markChatOpened,
      refreshFromStorage,
    }),
    [
      isInvestorPreview,
      welcomeComplete,
      welcomeNeedsShow,
      shouldPulseChatbot,
      completeWelcome,
      restartInvestorWelcome,
      markChatOpened,
      refreshFromStorage,
    ]
  )

  return (
    <InvestorPreviewContext.Provider value={value}>
      {children}
    </InvestorPreviewContext.Provider>
  )
}

export function useInvestorPreview(): InvestorPreviewContextValue {
  const ctx = useContext(InvestorPreviewContext)
  if (!ctx) {
    throw new Error("useInvestorPreview must be used within InvestorPreviewProvider")
  }
  return ctx
}

export function useInvestorPreviewOptional(): InvestorPreviewContextValue | null {
  return useContext(InvestorPreviewContext)
}
