import type { Metadata } from "next"
import ScrollCue from "@/components/scroll-cue"
import ScrollbarFade from "@/components/scrollbar-fade"
import MinimalHeader from "@/components/minimal-header"
import BackgroundAnimation from "@/components/background-animation"
import SectionHero from "@/components/section-hero"
import SectionRealEstatePain from "@/components/section-real-estate-pain"
import SectionReframe from "@/components/section-reframe"
import SectionCapabilities from "@/components/section-capabilities"
import SectionStackedLayers from "@/components/section-stacked-layers"
import SectionVerticals from "@/components/section-verticals"
import SectionNetwork from "@/components/section-network"
import SectionTrust from "@/components/section-trust"
import Pricing from "@/components/pricing"
import SectionEarlyAdopter from "@/components/section-early-adopter"
import SectionExploreFurther from "@/components/section-explore-further"
import DemoForm from "@/components/demo-form"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import CheckoutStatusBanner from "@/components/checkout-status-banner"
import StandaloneHomePortalCta from "@/components/standalone-home-portal-cta"
import FAQ from "@/components/faq"
import { generatePageMetadata } from "@/lib/metadata"
import { marketingFaqs } from "@/lib/faq-content"
import {
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  webSiteSchema,
} from "@/lib/schema-markup"

export const metadata: Metadata = generatePageMetadata({
  title: "AI Operational Infrastructure for Real Estate",
  description:
    "DONNA is the AI operational infrastructure for the real estate industry, unifying communication, coordination, and execution so nothing gets missed.",
  path: "/",
})

export default function Home() {
  const orgDescription =
    "DONNA is AI operational infrastructure for the real estate industry that unifies communication, coordination, and execution."

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema({ name: "DONNA", description: orgDescription }),
      webSiteSchema(),
      softwareApplicationSchema({
        name: "DONNA",
        description:
          "AI operational infrastructure for real estate — coordinates communication, tasks, and parties across high-communication operations.",
        features: [
          "Unified communication, coordination, and execution",
          "Cross-party workflows (teams, vendors, clients)",
          "Tasks, reminders, and follow-through across timelines",
          "DONNA Intelligence Network (privacy-preserving operational patterns)",
          "Early access subscriptions for operators and brokerages",
        ],
      }),
      faqSchema(marketingFaqs),
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
        <SectionStackedLayers />
        <SectionNetwork />
        <SectionTrust />
        <SectionVerticals />
        <Pricing />
        <SectionEarlyAdopter />
        <SectionExploreFurther />
        <FAQ id="faq" />
        <DemoForm />
        <Footer />
      </main>
      <Chatbot />
    </>
  )
}
