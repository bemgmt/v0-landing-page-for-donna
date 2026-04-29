import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/breadcrumb'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: "Return policy",
  description: "Return policy for DONNA subscriptions and services.",
  path: "/return-policy",
})

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb />

        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Return Policy</h1>
          <p className="text-foreground/70 text-lg">
            We offer a 14-day money-back guarantee from the date of purchase,
            provided the applicable plan usage limits have not been exceeded.
          </p>
        </header>

        <section className="mt-10 space-y-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Eligibility</h2>
            <p className="text-foreground/80">
              Refund requests must be submitted within 14 days of purchase and
              are available only if you have not exceeded the applicable plan
              usage limits. We may decline requests associated with fraud,
              abuse, or policy violations.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">How to Request a Refund</h2>
            <p className="text-foreground/80">
              Email us at{' '}
              <a
                href="mailto:info@bemdonna.com"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                info@bemdonna.com
              </a>{' '}
              with your name, the email used for purchase, the purchase date,
              and the reason for your request. If applicable, include any order
              or invoice ID to help us locate your transaction quickly.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Refund Timing</h2>
            <p className="text-foreground/80">
              Approved refunds are issued to the original payment method within
              5–10 business days after approval.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Non-Eligibility</h2>
            <p className="text-foreground/80">
              Requests made after 14 days, or after usage limits have been
              exceeded, are not eligible for a refund. We also reserve the right
              to deny requests for suspected abuse, chargeback activity, or
              violations of our terms.
            </p>
          </div>

          <p className="text-sm text-foreground/60 text-center">
            Last updated: February 2, 2026
          </p>
        </section>
      </div>
    </div>
  )
}
