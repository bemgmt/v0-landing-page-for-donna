"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { marketingFaqs } from "@/lib/faq-content"

export default function FAQ({ id, hideHeading = false }: { id?: string; hideHeading?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id={id} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {!hideHeading ? (
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
        ) : null}

        <div className="space-y-3">
          {marketingFaqs.map((faq, index) => (
            <div
              key={faq.question}
              className="glass-card rounded-lg overflow-hidden transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
              >
                <span className="font-semibold">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-accent transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index ? (
                <div className="px-4 pb-4 border-t border-white/10 text-foreground/70">{faq.answer}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
