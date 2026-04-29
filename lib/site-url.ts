/** Production canonical host per SEO spec; override with NEXT_PUBLIC_SITE_URL in env. */
export const DEFAULT_SITE_URL = "https://aidonna.co"

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) return raw.replace(/\/$/, "")
  return DEFAULT_SITE_URL
}
