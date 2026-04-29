import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA for home services",
  description:
    "Operational intelligence for contractors and home services — scheduling, dispatch coordination, and customer follow-through in one system.",
  path: "/industries/home-services",
})

export default function HomeServicesIndustryPage() {
  return (
    <MarketingSubpageShell
      title="DONNA for home services"
      lead="Technicians, dispatch, and office staff stay synchronized so jobs start on time and customers stay informed."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          Home services businesses run on calls, texts, and tight schedules. DONNA unifies those channels with tasks
          and reminders so revenue work is not lost in the noise.
        </p>
        <p>
          <Link href="/what-is-donna" className="text-accent hover:underline">
            What is DONNA
          </Link>{" "}
          ·{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Contact
          </Link>
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
