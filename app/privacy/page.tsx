import type { Metadata } from "next"
import { Breadcrumb } from "@/components/breadcrumb"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Privacy — DONNA",
  description: "Privacy practices for DONNA and bemdonna.com.",
  path: "/privacy",
})

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb />

        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy</h1>
          <p className="text-foreground/70 text-lg">
            How we handle information when you use DONNA and this website.
          </p>
        </header>

        <section className="mt-10 space-y-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Information we collect</h2>
            <p className="text-foreground/80">
              We collect information you provide directly (such as email for sign-in or contact requests),
              technical data typical of web applications (such as IP address, browser type, and approximate
              region), and usage data needed to operate and improve the service.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">How we use information</h2>
            <p className="text-foreground/80">
              We use data to provide and secure the product, authenticate users, communicate about your
              account, analyze reliability and performance, and comply with law. We do not sell your personal
              information.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Third-party services</h2>
            <p className="text-foreground/80">
              We use trusted infrastructure and service providers (for example hosting, email delivery,
              analytics, payments, and AI features) under appropriate agreements. Those providers process data
              only as needed to deliver the services we configure.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p className="text-foreground/80">
              For privacy requests or questions, email{" "}
              <a
                href="mailto:info@bemdonna.com"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                info@bemdonna.com
              </a>
              .
            </p>
          </div>

          <p className="text-sm text-foreground/60 text-center">Last updated: April 19, 2026</p>
        </section>
      </div>
    </div>
  )
}
