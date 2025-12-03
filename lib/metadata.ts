import type { Metadata } from 'next'

export function generatePageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bemdonna.com'
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}${path}`,
      siteName: 'DONNA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

