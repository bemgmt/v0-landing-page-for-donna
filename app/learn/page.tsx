"use client"

import { useState } from "react"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Terminal, 
  Wrench, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  Eye, 
  X,
  FileCheck,
  Cpu,
  BrainCircuit
} from "lucide-react"
import { toast, Toaster } from "sonner"

// Templates data
const TEMPLATES = [
  {
    id: "me",
    filename: "me.md",
    title: "Me Template (Identity)",
    description: "Teaches AI who you are, your professional role, background, goals, and communication style.",
    path: "/downloads/learn/me.md",
    content: `# About Me Template (me.md)

This template helps train AI to understand who you are, your background, your responsibilities, and your communication style.

---

## 1. Professional Identity
- **Name:** [Your Full Name]
- **Company / Organization:** [Your Company Name]
- **Job Title / Role:** [e.g., Owner, Managing Partner, CEO]
- **Location:** [e.g., Chicago, IL]

## 2. Professional Background
- **Industry Experience:** [e.g., 15 years in commercial real estate, 5 years in retail consulting]
- **Core Area of Expertise:** [e.g., Contract negotiation, lead generation, team leadership]
- **Short Bio:** [Write 2-3 sentences about your professional journey and what drives you]

## 3. Goals & Focus
- **Primary Goals (Next 6-12 Months):**
  - [e.g., Automate administrative tasks to save 10 hours a week]
  - [e.g., Scale outbound marketing channels]
- **Core Responsibilities:**
  - [e.g., Approving client proposals]
  - [e.g., Directing operations and technology implementation]

## 4. Communication Preferences & Style
- **Tone:** [e.g., Direct, professional, warm, concise, authoritative]
- **Preferred Structure:** [e.g., Bulleted lists, short paragraphs, bold key terms]
- **Personality Quirks / Style:** [e.g., I avoid excessive exclamation marks and marketing fluff; I prefer clear, plain English]`
  },
  {
    id: "brandguidelines",
    filename: "brandguidelines.md",
    title: "Brand Guidelines Template",
    description: "Trains AI to write in your company's voice and communicate consistently across all channels.",
    path: "/downloads/learn/brandguidelines.md",
    content: `# Brand Guidelines Template (brandguidelines.md)

This template trains AI to write in your company's voice and communicate consistently across all channels.

---

## 1. Company Overview
- **Company Name:** [Your Company Name]
- **Core Value Proposition (Elevator Pitch):** [A 1-2 sentence description of what you solve and for whom. e.g., "We help local restaurants automate their delivery logistics so they can focus on cooking great food."]
- **Target Audience:** [e.g., Small business owners, local residents, busy parents]

## 2. Brand Voice & Tone
- **Voice Pillars:**
  - **Empathetic:** We understand our customers' challenges and speak to them with respect.
  - **Expert:** We know our industry inside and out, speaking with clarity and confidence.
  - **Warm:** We are approachable, using friendly, conversational language.
- **Preferred Words / Phrases:** [List expressions you love. e.g., "Simplified", "Empowered", "Partnering with you"]
- **Words / Phrases to Avoid:** [List expressions you dislike. e.g., "Synergy", "Disruptive", "Wheelhouse", "Guru"]

## 3. Communication Standards
- **Email Tone:** [e.g., Courteous, direct, starting with a clear greeting and finishing with a single clear call-to-action]
- **Social Media Tone:** [e.g., Enthusiastic, visually-descriptive, short sentence structures]
- **Content Rules:**
  - Prefer active voice over passive voice.
  - Explain complex terms simply; avoid unnecessary industry jargon.
  - Keep paragraphs to a maximum of 3 sentences.`
  },
  {
    id: "rules",
    filename: "rules.md",
    title: "Rules & Standards Template",
    description: "Teaches AI the strict quality standards, formatting constraints, and compliance rules it must follow.",
    path: "/downloads/learn/rules.md",
    content: `# Standards & Rules Template (rules.md)

This template teaches AI the strict rules, standards, and constraints it must follow when drafting content or performing tasks for you.

---

## 1. General Guardrails
- **Accuracy First:** Never invent facts, statistics, prices, or dates. If information is missing, ask for clarification or use a clear placeholder like \`[Insert Onboarding Date]\`.
- **Source Verification:** Rely only on information provided in company documents rather than making assumptions.
- **Privacy:** Do not output sensitive customer or employee personal details (such as Social Security Numbers, exact passwords, or credit card numbers).

## 2. Formatting & Structural Rules
- **No Fluff:** Do not write introductory sentences like "Here is the information you requested..." or "As an AI language model..." Start directly with the response.
- **Readability:** Use bullet points, numbered lists, and bold headings to break up long blocks of text.
- **Length Constraints:** 
  - Emails: Limit to 150 words unless detail is explicitly requested.
  - Social Posts: Limit to 280 characters for Twitter/X; 150 words for LinkedIn.

## 3. Communication Safeguards
- **Escalation Trigger:** If a customer expresses anger, uses words like "sue", "legal action", or "refund", immediately include a note stating that this requires direct human follow-up.
- **Tone Alignment:** Ensure every response matches the parameters set in \`brandguidelines.md\` and the identity in \`me.md\`.`
  },
  {
    id: "companyknowledge",
    filename: "companyknowledge.md",
    title: "Company Knowledge Template",
    description: "Serves as the primary source of truth for products, services, FAQs, processes, and contact details.",
    path: "/downloads/learn/companyknowledge.md",
    content: `# Company Knowledge Base Template (companyknowledge.md)

This template serves as the primary source of truth for your business's products, services, FAQs, and procedures.

---

## 1. Products & Services
- **Product/Service Name A:**
  - **Description:** [What is it and who is it for?]
  - **Pricing & Packages:** [Pricing model, e.g., $150/month flat fee or custom quoting]
  - **Key Features:** [List 3-4 features]
  - **Target Customer:** [Who is the ideal buyer?]

- **Product/Service Name B:**
  - **Description:** [What is it and who is it for?]
  - **Pricing & Packages:** [Pricing model]
  - **Key Features:** [List 3-4 features]
  - **Target Customer:** [Who is the ideal buyer?]

## 2. Frequently Asked Questions (FAQs)
- **Q: What are your operational hours?**
  - **A:** [e.g., Monday through Friday, 9:00 AM to 5:00 PM EST.]
- **Q: Do you offer a money-back guarantee or refund policy?**
  - **A:** [Insert policy details.]
- **Q: How long does onboarding typically take?**
  - **A:** [Insert typical timeline.]

## 3. Operations & Team Structure
- **Key Contacts:**
  - **General Inquiries:** [e.g., info@company.com]
  - **Support / Service:** [e.g., support@company.com]
- **Key Operations Processes:**
  - **Client Onboarding:** [Describe the basic steps of onboarding a new client, e.g., 1. Intake form, 2. Setup call, 3. Portal access]
  - **Delivery / Execution:** [Briefly describe how work is scheduled and delivered]`
  }
]

