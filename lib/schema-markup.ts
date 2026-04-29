import { getSiteUrl } from "@/lib/site-url"
import { OG_IMAGE_PATH } from "@/lib/metadata"

export function organizationSchema({
  name,
  description,
}: {
  name: string
  description: string
}) {
  const base = getSiteUrl()
  return {
    "@type": "Organization",
    name,
    url: base,
    logo: `${base}${OG_IMAGE_PATH}`,
    description,
  }
}

export function webSiteSchema() {
  const base = getSiteUrl()
  return {
    "@type": "WebSite",
    name: "DONNA",
    url: base,
    description:
      "DONNA is AI operational infrastructure for SMBs that unifies communication, coordination, and execution.",
    publisher: {
      "@type": "Organization",
      name: "DONNA",
      url: base,
    },
  }
}

export function softwareApplicationSchema({
  name,
  description,
  features,
}: {
  name: string
  description: string
  features: string[]
}) {
  const base = getSiteUrl()
  return {
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      url: `${base}/#pricing`,
      description: "Early access subscription options — see on-site pricing for current plans and terms.",
    },
    featureList: features,
  }
}

export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function breadcrumbListSchema(items: { name: string; path: string }[]) {
  const base = getSiteUrl()
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path === "/" ? "/" : item.path}`,
    })),
  }
}
