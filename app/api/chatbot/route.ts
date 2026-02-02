import { NextRequest, NextResponse } from "next/server"
import knowledgeBase from "@/lib/chatbot-knowledge-base.json"

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    // Check if AI API keys are configured
    const useAI = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY

    let response: string

    if (useAI) {
      // Use AI-powered responses
      response = await generateAIResponse(message, history)
    } else {
      // Fallback to keyword-based responses
      response = generateResponse(message.toLowerCase(), history)
    }

    return NextResponse.json({ message: response }, { status: 200 })
  } catch (error) {
    console.error("Chatbot API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateAIResponse(message: string, history: Message[]): Promise<string> {
  // Prepare the system prompt with knowledge base
  const systemPrompt = `You are DONNA, an AI Office Assistant built by Bird's Eye Management Services. You help organizations automate communications, workflows, and lead management.

Key Information:
- Company: Bird's Eye Management Services, CEO: Derek Talbird, Based in California
- Tagline: "Your Digital Operations Neural Network Assistant"
- Built on AWS with Verizon partnership for enterprise reliability
- Supports 25+ languages including English, Spanish, and Mandarin

Pricing:
- Free: Join waitlist for early access
- $5,000 Pilot: Early access program with full features
- Custom: Enterprise solutions and partnerships

Core Modules:
1. DONNA Email - Inbox analysis and lead classification
2. DONNA Chat - Website chatbot with human routing
3. DONNA Voice - AI receptionist with real-time transcription
4. DONNA CRM - Lead tracking and analytics
5. DONNA Books - QuickBooks integration
6. DONNA Lead Generation - Hybrid AI + human lead conversion
7. DONNA Secretary - Real-time scheduling and assistance
8. DONNA Landing Page Generator - Automated page creation
9. DONNA Photobooth - Event-based photo/video capture

Industries: Real Estate, Hospitality, Professional Services, Health & Beauty, Construction/ADU, Nonprofits

Security: SOC 2 Type II, GDPR compliant, AWS infrastructure, bank-level encryption

Contact: info@bemdonna.com, support@bemdonna.com

Be professional, friendly, and helpful. Keep responses concise but informative. Always encourage users to request a demo or join the waitlist.`

  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) throw new Error("OpenAI API error")

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error("OpenAI error:", error)
      // Fallback to keyword-based
      return generateResponse(message.toLowerCase(), history)
    }
  }

  // Try Anthropic if OpenAI not available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            ...history.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message },
          ],
        }),
      })

      if (!response.ok) throw new Error("Anthropic API error")

      const data = await response.json()
      return data.content[0].text
    } catch (error) {
      console.error("Anthropic error:", error)
      // Fallback to keyword-based
      return generateResponse(message.toLowerCase(), history)
    }
  }

  // Fallback
  return generateResponse(message.toLowerCase(), history)
}

