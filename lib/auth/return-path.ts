const DEFAULT_RETURN_PATH = "/portal"

export function safeReturnPath(value: string | null | undefined, fallback = DEFAULT_RETURN_PATH) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) {
    return fallback
  }

  return value
}

export function portalReturnPath(value: string | null | undefined) {
  const path = safeReturnPath(value)
  return path === "/portal" || path.startsWith("/portal/") || path.startsWith("/portal?")
    ? path
    : DEFAULT_RETURN_PATH
}
