import type { Metadata } from 'next'
import IntroOverlay from "@/components/intro-overlay"
import ScrollCue from "@/components/scroll-cue"
import ScrollbarFade from "@/components/scrollbar-fade"
import MinimalHeader from "@/components/minimal-header"
import SectionHero from "@/components/section-hero"
import SectionCapabilities from "@/components/section-capabilities"
import SectionVerticals from "@/components/section-verticals"
import SectionNetwork from "@/components/section-network"
import SectionCTA from "@/components/section-cta"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import { generatePageMetadata } from '@/lib/metadata'
import { softwareApplicationSchema, faqSchema } from '@/lib/schema-markup'

export const metadata: Metadata = generatePageMetadata({
  title: 'DONNA - Digital Operations Neural Network Assistant',
  description: 'DONNA is an agentic, multi-modal AI operations platform that functions as your digital employee layer. Control tools, coordinate workflows, and connect with other DONNAs across your network—handling communication, sales, marketing, and operations 24/7.',
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
      faqSchema([
        {
          question: 'What is DONNA?',
          answer: 'DONNA (Digital Operations Neural Network Assistant) is an agentic, multi-modal AI operations platform that functions as a digital employee layer. Unlike chatbots or CRMs, DONNA controls tools, coordinates workflows, and connects with other DONNAs across networks to handle communication, sales, marketing, and operations 24/7.',
        },
        {
          question: 'How does DONNA work?',
          answer: 'DONNA uses advanced AI to understand and respond to customer inquiries across multiple channels, integrating with your existing tools and workflows.',
        },
        {
          question: 'Is DONNA secure?',
          answer: 'Yes, DONNA is built with enterprise-grade security, including SOC 2 compliance, GDPR compliance, and end-to-end encryption.',
        },
      ]),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <IntroOverlay />
      <ScrollCue />
      <ScrollbarFade />
      <MinimalHeader />
      <div className="fixed-background" />
      <main id="main-content" className="snap relative z-10">
        <SectionHero />
        <SectionCapabilities />
        <SectionVerticals />
        <SectionNetwork />
        <SectionCTA />
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}
