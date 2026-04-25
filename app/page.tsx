import type { Metadata } from 'next'
import ScrollCue from "@/components/scroll-cue"
import ScrollbarFade from "@/components/scrollbar-fade"
import MinimalHeader from "@/components/minimal-header"
import BackgroundAnimation from "@/components/background-animation"
import SectionHero from "@/components/section-hero"
import SectionRealEstatePain from "@/components/section-real-estate-pain"
import SectionReframe from "@/components/section-reframe"
import SectionCapabilities from "@/components/section-capabilities"
import SectionVerticals from "@/components/section-verticals"
import SectionNetwork from "@/components/section-network"
import SectionAIHarness from "@/components/section-ai-harness"
import Pricing from "@/components/pricing"
import SectionEarlyAdopter from "@/components/section-early-adopter"
import SectionCTA from "@/components/section-cta"
import SectionExploreFurther from "@/components/section-explore-further"
import DemoForm from "@/components/demo-form"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import CheckoutStatusBanner from "@/components/checkout-status-banner"
import StandaloneHomePortalCta from "@/components/standalone-home-portal-cta"
import { generatePageMetadata } from '@/lib/metadata'
import { softwareApplicationSchema } from '@/lib/schema-markup'

export const metadata: Metadata = generatePageMetadata({
  title: 'DONNA — AI Operational Infrastructure for Real Estate',
  description:
    'DONNA unifies communication, coordination, and execution for brokerages and real estate operators. Early access $500/month. Nothing gets missed. Everything moves.',
  path: '/',
})

export default function Home() {
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      softwareApplicationSchema({
        name: 'DONNA',
        description:
          'AI operational infrastructure for real estate — coordinates agents, staff, vendors, and systems so deals move faster.',
        features: [
          'Deal communication and follow-through',
          'Cross-party coordination (agents, lenders, title, vendors)',
          'Tasks, reminders, and execution across the deal timeline',
          'DONNA Intelligence Network (privacy-preserving patterns)',
          'Early access subscription for brokerages and operators',
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
      <CheckoutStatusBanner />
      <ScrollCue />
      <ScrollbarFade />
      <MinimalHeader />
      <StandaloneHomePortalCta />
      <BackgroundAnimation />
      <div className="ambient-layer" aria-hidden="true" />
      <main id="main-content" className="snap relative z-10">
        <SectionHero />
        <SectionRealEstatePain />
        <SectionReframe />
        <SectionCapabilities />
        <SectionVerticals />
        <SectionNetwork />
        <SectionAIHarness />
        <Pricing />
        <SectionEarlyAdopter />
        <SectionCTA />
        <SectionExploreFurther />
        <DemoForm />
        <Footer />
      </main>
      <Chatbot />
    </>
  )
}
