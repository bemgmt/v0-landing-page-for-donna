"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const DISMISS_KEY = "donna_pwa_install_dismiss_until"
/** Dismissed installs stay hidden for 45 days (see plan). */
const DISMISS_MS = 45 * 24 * 60 * 60 * 1000

type InstallVariant = "ios-safari" | "ios-other" | "android-prompt" | "android-manual"

type BeforeInstallPromptEventExt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone)
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const until = JSON.parse(raw) as { until?: number }
    return typeof until.until === "number" && Date.now() < until.until
  } catch {
    return false
  }
}

function setDismissed(): void {
  localStorage.setItem(DISMISS_KEY, JSON.stringify({ until: Date.now() + DISMISS_MS }))
}

function parseMobile(): { isIOS: boolean; isAndroid: boolean; isIOSSafari: boolean } {
  const ua = navigator.userAgent
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(ua)
  const isIOSSafari = isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)
  return { isIOS, isAndroid, isIOSSafari }
}

export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [variant, setVariant] = useState<InstallVariant | null>(null)
  const deferredRef = useRef<BeforeInstallPromptEventExt | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const dismiss = useCallback(() => {
    setDismissed()
    setShowInstall(false)
    setVariant(null)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (isStandaloneDisplay()) return
    if (isDismissed()) return

    const { isIOS, isAndroid, isIOSSafari } = parseMobile()
    if (!isIOS && !isAndroid) return

    if (isIOS) {
      setVariant(isIOSSafari ? "ios-safari" : "ios-other")
      setShowInstall(true)
      return
    }

    if (isAndroid) {
      let tid: ReturnType<typeof setTimeout> | undefined
      const onBip = (e: Event) => {
        e.preventDefault()
        if (tid !== undefined) window.clearTimeout(tid)
        deferredRef.current = e as BeforeInstallPromptEventExt
        setVariant("android-prompt")
        setShowInstall(true)
      }
      window.addEventListener("beforeinstallprompt", onBip)
      tid = window.setTimeout(() => {
        if (!deferredRef.current) {
          setVariant("android-manual")
          setShowInstall(true)
        }
      }, 3500)
      return () => {
        window.removeEventListener("beforeinstallprompt", onBip)
        if (tid !== undefined) window.clearTimeout(tid)
      }
    }
  }, [mounted])

  const handleAndroidInstall = async () => {
    const ev = deferredRef.current
    if (!ev?.prompt) return
    try {
      await ev.prompt()
      await ev.userChoice
    } catch {
      /* ignore */
    }
    deferredRef.current = null
    dismiss()
  }

  if (!mounted) return null

  return (
    <>
      {showInstall && variant ? (
        <div
          role="dialog"
          aria-labelledby="pwa-install-title"
          className="fixed bottom-0 left-0 right-0 z-[150] border-t border-white/15 bg-background/98 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md md:left-1/2 md:right-auto md:bottom-4 md:max-w-lg md:-translate-x-1/2 md:rounded-xl md:border md:pb-4"
        >
          <div className="mx-auto max-w-lg">
            <h2 id="pwa-install-title" className="text-base font-semibold text-foreground">
              Install DONNA
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Add this site to your home screen for quick access — including{" "}
              <strong className="text-foreground/90">Member Portal</strong>.
            </p>

            {variant === "ios-safari" ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-foreground/90">
                <li>
                  Tap the <strong>Share</strong> button (square with an arrow) in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong>. Open DONNA from your home screen, then tap{" "}
                  <strong>Portal</strong> or <strong>Member Portal</strong> in the header.
                </li>
              </ol>
            ) : null}

            {variant === "ios-other" ? (
              <div className="mt-3 space-y-2 text-sm text-foreground/90">
                <p>
                  <strong className="text-amber-200/90">Tip:</strong> For the most reliable install on iPhone
                  or iPad, open this page in <strong>Safari</strong>, then use Share →{" "}
                  <strong>Add to Home Screen</strong>.
                </p>
                <p className="text-muted-foreground text-xs">
                  In your current browser, look for a Share or menu option — many iOS browsers still offer
                  &quot;Add to Home Screen&quot; from the share sheet.
                </p>
              </div>
            ) : null}

            {variant === "android-manual" ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-foreground/90">
                <li>
                  Tap the <strong>⋮</strong> (three dots) menu in Chrome.
                </li>
                <li>
                  Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </li>
                <li>
                  After installing, long-press the DONNA icon for a shortcut to{" "}
                  <strong>Member Portal</strong> (on supported launchers).
                </li>
              </ol>
            ) : null}

            {variant === "android-prompt" ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-foreground/90">
                  Use the button below to install. Afterward you can open{" "}
                  <strong>Member Portal</strong> from the header or from the app icon shortcuts.
                </p>
                <button
                  type="button"
                  onClick={() => void handleAndroidInstall()}
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90"
                >
                  Install app
                </button>
              </div>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-muted-foreground hover:bg-white/5"
              >
                {variant === "android-prompt" ? "Not now" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
