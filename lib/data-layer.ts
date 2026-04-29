declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/** Push to GTM dataLayer (no-op on server). */
export function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(payload)
}
