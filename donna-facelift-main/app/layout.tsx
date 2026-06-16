import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import '@/styles/donna-theme.css'
import ChatWidget from '@/components/chat/ChatWidget'
import SettingsModal from '@/components/SettingsModal'
import DonnaLightBar from '@/components/DonnaLightBar'
import { VoiceProvider } from '@/components/voice/VoiceProvider'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { TourProvider } from '@/contexts/TourContext'
import { DashboardConfigProvider } from '@/contexts/DashboardConfigContext'
import { Toaster } from '@/components/ui/toaster'
import dynamic from 'next/dynamic'
import { InvestorPreviewProvider } from '@/contexts/InvestorPreviewContext'
import { InvestorHeaderToolbar } from '@/components/layout/investor-header-toolbar'
import { InvestorWelcomeRestartControl } from '@/components/investor/investor-welcome-restart-control'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Load tour system client-side only (they use hooks that require client context)
const TourSystem = dynamic(() => import('@/components/tour/TourSystem'), { ssr: false })

// Load web vitals tracking client-side only with error handling
const InvestorWelcomeHost = dynamic(
  () =>
    import('@/components/investor/investor-welcome-host').then((m) => ({
      default: m.InvestorWelcomeHost,
    })),
  { ssr: false }
)

const WebVitalsTracker = dynamic(() => import('./web-vitals').then(mod => {
  // Only call initWebVitals if it exists and we're in browser
  if (typeof window !== 'undefined' && typeof mod.initWebVitals === 'function') {
    try {
      mod.initWebVitals()
    } catch (error) {
      console.warn('Web vitals initialization failed:', error)
    }
  }
  return { default: () => null }
}).catch(() => ({
  default: () => null
})), { ssr: false })

export const metadata: Metadata = {
  title: 'DONNA - AI Assistant Platform',
  description: 'AI-powered business tools for sales, marketing, and productivity',
  generator: 'DONNA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
        <style dangerouslySetInnerHTML={{
          __html: `html {
  font-family: ${inter.style.fontFamily}, system-ui, sans-serif;
  --font-mono: ${GeistMono.variable};
  background: transparent;
}`
        }} />
      </head>
      <body className={`${inter.variable} min-h-screen text-white`} style={{ background: 'transparent' }}>
        <OnboardingProvider>
          <TourProvider>
            <DashboardConfigProvider>
              <InvestorPreviewProvider>
                <VoiceProvider>
                  <div className="donna-bg min-h-screen text-white relative">
                    {/* Single direct child so .donna-bg > * does not force position:relative on fixed overlays */}
                    <div className="relative z-[1] flex min-h-screen flex-col">
                      <DonnaLightBar />
                      <header className="sticky top-0 z-40 w-full shrink-0 border-b border-white/10 glass-dark backdrop-blur">
                        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="text-sm opacity-70 shrink-0">🧠 DONNA</div>
                            <InvestorWelcomeRestartControl />
                          </div>
                          <InvestorHeaderToolbar />
                        </div>
                      </header>
                      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
                        {children}
                      </main>
                      <InvestorWelcomeHost />
                      {/* Floating DONNA chat widget (client component) */}
                      <ChatWidget />
                      {/* Settings modal */}
                      <SettingsModal />
                      {/* Tour system */}
                      <TourSystem />
                      {/* Web vitals tracking */}
                      <WebVitalsTracker />
                      {/* Toast notifications */}
                      <Toaster />
                    </div>
                  </div>
                </VoiceProvider>
              </InvestorPreviewProvider>
            </DashboardConfigProvider>
          </TourProvider>
        </OnboardingProvider>
      </body>
    </html>
  )
}
