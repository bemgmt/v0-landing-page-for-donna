"use client"

import { useState } from "react"
import { useInView } from "react-intersection-observer"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "What is DONNA?",
    answer:
      "DONNA (Digital Operations Neural Network Assistant) is an AI platform that acts as a smart operations manager within your business. It integrates with your tools to handle routine work across departments, not just conversations.",
  },
  {
    question: "How is DONNA different from a chatbot or VA?",
    answer:
      "Chatbots answer questions. DONNA executes workflows. You give it objectives and permissions, and it completes tasks across your systems, with human oversight and approval controls.",
  },
  {
    question: "Do I need technical expertise to use DONNA?",
    answer:
      "No. DONNA is designed for non-technical teams. We handle setup and integrations, and you interact with DONNA in plain language or via a dashboard.",
  },
  {
    question: "Is my data safe with DONNA?",
    answer:
      "Yes. DONNA uses enterprise-grade security and access controls. Data stays in your environment and is encrypted, with configurable permissions and audit logs.",
  },
  {
    question: "What does the beta cost, and what happens after?",
    answer:
      "The beta is paid and limited. Beta partners receive Pro-level access for one year at the Starter plan price, with the option to continue on standard Pro or Enterprise plans afterward.",
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
