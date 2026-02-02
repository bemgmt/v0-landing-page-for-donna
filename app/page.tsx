import type { Metadata } from 'next'
import ScrollCue from "@/components/scroll-cue"
import ScrollbarFade from "@/components/scrollbar-fade"
import MinimalHeader from "@/components/minimal-header"
import BackgroundAnimation from "@/components/background-animation"
import SectionHero from "@/components/section-hero"
import SectionCapabilities from "@/components/section-capabilities"
import SectionVerticals from "@/components/section-verticals"
import SectionNetwork from "@/components/section-network"
import Security from "@/components/security"
import Pricing from "@/components/pricing"
import SectionCTA from "@/components/section-cta"
import DemoForm from "@/components/demo-form"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import { generatePageMetadata } from '@/lib/metadata'
import { softwareApplicationSchema } from '@/lib/schema-markup'

export const metadata: Metadata = generatePageMetadata({
  title: 'DONNA - Digital Operations Neural Network Assistant',
  description: 'DONNA is an AI operations platform that runs everyday business tasks across departments. It controls tools, coordinates workflows, and supports communications, sales, marketing, and operations 24/7.',
  path: '/',
})

export default function Home() {
  // Schema markup for the home page
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      softwareApplicationSchema({
        name: 'DONNA',
        description: 'Digital Operations Neural Network Assistant - Agentic AI operations platform',
        features: [
          'Agentic AI Operations',
          'Multi-Modal Communication',
          'Tool Control & Automation',
          'DONNA-to-DONNA Network',
          'Sales & Lead Management',
          'Marketing Operations',
          'Secretary & Office Operations',
          'Workflow Automation',
          'Knowledge Base & Memory',
          'Enterprise Integrations',
        ],
      }),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <ScrollCue />
      <ScrollbarFade />
      <MinimalHeader />
      <BackgroundAnimation />
      <div className="ambient-layer" aria-hidden="true" />
      <main id="main-content" className="snap relative z-10">
        <SectionHero />
        <SectionCapabilities />
        <SectionVerticals />
        <SectionNetwork />
        <Security />
        <Pricing />
        <SectionCTA />
        <DemoForm />
        <Footer />
      </main>
      <Chatbot />
    </>
  )
}
