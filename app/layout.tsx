import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sora } from "next/font/google"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

export const metadata: Metadata = {
  title: "DONNA - AI Office Assistant",
  description: "Your AI Office Receptionist That Never Stops",
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  icons: {
    icon: "/DONNA-logo.png",
    shortcut: "/DONNA-logo.png",
    apple: "/DONNA-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${_sora.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
