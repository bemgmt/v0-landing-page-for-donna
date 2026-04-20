import type { Metadata } from "next"
import { Breadcrumb } from "@/components/breadcrumb"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Security — DONNA",
  description: "Security practices for DONNA services and infrastructure.",
  path: "/security",
})

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb />

        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Security</h1>
          <p className="text-foreground/70 text-lg">
            How we approach protecting your data and our systems.
          </p>
        </header>

        <section className="mt-10 space-y-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Infrastructure</h2>
            <p className="text-foreground/80">
              DONNA runs on modern cloud infrastructure with encrypted transport (HTTPS), managed access
              controls, and isolated environments for production workloads. Vendor services are configured
              following least-privilege principles.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Authentication &amp; access</h2>
            <p className="text-foreground/80">
              Member access uses industry-standard authentication. Administrative access is limited, logged,
              and reviewed as appropriate for the product stage. Secrets and keys are stored in secure
              environment configuration—not in source code.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-3">Reporting issues</h2>
            <p className="text-foreground/80">
              If you believe you have found a security vulnerability, please email{" "}
              <a
                href="mailto:info@bemdonna.com"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                info@bemdonna.com
              </a>{" "}
              with a concise description and steps to reproduce. We appreciate responsible disclosure.
            </p>
          </div>

          <p className="text-sm text-foreground/60 text-center">Last updated: April 19, 2026</p>
        </section>
      </div>
    </div>
  )
}
