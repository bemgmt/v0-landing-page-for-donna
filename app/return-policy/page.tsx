import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/breadcrumb'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: "Cancellation & Refund Policy",
  description: "Cancellation and refund policy for DONNA subscriptions and services.",
  path: "/return-policy",
})

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb />

        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cancellation & Refund Policy</h1>
          <p className="text-foreground/70 text-lg">
            We offer a 30-day free trial from the date of sign up, during which you can cancel at any time.
            Refund requests for subscription charges must be submitted within 30 days of the transaction.
          </p>
        </header>

        <section className="mt-10 space-y-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Trial Cancellation</h2>
            <p className="text-foreground/80">
              You can cancel your trial at any time during the first 30 days at no cost. If you do not cancel,
              your chosen plan subscription will begin automatically. Refund requests for any charge must be submitted within 30 days of the charge date, provided the applicable plan usage limits have not been exceeded.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">How to Cancel or Request a Refund</h2>
            <p className="text-foreground/80">
              Email us at{' '}
              <a
                href="mailto:info@bemdonna.com"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                info@bemdonna.com
              </a>{' '}
              with your name, the email used for the account, the sign-up date, and your request.
              If you are requesting a refund for a billing charge, please include the invoice or payment ID.
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
              Requests made after 30 days of a transaction, or after usage limits have been
              exceeded, are not eligible for a refund. We also reserve the right
              to deny requests for suspected abuse, chargeback activity, or
              violations of our terms.
            </p>
          </div>

          <p className="text-sm text-foreground/60 text-center">
            Last updated: June 8, 2026
          </p>
        </section>
      </div>
    </div>
  )
}
