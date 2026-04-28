import "server-only"

import path from "node:path"

/** Slugs for authenticated strategic-partner markdown downloads. */
export const STRATEGIC_PARTNER_DOC_SLUGS = [
  "strategic-partner-program",
  "strategic-partner-onboarding",
  "strategic-partner-icp",
  "approved-messaging-guide",
] as const

export type StrategicPartnerDocSlug = (typeof STRATEGIC_PARTNER_DOC_SLUGS)[number]

export type StrategicPartnerDocMeta = {
  slug: StrategicPartnerDocSlug
  title: string
  description: string
  /** Repo-root relative filename (spaces as in workspace). */
  filename: string
}

export const STRATEGIC_PARTNER_DOCS: readonly StrategicPartnerDocMeta[] = [
  {
    slug: "strategic-partner-program",
    title: "Strategic Partner Program",
    description: "Commission structure, payouts, partner pricing, and policies.",
    filename: "DONNA Strategic Partner Program.md",
  },
  {
    slug: "strategic-partner-onboarding",
    title: "Strategic Partner Onboarding Packet",
    description: "How to get started, expectations, and partner journey.",
    filename: "DONNA Strategic Partner Onboarding Packet.md",
  },
  {
    slug: "strategic-partner-icp",
    title: "Strategic Partner ICP Guide",
    description: "Ideal customer profile and positioning support.",
    filename: "DONNA Strategic Partner ICP Guide.md",
  },
  {
    slug: "approved-messaging-guide",
    title: "Approved Messaging & Brand Guide",
    description: "On-brand language and communication guardrails.",
    filename: "DONNA Approved Messaging and Brand Communication Guide.md",
  },
] as const

export function getStrategicPartnerDocPath(filename: string): string {
  return path.join(process.cwd(), filename)
}

export function getStrategicPartnerDocBySlug(slug: string): StrategicPartnerDocMeta | undefined {
  return STRATEGIC_PARTNER_DOCS.find((d) => d.slug === slug)
}
