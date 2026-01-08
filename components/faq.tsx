"use client"

import { useState } from "react"
import { useInView } from "react-intersection-observer"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "What is DONNA?",
    answer:
      "DONNA (Digital Operations Neural Network Assistant) is an agentic, multi-modal AI operations platform that functions as a digital employee layer. Unlike chatbots or CRMs, DONNA controls tools, coordinates workflows, and connects with other DONNAs across networks to handle communication, sales, marketing, and operations 24/7.",
  },
  {
    question: "What is the DONNA to DONNA Network?",
    answer:
      "The DONNA to DONNA Network is a secure, permissioned AI to AI communication layer that allows DONNAs to discover one another, exchange structured requests, share outcomes, and coordinate actions across organizations. This enables B2B automation, cross-promotion, vendor coordination, and more—all without manual handoffs.",
  },
  {
    question: "How does DONNA control tools vs. just suggesting actions?",
    answer:
      "DONNA has system authority to control your tools directly. It can send emails, create documents, launch campaigns, generate invoices, trigger workflows, and execute tasks autonomously—not just recommend what you should do. You maintain oversight and can review, approve, or override any action.",
  },
  {
    question: "What makes DONNA 'agentic'?",
    answer:
      "DONNA is agentic because it reasons, plans, executes, and reflects on outcomes independently. It's not scripted—it thinks through problems, creates plans, takes action, and learns from results. This allows DONNA to handle complex, multi-step tasks and adapt to new situations without retraining.",
  },
  {
    question: "Can DONNA work across multiple departments?",
    answer:
      "Yes! DONNA is role fluid, meaning it can dynamically shift between roles—sales, marketing, operations, secretary—without retraining. You can deploy multiple DONNAs for different departments, or one DONNA that handles multiple functions. DONNAs can also coordinate with each other across departments.",
  },
  {
    question: "How does DONNA ensure safety and prevent abuse?",
    answer:
      "DONNA includes built-in governance and safety features: rate limiting, abuse detection, language moderation, and automatic escalation to human admins. All actions are logged and auditable. You can set approval gates for sensitive operations, and DONNA always knows when to hand off to humans.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Setup typically takes 15-30 minutes. We guide you through connecting your phone, email, calendar, and CRM. Most customers are live within an hour.",
  },
  {
    question: "Can DONNA handle multiple languages?",
    answer:
      "Yes! DONNA supports 25+ languages and can seamlessly switch between them during conversations. Perfect for diverse customer bases.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your data is encrypted and stored securely. We never train our models on customer data. You maintain complete ownership and control.",
  },
  {
    question: "Can I customize DONNA for my business?",
    answer:
      "Absolutely. You can train DONNA on your business documents, pricing, policies, and procedures. It learns your business context and gets smarter with every interaction.",
  },
  {
    question: "What integrations are available?",
    answer:
      "We support 600+ integrations including Salesforce, HubSpot, Google Workspace, Microsoft 365, QuickBooks, Slack, Zapier, and more. Custom integrations available too.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Yes, all customers get email support. Pro and Enterprise plans include phone and video support with dedicated success managers.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card rounded-lg overflow-hidden transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-left">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-accent transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-4 pb-4 border-t border-white/10 text-foreground/70">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