// Materials data
const MATERIALS = [
  {
    filename: "class_notes.md",
    title: "Class Reference Notes",
    description: "Complete summary of core workshop concepts, why AI fails without context, and handbook construction details.",
    path: "/downloads/learn/class_notes.md",
    pdfPath: "/downloads/learn/class_notes.pdf",
    pdfFilename: "class_notes.pdf",
    content: `# Class Notes: AI Business Workshop

## Core Concept
> "Most people think they're learning how to prompt AI. What they're really learning is how to train AI to understand their business."

AI is not inherently intelligent about your business operations. An LLM (Large Model) is a prediction engine. To give relevant, accurate, and non-generic answers, it requires context. Without context, it generates generic responses that sound like average internet content.

---

## The Solution: The AI Employee Handbook
Instead of writing complex prompts every time, build an "AI Employee Handbook" consisting of four primary Markdown (.md) documents:
1. me.md: Teaches the AI who you are.
2. brandguidelines.md: Teaches the AI how you communicate.
3. rules.md: Teaches the AI your standards.
4. companyknowledge.md: Teaches the AI what your business knows.`
  },
  {
    filename: "presentation_slides.md",
    title: "Presentation Slides Outlines",
    description: "The complete presentation deck formatted in Markdown, perfect for slide building or offline viewing.",
    path: "/downloads/learn/presentation_slides.md",
    pdfPath: "/downloads/learn/presentation_slides.pdf",
    pdfFilename: "presentation_slides.pdf",
    content: `# Presentation: Training AI for Your Business
## Slide Deck Outline

---

## Slide 1: Title
# Training AI for Your Business
### Building Your AI Employee Handbook
**Presenter:** [Your Name / Company]

---

## Slide 2: The Core Problem
# Why AI Gives Generic Answers
- AI doesn't know who you are
- AI doesn't know your business or products
- AI doesn't know your tone or customer style
- Result: You get generic, boring copy that sounds like everyone else.`
  },
  {
    filename: "prompt_cheat_sheet.md",
    title: "Prompt Cheat Sheet",
    description: "Quick-access prompts covering Marketing, Sales, Customer Service, and Operations.",
    path: "/downloads/learn/prompt_cheat_sheet.md",
    pdfPath: "/downloads/learn/prompt_cheat_sheet.pdf",
    pdfFilename: "prompt_cheat_sheet.pdf",
    content: `# AI Prompt Cheat Sheet

A compilation of business prompts from the AI Business Workshop. For best results, upload your AI Employee Handbook files before running these.

## Marketing: Social Media Post
"Act as my marketing manager. Using the information in my me.md, brandguidelines.md, and companyknowledge.md files, create a Facebook post promoting my services."

## Sales: Objection Handling
"A customer said: 'It costs too much.' Using our companyknowledge.md details, provide likely underlying concerns and suggested empathetic responses."`
  }
]

