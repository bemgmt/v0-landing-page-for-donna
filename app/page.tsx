import type { Metadata } from "next"
import ScrollCue from "@/components/scroll-cue"
import ScrollbarFade from "@/components/scrollbar-fade"
import MinimalHeader from "@/components/minimal-header"
import BackgroundAnimation from "@/components/background-animation"
import SectionHero from "@/components/section-hero"
import DinHomepage from "@/components/din-homepage"
import Pricing from "@/components/pricing"
import DemoForm from "@/components/demo-form"
import Footer from "@/components/footer"
import Chatbot from "@/components/chatbot"
import CheckoutStatusBanner from "@/components/checkout-status-banner"
import PromoLandingBanner from "@/components/promo-landing-banner"
import StandaloneHomePortalCta from "@/components/standalone-home-portal-cta"
import FAQ from "@/components/faq"
import MobileSiteSignal from "@/components/mobile-site-signal"
import { generatePageMetadata } from "@/lib/metadata"
import { marketingFaqs } from "@/lib/faq-content"
import {
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  webSiteSchema,
} from "@/lib/schema-markup"

export const metadata: Metadata = generatePageMetadata({
  title: "The Intelligence Network for Real Estate",
  description:
    "DONNA provides operational intelligence inside a real-estate business. The DONNA Intelligence Network is building the infrastructure for businesses to coordinate across the industry.",
  path: "/",
})

export default function Home() {
  const orgDescription =
    "DONNA is building the intelligence network for real estate, beginning with operational infrastructure that unifies communication, coordination, and execution inside each business."

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema({ name: "DONNA", description: orgDescription }),
      webSiteSchema(),
      softwareApplicationSchema({
        name: "DONNA",
        description:
          "Operational intelligence for real estate, connecting communication, tasks, knowledge, and governed execution inside each participating business.",
        features: [
          "Connected communication and calendar workflows",
          "Contact, lead, and operational context",
          "Governed drafting, scheduling, messaging, and follow-through",
          "Workspace-configured integrations and permissions",
          "Early adopter access for the first 100 customer accounts",
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
      <PromoLandingBanner />
      <ScrollCue />
      <ScrollbarFade />
      <MinimalHeader />
      <MobileSiteSignal />
      <StandaloneHomePortalCta />
      <BackgroundAnimation />
      <div className="ambient-layer" aria-hidden="true" />
      <main id="main-content" className="snap relative z-10">
        <SectionHero />
        <DinHomepage />
        <Pricing />
        <FAQ id="faq" />
        <DemoForm />
        <Footer />
      </main>
      <Chatbot />
    </>
  )
}
