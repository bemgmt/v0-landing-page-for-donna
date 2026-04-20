import type { MetadataRoute } from "next"

const THEME = "#000000"
const THEME_ACCENT = "#38bdf8"

export default function manifest(): MetadataRoute.Manifest {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")

  return {
    id: site ? `${site}/` : "/",
    name: "DONNA — AI operational infrastructure",
    short_name: "DONNA",
    description:
      "DONNA unifies communication, coordination, and execution for real estate operators. Nothing gets missed. Everything moves.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "any",
    background_color: THEME,
    theme_color: THEME_ACCENT,
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/brand/icon/donna-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon/donna-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon/donna-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
