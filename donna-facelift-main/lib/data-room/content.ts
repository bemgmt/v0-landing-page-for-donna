/** Authoritative SAFE copy for the Data Room (matches Investor Memo economics). */

export type SafeTier = {
  investmentLabel: string
  valuationCap: string
  discount: string
}

export const SAFE_TIERS: SafeTier[] = [
  { investmentLabel: "$500,000 SAFE", valuationCap: "$18M valuation cap", discount: "10% discount" },
  { investmentLabel: "$1,000,000 SAFE", valuationCap: "$15M valuation cap", discount: "15% discount" },
  { investmentLabel: "$2,000,000 SAFE", valuationCap: "$12M valuation cap", discount: "20% discount" },
]

export const SAFE_NARRATIVE_PARAGRAPHS = [
  "DONNA is currently evaluating a SAFE financing structure with three potential investment scenarios. Each SAFE includes both a valuation cap and discount, with more favorable economics offered at higher commitment levels.",
  "The current proposed structure is:",
  "This structure is designed to reward larger early commitments while preserving founder flexibility prior to a priced equity round.",
] as const

export const SAFE_BULLETS = [
  { label: "$500,000 SAFE", detail: "10% discount and $18M valuation cap." },
  { label: "$1,000,000 SAFE", detail: "15% discount and $15M valuation cap." },
  { label: "$2,000,000 SAFE", detail: "20% discount and $12M valuation cap." },
] as const

export type DataRoomDoc = {
  title: string
  description: string
  /** Path under public/ → served from site root */
  href: string
  kind: "deck" | "pdf" | "memo"
}

/** Pitch deck — add `public/data-room/AI-DONNA-Co.pdf` for the link to resolve. */
export const DECK_PATH = "/data-room/AI-DONNA-Co.pdf"

export const GENERATED_PDFS: DataRoomDoc[] = [
  {
    title: "Investor Memo",
    description: "$2M SAFE — operational intelligence, GTM, economics.",
    href: "/data-room/pdfs/investor-memo-4-22.pdf",
    kind: "memo",
  },
  {
    title: "Go-To-Market (1-Pager)",
    description: "Category, problem/solution, ICP phases, motion.",
    href: "/data-room/pdfs/gtm-4-22.pdf",
    kind: "pdf",
  },
  {
    title: "ICP Strategy — First 100 Customers",
    description: "Segments, pain, triggers, winning messages.",
    href: "/data-room/pdfs/icp-4-22.pdf",
    kind: "pdf",
  },
  {
    title: "Product Overview",
    description: "Communications, execution, and intelligence layers.",
    href: "/data-room/pdfs/product-overview.pdf",
    kind: "pdf",
  },
  {
    title: "DONNA Doctrine",
    description: "Foundational principles.",
    href: "/data-room/pdfs/donna-doctrine.pdf",
    kind: "pdf",
  },
  {
    title: "DONNA Operating System (Core Principles)",
    description: "Core OS principles.",
    href: "/data-room/pdfs/donna-operating-system-core-principles.pdf",
    kind: "pdf",
  },
  {
    title: "DONNA Product & Ethics Framework",
    description: "Product and ethics guardrails.",
    href: "/data-room/pdfs/donna-product-ethics-framework.pdf",
    kind: "pdf",
  },
  {
    title: "Founder's Note",
    description: "Founder narrative.",
    href: "/data-room/pdfs/founders-note.pdf",
    kind: "pdf",
  },
]
