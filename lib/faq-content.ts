/** Shared FAQ copy for UI + JSON-LD: operational intelligence positioning (not chatbot-first). */
export type MarketingFaq = {
  question: string
  answer: string
}

export type MarketingFaqSection = {
  title: string
  description: string
  items: MarketingFaq[]
}

export const faqSections: MarketingFaqSection[] = [
  {
    title: "Understanding DONNA",
    description: "What DONNA is designed to do and how it fits into a real-estate business.",
    items: [
      {
        question: "What is DONNA?",
        answer:
          "DONNA is operational intelligence for real estate. It connects communication, coordination, knowledge, and governed action inside a business so follow-through does not depend entirely on memory and manual chasing.",
      },
      {
        question: "Who is DONNA for?",
        answer:
          "DONNA is starting with real estate: agents, brokerages, transaction coordinators, lenders, title, escrow, inspectors, insurance, and related providers. Real estate is the first market for a broader SMB platform over time.",
      },
      {
        question: "How is DONNA different from a chatbot, CRM, or generic AI assistant?",
        answer:
          "Chatbots answer prompts and CRMs store records. DONNA connects business context to governed action across configured communication, calendar, contact, knowledge, and workflow capabilities. It is not a promise of unrestricted autonomy or a replacement for professional judgment.",
      },
      {
        question: "Do I have to change the way I currently work?",
        answer:
          "The goal is no. DONNA is designed to fit around the way real-estate professionals already communicate and operate. Some workflows may improve as easier approaches are identified, but you should not have to rebuild your entire business around another application.",
      },
      {
        question: "Do I have to constantly give DONNA prompts?",
        answer:
          "No. You can ask DONNA questions or give it instructions, but the larger goal is to use the context and permissions in your configured workspace to monitor authorized workflows, identify next steps, and surface what needs your attention.",
      },
    ],
  },
  {
    title: "Getting started and daily use",
    description: "What setup involves, what DONNA needs from you, and how permissions work.",
    items: [
      {
        question: "What do I have to do to get DONNA set up?",
        answer:
          "Create your account, connect the supported tools you use, describe your business and working preferences, add useful knowledge such as procedures and checklists, choose which actions require approval, and test the setup. See the Getting Started guide for the complete six-step path.",
      },
      {
        question: "What do I have to do every day to keep DONNA working?",
        answer:
          "Very little once your workspace is configured. DONNA is designed to monitor the systems and workflows you have authorized, handle permitted routine work, and bring responses, deadlines, outstanding items, approvals, and unusual situations to your attention.",
      },
      {
        question: "How much do I have to approve?",
        answer:
          "That depends on the boundaries you set. A cautious setup can keep external actions in review; an assisted setup can allow routine, low-risk actions; and a more trusted setup can execute predefined workflows while escalating exceptions. Available controls depend on the specific workspace and deployment, and you remain responsible for the permissions you grant.",
      },
      {
        question: "Can DONNA take actions without me knowing?",
        answer:
          "DONNA is designed around permissioned actions, confirmation-aware execution, and oversight. You decide what it may do, what requires approval, and what it should never do automatically. Action and activity records are available where supported by the deployment.",
      },
    ],
  },
  {
    title: "Tools and transactions",
    description: "How DONNA works with existing systems and with people who do not use DONNA.",
    items: [
      {
        question: "Does DONNA replace my CRM?",
        answer:
          "Not necessarily. DONNA is designed to work across supported systems rather than forcing an immediate replacement. You may later decide that some overlapping tools are no longer necessary, but that choice remains yours.",
      },
      {
        question: "What can DONNA connect to?",
        answer:
          "DONNA can be configured around communication, calendars, contacts, business knowledge, files, and workflow execution. Support for a particular CRM, transaction-management platform, accounting product, MLS, or other real-estate system depends on that platform, available credentials and APIs, connector health, and the current DONNA deployment. Specific connections should be confirmed during onboarding rather than assumed.",
      },
      {
        question: "Can DONNA help with a transaction if nobody else is using DONNA?",
        answer:
          "Yes. Within the capabilities and permissions configured for your workspace, DONNA can help organize communication, monitor deadlines, track outstanding items, coordinate follow-ups, maintain transaction context, and flag what needs your attention while other parties continue using normal channels.",
      },
      {
        question: "What changes when the other professionals have DONNA too?",
        answer:
          "That is the long-term value of the DONNA Intelligence Network. With the proper permissions, participating businesses could coordinate approved requests, updates, availability, and handoffs between their DONNAs. Cross-business DIN workflows remain roadmap and vision capabilities unless separately confirmed for a deployment.",
      },
    ],
  },
  {
    title: "The DONNA Intelligence Network",
    description: "How DIN is intended to support coordination and professional relationships.",
    items: [
      {
        question: "What is the DONNA Intelligence Network (DIN)?",
        answer:
          "DIN is the operating network DONNA is building for permissioned coordination and privacy-preserving intelligence between real-estate businesses. DONNA operates inside a business; DIN is intended to help participating DONNAs coordinate across businesses. Cross-business coordination is roadmap and long-term vision unless separately confirmed for a deployment.",
      },
      {
        question: "How are referrals intended to work through DIN?",
        answer:
          "DIN is intended to support professional discovery as well as transaction coordination. For example, a Realtor could ask for a participating inspector available in a particular area and time window. The same model could extend to lenders, escrow, title, photography, cleaning, legal services, and other real-estate professionals as network capabilities become available.",
      },
      {
        question: "Will DIN replace my preferred vendors and relationships?",
        answer:
          "No. DONNA should understand and preserve your preferred relationships. DIN is intended to help when a usual provider is unavailable, when you need a specialty or a provider outside your normal area, or when you specifically ask for another option. It is designed as a relationship amplifier, not a relationship disruptor.",
      },
    ],
  },
  {
    title: "Privacy and control",
    description: "The boundaries around client information, network learning, and account data.",
    items: [
      {
        question: "How does DONNA treat security and privacy?",
        answer:
          "DONNA uses permission boundaries, confirmation-aware execution, recipient resolution, and controls designed to reduce prompt-injection risk. Action and activity records support oversight, while available audit views depend on the deployment. We do not claim certifications unless they are formally documented.",
      },
      {
        question: "Can other Realtors see my client information?",
        answer:
          "No. Participating in DIN does not mean broadcasting your client database. Private business and client information remains within the authorized environment and workflows; information should move between businesses only for an authorized purpose and with appropriate permission.",
      },
      {
        question: "If DIN learns from the network, does that mean it shares my data?",
        answer:
          "No. Learning from operational patterns is not the same as exposing raw customer data. The network is intended to become more useful without turning identifiable client information, financial details, or private business records into shared network information.",
      },
      {
        question: "What happens to my information if I cancel?",
        answer:
          "You can cancel service and stop additional authorized actions. Customer-identifiable operational data is handled under DONNA's applicable privacy, retention, legal, security, billing, and audit obligations. Specific deletion timelines are not promised until a formal data-lifecycle and account-termination policy is published; contact us for an account-specific privacy request.",
      },
    ],
  },
  {
    title: "Plans, seats, and access",
    description: "Current early-adopter terms and how account access is structured.",
    items: [
      {
        question: "What is a seat?",
        answer:
          "A seat represents one person with their own DONNA access, context, permissions, and accountability. A solo Realtor normally uses one seat; a team or brokerage can use separate seats for people who need their own access and responsibilities.",
      },
      {
        question: "What does platform usage mean?",
        answer:
          "Usage allowances are managed within the platform and vary by plan and configured capabilities. The intent is to describe usage in understandable operational categories rather than technical AI terminology. Confirm the allowances and what happens at a limit before selecting a plan.",
      },
      {
        question: "How do I get early adopter or private access?",
        answer:
          "The early-adopter offer is available to the first 100 customer accounts. Core is $500 per month with three total seats; Full Access is $1,000 per month with six. Both include a 30-day free trial, require a credit card, and are subject to plan usage limits.",
      },
      {
        question: "How does the 30-day trial work?",
        answer:
          "Both early-adopter plans include a 30-day free trial and require a credit card. You may cancel during the trial at no cost; if you do not cancel, your selected subscription begins automatically. See the Cancellation & Refund Policy for the current terms.",
      },
      {
        question: "Does DONNA offer association or organizational pricing?",
        answer:
          "DONNA is developing a qualified Network Partner Program for associations, brokerages, franchises, enterprises, and membership organizations. Preferred terms would be based on active customer-account commitments, coordinated onboarding, and an organizational agreement. Exact partner rates are not yet a public pricing tier.",
      },
    ],
  },
]

export const marketingFaqs: MarketingFaq[] = faqSections.flatMap((section) => section.items)

const featuredQuestions = new Set([
  "What is DONNA?",
  "Who is DONNA for?",
  "How is DONNA different from a chatbot, CRM, or generic AI assistant?",
  "What do I have to do to get DONNA set up?",
  "What can DONNA connect to?",
  "Can DONNA help with a transaction if nobody else is using DONNA?",
  "What is the DONNA Intelligence Network (DIN)?",
  "How does DONNA treat security and privacy?",
  "How do I get early adopter or private access?",
])

export const featuredMarketingFaqs = marketingFaqs.filter((faq) => featuredQuestions.has(faq.question))
