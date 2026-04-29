import type { MetadataRoute } from "next"

/** Indexable marketing paths — keep in sync with sitemap and llms.txt. */
export const PUBLIC_SITEMAP_PATHS: {
  path: string
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority?: number
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/what-is-donna", changeFrequency: "monthly", priority: 0.9 },
  { path: "/early-adopter-program", changeFrequency: "monthly", priority: 0.9 },
  { path: "/donna-intelligence-network", changeFrequency: "monthly", priority: 0.85 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.85 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.85 },
  { path: "/industries/real-estate", changeFrequency: "monthly", priority: 0.8 },
  { path: "/industries/mortgage", changeFrequency: "monthly", priority: 0.75 },
  { path: "/industries/title", changeFrequency: "monthly", priority: 0.75 },
  { path: "/industries/home-services", changeFrequency: "monthly", priority: 0.75 },
  { path: "/investors", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/security", changeFrequency: "yearly", priority: 0.4 },
  { path: "/return-policy", changeFrequency: "yearly", priority: 0.3 },
]
