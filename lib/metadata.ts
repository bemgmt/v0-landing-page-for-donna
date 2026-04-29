import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site-url"

/** Path relative to `metadataBase` (see root layout). Brand asset for social previews. */
export const OG_IMAGE_PATH = "/brand/full/donna-logo-1024.png"

export function generatePageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  const baseUrl = getSiteUrl()
  const pathname = path === "/" ? "" : path
  const canonical = `${baseUrl}${pathname || "/"}`

  return {
    title,
    description,
    alternates: {
      canonical: pathname.length ? `${baseUrl}${pathname}` : `${baseUrl}/`,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "DONNA",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1024,
          height: 1024,
          alt: "DONNA",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  }
}
