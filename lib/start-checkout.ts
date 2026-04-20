/**
 * Creates a Stripe Checkout session and redirects the browser to hosted checkout.
 * Call from client components only.
 */
export async function startStripeCheckout(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/checkout", { method: "POST", credentials: "same-origin" })
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
    if (res.status === 401) {
      return {
        ok: false,
        error:
          data.error ??
          "Sign in to the member portal first (Portal link in the header), then try checkout again.",
      }
    }
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Checkout could not be started." }
    }
    if (typeof data.url === "string" && data.url.length > 0) {
      window.location.assign(data.url)
      return { ok: true }
    }
    return { ok: false, error: "No checkout URL returned." }
  } catch {
    return { ok: false, error: "Network error. Please try again." }
  }
}
