

import { sendGTMEvent } from "@next/third-parties/google"

import { sendGTMEvent } from "@next/third-parties/google"

/** Push to GTM dataLayer (no-op on server). */
export function pushDataLayer(payload: Record<string, unknown>): void {
  sendGTMEvent(payload)
}
