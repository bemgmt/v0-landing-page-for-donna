import type { Metadata } from 'next'
import Header from "@/components/header"
import Hero from "@/components/hero"
import Features from "@/components/features"
import HowItWorks from "@/components/how-it-works"
import UseCases from "@/components/use-cases"
import Integrations from "@/components/integrations"
import Security from "@/components/security"
import Pricing from "@/components/pricing"
import FAQ from "@/components/faq"
import DemoForm from "@/components/demo-form"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import { generatePageMetadata } from '@/lib/metadata'
import { softwareApplicationSchema, faqSchema } from '@/lib/schema-markup'

export const metadata: Metadata = generatePageMetadata({
  title: 'DONNA - AI-Powered Business Communication Platform',
  description: 'Transform your business communication with DONNA\'s AI-powered voice, email, and chat assistants. Automate lead response, customer support, and appointment scheduling 24/7.',
  path: '/',
})

export default function Home() {
  // Schema markup for the home page
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      softwareApplicationSchema({
        name: 'DONNA',
        description: 'AI-Powered Business Communication Platform',
        features: [
          'Voice Receptionist',
          'Email Assistant',
          'Chatbot',
          'Marketing Bot',
          'Knowledge Base',
          'Integrations',
        ],
      }),
      faqSchema([
        {
          question: 'What is DONNA?',
          answer: 'DONNA is an AI-powered business communication platform that automates lead response, customer support, and appointment scheduling through voice, email, and chat.',
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
      <main id="main-content" className="min-h-screen bg-background">
        <Header />
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <Integrations />
        <Security />
        <Pricing />
        <FAQ />
        <div id="demo-form">
          <DemoForm />
        </div>
        <Footer />
        <Chatbot />
      </main>
    </>
  )
}
