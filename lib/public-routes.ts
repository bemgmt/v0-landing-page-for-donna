import type { MetadataRoute } from "next"

/** Indexable marketing paths — keep in sync with sitemap and llms.txt. */
export const PUBLIC_SITEMAP_PATHS: {
  path: string
  lastModified?: MetadataRoute.Sitemap[number]["lastModified"]
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority?: number
}[] = [
  { path: "/", lastModified: "2026-08-31", changeFrequency: "weekly", priority: 1 },
  { path: "/what-is-donna", lastModified: "2026-08-31", changeFrequency: "monthly", priority: 0.9 },
  { path: "/early-adopter-program", changeFrequency: "monthly", priority: 0.9 },
  { path: "/donna-intelligence-network", changeFrequency: "monthly", priority: 0.85 },
  { path: "/faq", lastModified: "2026-08-31", changeFrequency: "monthly", priority: 0.85 },
  { path: "/getting-started", lastModified: "2026-08-31", changeFrequency: "monthly", priority: 0.85 },
  { path: "/docs", lastModified: "2026-08-31", changeFrequency: "monthly", priority: 0.85 },
  { path: "/tool-audit", changeFrequency: "monthly", priority: 0.85 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.85 },
  { path: "/industries", changeFrequency: "monthly", priority: 0.85 },
  { path: "/industries/real-estate", lastModified: "2026-08-31", changeFrequency: "monthly", priority: 0.8 },
  { path: "/industries/mortgage", changeFrequency: "monthly", priority: 0.75 },
  { path: "/industries/title", changeFrequency: "monthly", priority: 0.75 },
  { path: "/industries/home-services", changeFrequency: "monthly", priority: 0.75 },
  { path: "/privacy", lastModified: "2026-08-31", changeFrequency: "yearly", priority: 0.4 },
  { path: "/security", lastModified: "2026-08-31", changeFrequency: "yearly", priority: 0.4 },
  { path: "/return-policy", changeFrequency: "yearly", priority: 0.3 },
]