// Recommended Tools
const RECOMMENDED_TOOLS = [
  {
    category: "General AI Assistants",
    tools: [
      { name: "ChatGPT (OpenAI)", desc: "Best for overall writing, brainstorming, and flexible chat tasks. Recommends using the custom GPTs or files upload for context.", link: "https://chatgpt.com" },
      { name: "Claude (Anthropic)", desc: "Excellent for analytical writing, long documents, and precise brand voice matching. Very high contextual understanding.", link: "https://claude.ai" },
      { name: "Gemini (Google)", desc: "Fast execution, direct integration with Google Workspaces, and strong real-time information retrieval capabilities.", link: "https://gemini.google.com" }
    ]
  },
  {
    category: "Research & Knowledge",
    tools: [
      { name: "Perplexity AI", desc: "A search-first AI engine. Best for real-time market research, competitor analysis, and finding sources.", link: "https://perplexity.ai" },
      { name: "NotebookLM", desc: "Google's notebook tool. Perfect for uploading all your business documents to create a personalized, private search index.", link: "https://notebooklm.google.com" }
    ]
  },
  {
    category: "Content & Creation",
    tools: [
      { name: "Canva", desc: "Design graphics, presentations, and branding elements easily with native AI-powered layout generation.", link: "https://canva.com" },
      { name: "Gamma", desc: "Create gorgeous web pages, slides, or documents in minutes from a single prompt outline.", link: "https://gamma.app" },
      { name: "VEED.IO", desc: "Smart online video editor. Great for translating scripts into video, adding subtitles, and editing marketing videos.", link: "https://veed.io" },
      { name: "ChatGPT Images (DALL-E)", desc: "Create stunning custom illustrations and visual assets directly within your chat workflow.", link: "https://chatgpt.com" },
      { name: "Google Flow", desc: "Streamline creation workflows and process automation using Gemini's native intelligence orchestration.", link: "https://gemini.google.com" },
      { name: "Google Omni", desc: "Omnipresent AI assistance designed to generate contextual copy, layouts, and translations on the fly.", link: "https://gemini.google.com" },
      { name: "Lumen5", desc: "AI-driven video creator that automatically transforms blog posts and text outlines into high-quality social videos.", link: "https://lumen5.com" }
    ]
  },
  {
    category: "Voice Generation",
    tools: [
      { name: "ElevenLabs", desc: "Industry-leading AI voice cloning and speech generation. Ideal for creating clean voiceovers for demos and videos.", link: "https://elevenlabs.io" }
    ]
  },
  {
    category: "IDE & Coding Assistants",
    tools: [
      { name: "Antigravity (Recommended)", desc: "A next-generation AI coding assistant built by the DeepMind team, specialized in rapid, highly-aesthetic application development.", link: "https://github.com", highlight: true },
      { name: "Cursor", desc: "An AI-powered fork of VS Code that provides inline code editing, codebase-wide indexing, and natural language chat.", link: "https://cursor.com" },
      { name: "VS Code Editor", desc: "The gold standard code editor, extensible with Copilot and external AI agents for custom developer environments.", link: "https://code.visualstudio.com" },
      { name: "Claude Code", desc: "Anthropic's terminal-based agent that writes, tests, and refines code directly from your local terminal workspace.", link: "https://claude.ai" },
      { name: "Codex (OpenAI)", desc: "OpenAI's foundational model that powers multiple programming interfaces and handles advanced coding translations.", link: "https://openai.com" },
      { name: "Augment", desc: "An enterprise-grade AI developer assistant focusing on ultra-fast autocomplete, codebase search, and context retention.", link: "https://augment.co" }
    ]
  }
]

