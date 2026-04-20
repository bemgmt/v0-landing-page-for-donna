"use client"

import { useEffect } from "react"

/**
 * Registers the app shell service worker so the site is installable as a PWA
 * on HTTPS origins (e.g. aidonna.co, bemdonna.com).
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* non-fatal: manifest-driven install may still apply on some platforms */
    })
  }, [])

  return null
}
