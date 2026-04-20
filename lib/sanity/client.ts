import { createClient, type SanityClient } from "@sanity/client"

let client: SanityClient | null = null

export function getSanityClient(): SanityClient | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"
  if (!projectId) return null
  if (!client) {
    client = createClient({
      projectId,
      dataset,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
      useCdn: process.env.NODE_ENV === "production",
    })
  }
  return client
}

export type PortalCopy = {
  _id: string
  portalNavLabel?: string
  portalHelpMarkdown?: string
}

export async function fetchPortalCopy(): Promise<PortalCopy | null> {
  const c = getSanityClient()
  if (!c) return null
  const q = `*[_type == "portalCopy" && _id == "portalCopy"][0]{ _id, portalNavLabel, portalHelpMarkdown }`
  return c.fetch<PortalCopy | null>(q)
}

export type SiteSettings = {
  _id: string
  siteName?: string
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const c = getSanityClient()
  if (!c) return null
  const q = `*[_type == "siteSettings" && _id == "siteSettings"][0]{ _id, siteName }`
  return c.fetch<SiteSettings | null>(q)
}