// Example Prompts Directory
const PROMPT_DIRECTORY = [
  {
    category: "Marketing",
    prompts: [
      {
        title: "Social Media Campaign Post",
        desc: "Generates a social media post aligned with your brand voice and target audience.",
        promptText: "Act as my marketing manager. Using the information in my me.md, brandguidelines.md, and companyknowledge.md files, create a Facebook post promoting my services. Do not write generic marketing slogans."
      },
      {
        title: "30-Day Content Calendar Plan",
        desc: "Creates a diverse 30-day marketing content schedule.",
        promptText: "Create a 30-day content calendar for my business including: educational posts, promotional posts, FAQ answers, customer success highlights, and community engagement prompts. Group them weekly."
      },
      {
        title: "SEO Blog Post Writer",
        desc: "Drafts a detailed blog article around a selected keyphrase.",
        promptText: "Write a 1,000-word SEO blog article targeting [INSERT KEYWORD HERE]. Use standard subheaders, include bullet points for readability, and write in the brand voice outline in brandguidelines.md."
      }
    ]
  },
  {
    category: "Sales",
    prompts: [
      {
        title: "Proposal Follow-Up Email",
        desc: "A short, polite reminder for prospects who have gone cold.",
        promptText: "Write a warm but professional follow-up email to a prospect who has not responded to our proposal for two weeks. Refer to our me.md formatting guidelines to keep it concise and under 150 words. End with a clear next step."
      },
      {
        title: "Objection: 'It Costs Too Much'",
        desc: "Generates responses to price resistance using value metrics.",
        promptText: "A customer said: 'It costs too much.' Using our companyknowledge.md details, analyze their potential concerns, draft three alternative empathetic replies, and provide two follow-up discovery questions."
      },
      {
        title: "Initial Sales Proposal Draft",
        desc: "Outlines a client-ready proposal outlining scope and pricing.",
        promptText: "Create a professional business proposal for [CLIENT NAME]. Draft sections for Project Scope, Estimated Timeline, Value Benefits, and a clear Pricing Summary referencing the packages in companyknowledge.md."
      }
    ]
  },
  {
    category: "Customer Service",
    prompts: [
      {
        title: "25 FAQ Q&A Generator",
        desc: "Creates an initial customer support knowledge base list.",
        promptText: "Generate the 25 most common customer questions and answers for our business based on the products, services, and operational FAQs in companyknowledge.md."
      },
      {
        title: "Empathetic Complaint Response",
        desc: "Drafts a reply to customer complaints that adheres to rules.md.",
        promptText: "Draft an empathetic response to a customer complaining about [DESCRIBE COMPLAINT HERE]. Ensure you match the support rules in rules.md and sign off using the team info in companyknowledge.md."
      }
    ]
  },
  {
    category: "Operations & Operations Planning",
    prompts: [
      {
        title: "Standard Operating Procedure (SOP)",
        desc: "Formats operational actions into step-by-step handbooks.",
        promptText: "Create a Standard Operating Procedure (SOP) for [INSERT OPERATIONAL PROCESS]. Include a short purpose statement, sequential execution steps, list of common pitfalls, and a visual completion checklist."
      },
      {
        title: "Meeting Action Items Extractor",
        desc: "Transforms transcripts or raw notes into clean tasks.",
        promptText: "Convert the following meeting notes into structured action items. Identify decisions made, exact tasks, assigned team owners, and deadline timelines: \n\n[PASTE MEETING NOTES HERE]"
      }
    ]
  }
]

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "materials" | "prompts" | "tools">("templates")
  const [previewFile, setPreviewFile] = useState<{ title: string; content: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedId(null), 3000)
  }

  const handleDownloadAll = () => {
    // Trigger download for each template file
    TEMPLATES.forEach(t => {
      const link = document.createElement("a")
      link.href = t.path
      link.setAttribute("download", t.filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
    toast.success("Downloading all 4 handbook templates!")
  }

  return (
    <>
      <Toaster theme="dark" position="bottom-right" />
      <MarketingSubpageShell
        title="AI Business Workshop Resources"
        lead="Build your AI Employee Handbook. Download structural templates, slides, and cheat sheets to train ChatGPT, Claude, and Gemini to understand your business."
      >
        <div className="relative z-10 space-y-10">
          
          {/* Quick Actions Panel */}
          <div className="glass-card liquid-glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden wow-card shadow-2xl">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 text-foreground">
                <BrainCircuit className="w-6 h-6 text-accent animate-float" />
                The AI Employee Handbook Kit
              </h2>
              <p className="text-muted-foreground text-sm max-w-xl">
                Ready to build? Grab all four core templates (.md files) and load them into your AI tool to teach it who you are, how you communicate, and what you sell.
              </p>
            </div>
            <button
              onClick={handleDownloadAll}
              className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent to-primary text-black font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg glow-accent"
            >
              <Download className="w-5 h-5" />
              Download All Templates (.md)
            </button>
          </div>
          <div className="text-sm text-muted-foreground px-2 -mt-6 flex items-center gap-1.5 justify-center md:justify-start">
            <span>View the presentation</span>
            <a
              href="https://gamma.app/docs/Meet-the-Major-AI-Models-250lg3ywcyp9zxm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
            >
              here
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "templates", label: "Handbook Templates", icon: FileCheck },
              { id: "materials", label: "Class Materials", icon: BookOpen },
              { id: "prompts", label: "Example Prompts", icon: Terminal },
              { id: "tools", label: "Recommended AI Tools", icon: Wrench },
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:text-foreground cursor-pointer ${
                    isActive
                      ? "border-accent text-accent bg-accent/5"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="min-h-[300px]">
            
            {/* 1. Templates Tab */}
            {activeTab === "templates" && (
              <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
                {TEMPLATES.map(t => (
                  <div key={t.id} className="glass-card rounded-xl p-5 md:p-6 flex flex-col justify-between hover:border-white/30 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                          {t.filename}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPreviewFile({ title: t.title, content: t.content })}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(t.content, t.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
                            title="Copy to clipboard"
                          >
                            {copiedId === t.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-accent transition-colors">
                        {t.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Markdown template
                      </span>
                      <a
                        href={t.path}
                        download={t.filename}
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> Download File
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Materials Tab */}
            {activeTab === "materials" && (
              <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
                {MATERIALS.map(m => (
                  <div key={m.filename} className="glass-card rounded-xl p-5 md:p-6 flex flex-col justify-between hover:border-white/30 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                          {m.filename}
                        </span>
                        <button
                          onClick={() => handleCopy(m.content, m.filename)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
                          title="Copy file text"
                        >
                          {copiedId === m.filename ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <h3 className="text-base font-bold">
                        {m.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {m.description}
                      </p>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <a
                          href={m.path}
                          download={m.filename}
                          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" /> Download (.md)
                        </a>
                        <a
                          href={m.pdfPath}
                          download={m.pdfFilename}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" /> Download (.pdf)
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Prompts Tab */}
            {activeTab === "prompts" && (
              <div className="space-y-8 animate-fade-in">
                {PROMPT_DIRECTORY.map(cat => (
                  <div key={cat.category} className="space-y-4">
                    <h3 className="text-sm font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      {cat.category}
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {cat.prompts.map((p, idx) => {
                        const copyId = `${cat.category}-${idx}`
                        return (
                          <div key={p.title} className="glass-card rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <h4 className="font-bold text-foreground">{p.title}</h4>
                              <p className="text-muted-foreground text-xs leading-relaxed">{p.desc}</p>
                              
                              <div className="relative mt-3 rounded-lg bg-black/40 border border-white/5 p-3.5 text-xs font-mono text-foreground/90 select-all max-h-[140px] overflow-y-auto leading-relaxed">
                                {p.promptText}
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-white/5 flex justify-end">
                              <button
                                onClick={() => handleCopy(p.promptText, copyId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-foreground transition-all cursor-pointer"
                              >
                                {copiedId === copyId ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Prompt
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Tools Tab */}
            {activeTab === "tools" && (
              <div className="space-y-8 animate-fade-in">
                {RECOMMENDED_TOOLS.map(cat => (
                  <div key={cat.category} className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {cat.category}
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      {cat.tools.map(tool => (
                        <a
                          key={tool.name}
                          href={tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`glass-card rounded-xl p-5 border transition-all flex flex-col justify-between group relative overflow-hidden ${
                            tool.highlight 
                              ? "border-accent/40 bg-accent/5 shadow-[0_0_15px_rgba(132,204,255,0.15)] hover:border-accent"
                              : "border-white/5 hover:border-white/20"
                          }`}
                        >
                          {tool.highlight && (
                            <div className="absolute top-0 right-0 bg-accent text-black font-bold text-[9px] uppercase px-2 py-0.5 rounded-bl-lg tracking-wider">
                              Recommended
                            </div>
                          )}
                          <div className="space-y-2">
                            <h4 className={`font-bold text-foreground transition-colors flex items-center justify-between ${tool.highlight ? "text-accent group-hover:text-cyan-300" : "group-hover:text-primary"}`}>
                              {tool.name}
                              <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-muted-foreground text-xs leading-relaxed">{tool.desc}</p>
                          </div>
                          <span className="text-[10px] mt-4 font-mono text-muted-foreground/50 hover:underline">
                            {tool.link.replace("https://", "")}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Quick Concept Outline Section */}
          <section className="glass-card p-6 md:p-8 rounded-2xl space-y-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Cpu className="w-40 h-40 text-foreground" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground border-b border-white/10 pb-4">
              AI Business Class Outline
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-accent mb-1">Part 1: What is AI?</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Overview of Large Language Models (LLMs) like ChatGPT, Claude, Gemini, Perplexity, and NotebookLM. Learn why they behave as prediction engines and how missing details trigger hallucinations.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-accent mb-1">Part 2: Why AI Gives Generic Answers</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    AI tools possess internet-wide knowledge but zero context about your brand, communication preferences, audience niche, products, or guidelines. Without custom instruction, output stays completely generic.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-primary mb-1">Part 3: Building the AI Employee Handbook</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Step-by-step drafting of the four handbook files: <code className="text-xs bg-white/5 border border-white/10 px-1 py-0.5 rounded">me.md</code>, <code className="text-xs bg-white/5 border border-white/10 px-1 py-0.5 rounded">brandguidelines.md</code>, <code className="text-xs bg-white/5 border border-white/10 px-1 py-0.5 rounded">rules.md</code>, and <code className="text-xs bg-white/5 border border-white/10 px-1 py-0.5 rounded">companyknowledge.md</code>.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-1">Part 4: Live Demonstration & Execution</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Testing the context upload process. Observe side-by-side prompt execution before and after providing handbook context to ensure instant brand-aligned copywriting.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </MarketingSubpageShell>

      {/* Preview File Dialog Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card liquid-glass-card rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-white/20 shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                {previewFile.title}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed text-foreground/90 bg-black/40 select-all whitespace-pre-wrap">
              {previewFile.content}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => handleCopy(previewFile.content, "preview-copy")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold transition-all cursor-pointer"
              >
                {copiedId === "preview-copy" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Content
                  </>
                )}
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-lg bg-accent text-black font-semibold text-sm hover:opacity-90 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
