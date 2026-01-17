import type { Metadata } from 'next'
import IntroOverlay from "@/components/intro-overlay"
import ScrollCue from "@/components/scroll-cue"
import ScrollbarFade from "@/components/scrollbar-fade"
import MinimalHeader from "@/components/minimal-header"
import SectionHero from "@/components/section-hero"
import SectionCapabilities from "@/components/section-capabilities"
import SectionTools from "@/components/section-tools"
import SectionLeadIntel from "@/components/section-lead-intel"
import SectionVerticals from "@/components/section-verticals"
import SectionNetwork from "@/components/section-network"
import Pricing from "@/components/pricing"
import FAQ from "@/components/faq"
import SectionCTA from "@/components/section-cta"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import { generatePageMetadata } from '@/lib/metadata'
import { softwareApplicationSchema, faqSchema } from '@/lib/schema-markup'

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
      faqSchema([
        {
          question: 'What is DONNA?',
          answer: 'DONNA (Digital Operations Neural Network Assistant) is an AI platform that acts as a smart operations manager within your business. It integrates with your tools to handle routine work across departments, not just conversations.',
        },
        {
          question: 'How is DONNA different from a chatbot or VA?',
          answer: 'Chatbots answer questions. DONNA executes workflows. You give it objectives and permissions, and it completes tasks across your systems, with human oversight and approval controls.',
        },
        {
          question: 'Do I need technical expertise to use DONNA?',
          answer: 'No. DONNA is designed for non-technical teams. We handle setup and integrations, and you interact with DONNA in plain language or via a dashboard.',
        },
        {
          question: 'Is my data safe with DONNA?',
          answer: 'Yes. DONNA uses enterprise-grade security and access controls. Data stays in your environment and is encrypted, with configurable permissions and audit logs.',
        },
        {
          question: 'What does the beta cost, and what happens after?',
          answer: 'The beta is paid and limited. Beta partners receive Pro-level access for one year at the Starter plan price, with the option to continue on standard Pro or Enterprise plans afterward.',
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
      <main id="main-content" className="snap relative z-10">
        <SectionHero />
        <SectionCapabilities />
        <SectionTools />
        <SectionLeadIntel />
        <SectionVerticals />
        <SectionNetwork />
        <Pricing />
        <FAQ />
        <SectionCTA />
        <Footer />
      </main>
      <Chatbot />
    </>
  )
}
