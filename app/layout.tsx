import type React from "react"
import type { Metadata, Viewport } from "next"
import { GoogleTagManager } from "@next/third-parties/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sora } from "next/font/google"
import RegisterServiceWorker from "@/components/register-service-worker"
import PwaInstallPrompt from "@/components/pwa-install-prompt"
import { getSiteUrl } from "@/lib/site-url"
import { OG_IMAGE_PATH } from "@/lib/metadata"

const _sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

const siteUrl = getSiteUrl()
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DONNA | AI Operational Infrastructure for SMBs",
    template: "DONNA | %s",
  },
  description:
    "DONNA is the AI operational infrastructure for SMBs, unifying communication, coordination, and execution so nothing gets missed.",
  generator: "v0.app",
  applicationName: "DONNA",
  appleWebApp: {
    capable: true,
    title: "DONNA",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/icon/donna-icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/icon/donna-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon/donna-icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/icon/donna-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon/donna-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/brand/icon/donna-icon-180.png",
  },
  openGraph: {
    type: "website",
    siteName: "DONNA",
    locale: "en_US",
    images: [{ url: OG_IMAGE_PATH, width: 1024, height: 1024, alt: "DONNA" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE_PATH],
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? ""

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${_sora.variable}`}>
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        {children}
        <RegisterServiceWorker />
        <PwaInstallPrompt />
        <Analytics />
      </body>
    </html>
  )
}
