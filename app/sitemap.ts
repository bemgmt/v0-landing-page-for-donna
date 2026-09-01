import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"
import { PUBLIC_SITEMAP_PATHS } from "@/lib/public-routes"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()

  return PUBLIC_SITEMAP_PATHS.map((entry) => ({
    url: `${base}${entry.path === "/" ? "/" : entry.path}`,
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
    changeFrequency: entry.changeFrequency ?? "monthly",
    priority: entry.priority ?? 0.5,
  }))
}
