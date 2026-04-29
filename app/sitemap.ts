import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"
import { PUBLIC_SITEMAP_PATHS } from "@/lib/public-routes"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  return PUBLIC_SITEMAP_PATHS.map((entry) => ({
    url: `${base}${entry.path === "/" ? "/" : entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency ?? "monthly",
    priority: entry.priority ?? 0.5,
  }))
}
