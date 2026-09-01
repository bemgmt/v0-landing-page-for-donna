"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { faqSections, featuredMarketingFaqs } from "@/lib/faq-content"

export default function FAQ({
  id,
  hideHeading = false,
  showAll = false,
}: {
  id?: string
  hideHeading?: boolean
  showAll?: boolean
}) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const sections = showAll
    ? faqSections
    : [{ title: "", description: "", items: featuredMarketingFaqs }]

  return (
    <section id={id} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className={showAll ? "max-w-3xl mx-auto" : "max-w-2xl mx-auto"}>
        {!hideHeading ? (
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
        ) : null}

        <div className={showAll ? "space-y-12" : "space-y-3"}>
          {sections.map((section, sectionIndex) => (
            <div key={section.title || "featured"}>
              {showAll ? (
                <div className="mb-5">
                  <h2 className="text-2xl font-semibold">{section.title}</h2>
                  <p className="mt-2 text-foreground/60">{section.description}</p>
                </div>
              ) : null}
              <div className="space-y-3">
                {section.items.map((faq, itemIndex) => {
                  const isOpen = openQuestion === faq.question
                  const panelId = `faq-panel-${sectionIndex}-${itemIndex}`

                  return (
                    <div
                      key={faq.question}
                      className="glass-card rounded-lg overflow-hidden transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${itemIndex * 50}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="w-full min-h-12 p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="font-semibold">{faq.question}</span>
                        <ChevronDown
                          size={20}
                          aria-hidden="true"
                          className={`flex-shrink-0 text-accent transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div
                        id={panelId}
                        hidden={!isOpen}
                        className="px-4 pb-4 border-t border-white/10 text-foreground/70 leading-relaxed"
                      >
                        <p className="pt-4">{faq.answer}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {!showAll ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5">
            <Link href="/getting-started" className="font-medium text-accent hover:underline">
              Follow the real-estate setup guide
            </Link>
            <Link href="/faq" className="text-sm text-foreground/60 hover:text-foreground hover:underline">
              Read all DONNA questions
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