function generateResponse(message: string, history: Message[]): string {
  // Greeting responses
  if (message.match(/\b(hi|hello|hey|greetings)\b/)) {
    return "Hello! I'm DONNA, your AI Office Assistant built by Bird's Eye Management Services. I can help you learn about our features, pricing, integrations, and more. What would you like to know?"
  }

  // Pricing questions
  if (message.match(/\b(price|pricing|cost|how much|payment|plan)\b/)) {
    return `We offer three options:\n\n1. **Free Waitlist** - Join to be among the first to experience DONNA\n2. **$5,000 Pilot Program** - Early access with full features and priority support\n3. **Custom Enterprise** - Tailored solutions for partnerships and custom builds\n\nWe're currently in an invite-only beta program. Would you like to join the waitlist or learn more about the pilot program?`
  }

  // Features questions
  if (message.match(/\b(feature|capability|what can|what does|do)\b/)) {
    return `DONNA offers powerful features including:\n\n• **Real-Time Voice & Chat** - Handle 4,000+ concurrent users\n• **AI + Human Collaboration** - Hybrid automation with human oversight\n• **Multi-Language Support** - 25+ languages including English, Spanish, Mandarin\n• **600+ Integrations** - Connect with Salesforce, HubSpot, Google Workspace, and more\n• **Enterprise Security** - Built on AWS with SOC 2 Type II certification\n\nWhich feature would you like to know more about?`
  }

  // Modules questions
  if (message.match(/\b(module|donna email|donna chat|donna voice|donna crm|donna books)\b/)) {
    return `DONNA includes 9 specialized modules:\n\n• **Email** - Inbox analysis and lead classification\n• **Chat** - Website chatbot with human routing\n• **Voice** - AI receptionist with real-time transcription\n• **CRM** - Lead tracking and pipeline visualization\n• **Books** - QuickBooks-style financial integration\n• **Lead Generation** - Hybrid AI and human lead conversion\n• **Secretary** - Real-time scheduling and executive assistance\n• **Landing Page Generator** - Automated page creation\n• **Photobooth** - Event-based photo/video capture\n\nWhich module interests you?`
  }

  // Industry/use case questions
  if (message.match(/\b(industry|vertical|use case|real estate|hospitality|professional|health|beauty|construction)\b/)) {
    return `DONNA serves multiple industries:\n\n• **Real Estate** - Property inquiries, showings, lead nurturing\n• **Hospitality** - Reservations, guest services, multilingual support\n• **Professional Services** - Client intake, appointments, billing\n• **Health & Beauty** - Appointment booking, service inquiries\n• **Construction/ADU** - Project inquiries, permit tracking\n• **Nonprofits** - Event management, member engagement\n\nEach vertical includes 200+ curated questions and industry-specific workflows. Which industry are you in?`
  }

  // Security questions
  if (message.match(/\b(secure|security|safe|privacy|data|encryption|gdpr|soc)\b/)) {
    return `Security is our top priority:\n\n• **AWS Infrastructure** - Built on enterprise-grade AWS services\n• **SOC 2 Type II Certified** - Independently audited\n• **GDPR Compliant** - Full data protection compliance\n• **Bank-Level Encryption** - All data encrypted at rest and in transit\n• **Verizon Partnership** - Enterprise network reliability\n• **Data Isolation** - Each client runs in a secure, isolated environment\n\nYour data is yours. We never train our models on customer data.`
  }

  // Integration questions
  if (message.match(/\b(integrat|connect|crm|salesforce|hubspot|google|microsoft|quickbooks)\b/)) {
    return `DONNA integrates with 600+ platforms including:\n\n• **CRMs**: Salesforce, HubSpot, custom systems\n• **Communication**: Google Workspace, Microsoft 365, Slack, Teams\n• **Finance**: QuickBooks, accounting systems\n• **Phone**: Twilio, Verizon Connect\n• **Support**: Zendesk, help desk tools\n• **Automation**: Zapier, custom APIs\n\nWe offer both real-time and scheduled data sync. Need a specific integration?`
  }

  // Setup/onboarding questions
  if (message.match(/\b(setup|install|onboard|start|begin|implement)\b/)) {
    return `Getting started with DONNA is quick and easy:\n\n**Setup Time**: 15-30 minutes\n**Process**:\n1. Connect your phone, email, calendar, and CRM\n2. Upload your knowledge base and business documents\n3. Go live with DONNA managing communications\n4. Review analytics and optimize performance\n\nMost customers are live within an hour! Would you like to request a demo or join the pilot program?`
  }

  // Language questions
  if (message.match(/\b(language|multilingual|spanish|mandarin|translate)\b/)) {
    return `Yes! DONNA supports 25+ languages including English, Spanish, and Mandarin. She can seamlessly switch between languages during conversations, making her perfect for diverse customer bases and international operations.`
  }

  // Demo/contact questions
  if (message.match(/\b(demo|contact|talk|speak|call|email|support)\b/)) {
    return `I'd be happy to connect you with our team!\n\n**Contact Options**:\n• **Email**: info@bemdonna.com\n• **Support**: support@bemdonna.com\n• **Request Demo**: Fill out the form on this page\n• **Join Beta**: Sign up with your business email\n\nYou can also scroll down to our contact form to request a personalized demo. What works best for you?`
  }

  // Difference from other AI
  if (message.match(/\b(different|chatgpt|alexa|compare|versus|vs|better)\b/)) {
    return `Great question! Unlike ChatGPT or Alexa, DONNA is built specifically for business operations:\n\n• **Direct Integration** - Works with your existing workflows and tools\n• **Real Phone Calls** - Handles actual voice conversations via Verizon\n• **Inbox Management** - Analyzes and responds to emails\n• **Lead Automation** - Qualifies and nurtures prospects\n• **AWS-Native** - Enterprise-grade reliability and security\n• **Human Collaboration** - Hybrid AI + human model for quality\n\nDONNA is your complete office assistant, not just a chatbot.`
  }

  // White label questions
  if (message.match(/\b(white label|rebrand|custom|agency|resell)\b/)) {
    return `Yes! DONNA can be fully white-labeled and customized for:\n\n• Agencies wanting a branded AI solution\n• Enterprises needing custom branding\n• Chambers of commerce and civic organizations\n• Partners looking to resell\n\nWe offer complete customization of branding, features, and workflows. Interested in a white-label partnership?`
  }

  // Thank you / goodbye
  if (message.match(/\b(thank|thanks|appreciate|bye|goodbye)\b/)) {
    return "You're welcome! If you have any other questions about DONNA, feel free to ask. You can also reach us at info@bemdonna.com or request a demo using the form on this page. Have a great day!"
  }

  // Default response with helpful suggestions
  return `I'd be happy to help! I can answer questions about:\n\n• **Pricing & Plans** - Free waitlist, $5K pilot, custom enterprise\n• **Features** - Voice, chat, email, CRM, integrations\n• **Industries** - Real estate, hospitality, professional services, and more\n• **Security** - AWS infrastructure, SOC 2, GDPR compliance\n• **Setup** - Quick 15-30 minute onboarding\n• **Modules** - Email, chat, voice, CRM, lead generation, and more\n\nWhat would you like to know more about?`
}

