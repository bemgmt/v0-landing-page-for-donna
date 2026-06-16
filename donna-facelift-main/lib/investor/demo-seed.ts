/**
 * Shared investor-preview dummy data (relative dates, single source of truth).
 */

import type { SalesData } from "@/components/interfaces/sales-interface"

function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split("T")[0]
}

function isoDateTime(offsetDays: number, hours = 10, minutes = 30): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

const d0 = isoDate(0)
const d1 = isoDate(1)
const d2 = isoDate(2)
const d3 = isoDate(3)
const d5 = isoDate(5)
const d7 = isoDate(7)
const d10 = isoDate(10)
const dm3 = isoDate(-3)
const dm5 = isoDate(-5)
const dm7 = isoDate(-7)
const dm10 = isoDate(-10)

export function getDemoSalesData(): SalesData {
  return {
    contacts: [
      {
        id: "1",
        name: "John Doe",
        email: "john@techcorp.com",
        phone: "+1-555-0101",
        company: "TechCorp Inc",
        status: "qualified",
        score: 85,
        created_at: dm10,
        last_contact: dm3,
        notes: "Very interested in enterprise solution",
        value: 50000,
        source: "Website",
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@startup.io",
        phone: "+1-555-0102",
        company: "Startup.io",
        status: "contacted",
        score: 72,
        created_at: dm7,
        last_contact: dm5,
        notes: "Follow up scheduled for next week",
        value: 25000,
        source: "Referral",
      },
      {
        id: "3",
        name: "Bob Johnson",
        email: "bob@consulting.com",
        phone: "+1-555-0103",
        company: "Johnson Consulting",
        status: "new",
        score: 45,
        created_at: dm5,
        value: 15000,
        source: "LinkedIn",
      },
      {
        id: "4",
        name: "Sarah Williams",
        email: "sarah@enterprise.com",
        phone: "+1-555-0104",
        company: "Enterprise Solutions",
        status: "converted",
        score: 95,
        created_at: dm10,
        last_contact: dm3,
        notes: "Closed deal - Premium package",
        value: 75000,
        source: "Event",
      },
      {
        id: "5",
        name: "Michael Chen",
        email: "michael@innovate.com",
        phone: "+1-555-0105",
        company: "Innovate Labs",
        status: "qualified",
        score: 78,
        created_at: dm7,
        last_contact: dm5,
        notes: "Requested demo",
        value: 40000,
        source: "Website",
      },
      {
        id: "6",
        name: "Emily Davis",
        email: "emily@digital.com",
        phone: "+1-555-0106",
        company: "Digital Marketing Pro",
        status: "contacted",
        score: 68,
        created_at: dm5,
        last_contact: dm3,
        value: 30000,
        source: "Social Media",
      },
      {
        id: "7",
        name: "David Martinez",
        email: "david@finance.com",
        phone: "+1-555-0107",
        company: "Finance Corp",
        status: "new",
        score: 52,
        created_at: dm3,
        value: 20000,
        source: "Cold Outreach",
      },
      {
        id: "8",
        name: "Lisa Anderson",
        email: "lisa@retail.com",
        company: "Retail Solutions",
        status: "qualified",
        score: 82,
        created_at: dm7,
        last_contact: dm5,
        notes: "Interested in bulk pricing",
        value: 60000,
        source: "Referral",
      },
    ],
    leads: [
      {
        id: "1",
        contact_id: "1",
        contact_name: "John Doe",
        status: "hot",
        score: 90,
        last_contact: d0,
        notes: "Interested in premium plan, budget approved",
        estimated_value: 50000,
        probability: 85,
      },
      {
        id: "2",
        contact_id: "2",
        contact_name: "Jane Smith",
        status: "warm",
        score: 65,
        last_contact: dm3,
        notes: "Follow up scheduled",
        estimated_value: 25000,
        probability: 60,
      },
      {
        id: "3",
        contact_id: "5",
        contact_name: "Michael Chen",
        status: "hot",
        score: 88,
        last_contact: dm5,
        notes: "Demo completed, very positive feedback",
        estimated_value: 40000,
        probability: 80,
      },
      {
        id: "4",
        contact_id: "8",
        contact_name: "Lisa Anderson",
        status: "warm",
        score: 70,
        last_contact: dm7,
        notes: "Requested pricing information",
        estimated_value: 60000,
        probability: 55,
      },
      {
        id: "5",
        contact_id: "3",
        contact_name: "Bob Johnson",
        status: "cold",
        score: 45,
        last_contact: dm10,
        notes: "Initial contact made",
        estimated_value: 15000,
        probability: 25,
      },
    ],
    deals: [
      {
        id: "1",
        name: "Enterprise Package - TechCorp",
        contact_id: "1",
        contact_name: "John Doe",
        value: 50000,
        stage: "negotiation",
        probability: 75,
        expected_close: isoDate(21),
        created_at: dm10,
      },
      {
        id: "2",
        name: "Premium Solution - Enterprise Solutions",
        contact_id: "4",
        contact_name: "Sarah Williams",
        value: 75000,
        stage: "closed_won",
        probability: 100,
        expected_close: dm3,
        created_at: dm10,
      },
      {
        id: "3",
        name: "Standard Package - Innovate Labs",
        contact_id: "5",
        contact_name: "Michael Chen",
        value: 40000,
        stage: "proposal",
        probability: 65,
        expected_close: isoDate(28),
        created_at: dm7,
      },
      {
        id: "4",
        name: "Bulk License - Retail Solutions",
        contact_id: "8",
        contact_name: "Lisa Anderson",
        value: 60000,
        stage: "qualification",
        probability: 50,
        expected_close: isoDate(35),
        created_at: dm7,
      },
    ],
    stats: {
      total_contacts: 8,
      hot_leads: 2,
      conversion_rate: 18.5,
      total_revenue: 425000,
      pipeline_value: 195000,
      avg_deal_size: 53125,
      win_rate: 42,
    },
    activities: [
      {
        id: "1",
        type: "call",
        contact_name: "John Doe",
        description: "Discussed enterprise features and pricing",
        date: isoDateTime(0, 10, 30),
      },
      {
        id: "2",
        type: "email",
        contact_name: "Jane Smith",
        description: "Sent follow-up email with proposal",
        date: isoDateTime(-1, 14, 15),
      },
      {
        id: "3",
        type: "meeting",
        contact_name: "Michael Chen",
        description: "Product demo completed successfully",
        date: isoDateTime(-2, 9, 0),
      },
      {
        id: "4",
        type: "note",
        contact_name: "Sarah Williams",
        description: "Deal closed - Premium package",
        date: isoDateTime(-3, 16, 45),
      },
      {
        id: "5",
        type: "call",
        contact_name: "Lisa Anderson",
        description: "Initial discovery call",
        date: isoDateTime(-5, 11, 20),
      },
    ],
  }
}

export type DemoEmailSeed = {
  id: string
  from: string
  from_email: string
  subject: string
  preview: string
  time: string
  dateISO: string | null
  starred: boolean
  unread?: boolean
  category: "personal" | "work" | "marketing" | "social" | "updates" | "forums" | "promotions"
  priority: "low" | "medium" | "high" | "urgent"
}

export function getDemoMarketingEmails(): DemoEmailSeed[] {
  return [
    {
      id: "1",
      from: "Alex Rivera",
      from_email: "alex@prospect.co",
      subject: "Partnership intro — GTM sync",
      preview: "We would love to align on launch sequencing and co-marketing…",
      time: "2h ago",
      dateISO: isoDateTime(0, 8, 12),
      starred: false,
      unread: true,
      category: "work",
      priority: "high",
    },
    {
      id: "2",
      from: "Morgan Lee",
      from_email: "morgan@seriesa.vc",
      subject: "Diligence questions — SAFE path",
      preview: "Following up on cap table and pro-rata mechanics…",
      time: "5h ago",
      dateISO: isoDateTime(0, 11, 40),
      starred: true,
      unread: false,
      category: "work",
      priority: "medium",
    },
    {
      id: "3",
      from: "DONNA Digest",
      from_email: "digest@donna.ai",
      subject: "Weekly investor snapshot",
      preview: "Highlights from pipeline, DIN signals, and product velocity…",
      time: "1d ago",
      dateISO: isoDateTime(-1, 7, 0),
      starred: false,
      unread: true,
      category: "marketing",
      priority: "low",
    },
  ]
}

export function getDemoEmailStats() {
  const e = getDemoMarketingEmails()
  return { inbox: e.length, starred: e.filter((x) => x.starred).length, sent: 12 }
}

export function getDemoAnalyticsData() {
  return {
    revenue: { total: "$184,320", change: "+9.4%" },
    users: { active: "9,102", change: "+6.1%" },
    conversion: { rate: "3.56%", change: "+0.4%" },
    engagement: { score: "91.8%", change: "+4.2%" },
    emails: { total: 2488, change: "+11.0%" },
    contacts: { new: 142, change: "+18.4%" },
    texts: { sent: 512, change: "+9.9%" },
  }
}

export type DemoLead = {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: "website" | "social" | "referral" | "event" | "cold_outreach"
  score: number
  status: "new" | "contacted" | "qualified" | "converted" | "lost"
  created_at: string
  last_contact?: string
  notes?: string
}

export function getDemoLeadGeneratorData(): {
  leads: DemoLead[]
  stats: {
    total_leads: number
    qualified_leads: number
    conversion_rate: number
    avg_score: number
  }
  sources: Record<string, number>
} {
  return {
    leads: [
      {
        id: "1",
        name: "John Smith",
        email: "john@techcorp.com",
        phone: "(555) 123-4567",
        company: "TechCorp Inc",
        source: "website",
        score: 85,
        status: "qualified",
        created_at: d2,
        last_contact: d0,
        notes: "Interested in enterprise solution",
      },
      {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah@startup.io",
        company: "Startup.io",
        source: "social",
        score: 72,
        status: "contacted",
        created_at: d3,
        notes: "Follow up next week",
      },
      {
        id: "3",
        name: "Mike Chen",
        email: "mike@consulting.com",
        phone: "(555) 987-6543",
        company: "Chen Consulting",
        source: "referral",
        score: 91,
        status: "new",
        created_at: d1,
      },
    ],
    stats: {
      total_leads: 142,
      qualified_leads: 38,
      conversion_rate: 14.2,
      avg_score: 76,
    },
    sources: {
      website: 52,
      social: 34,
      referral: 28,
      event: 18,
      cold_outreach: 10,
    },
  }
}

export type DemoMeeting = {
  id: string
  title: string
  date: string
  time: string
  duration: number
  participants: string[]
  location?: string
  meetingUrl?: string
  description?: string
  isDONNAInvited: boolean
  prepNotes?: string
}

export type DemoTask = {
  id: string
  text: string
  completed: boolean
  dueDate?: string
  priority?: "low" | "medium" | "high"
}

export type DemoNote = {
  id: string
  title: string
  content: string
  createdAt: string
  tags?: string[]
}

export type DemoDeadline = {
  id: string
  title: string
  date: string
  time?: string
  priority: "low" | "medium" | "high"
  relatedMeeting?: string
}

export function getDemoSecretaryMeetings(): DemoMeeting[] {
  return [
    {
      id: "1",
      title: "Investor diligence — product deep dive",
      date: d2,
      time: "10:00",
      duration: 60,
      participants: ["Jordan Kim", "Riley Park", "DONNA"],
      location: "Virtual",
      meetingUrl: "https://meet.example.com/donna-diligence",
      description: "Walkthrough of capabilities, security, and roadmap",
      isDONNAInvited: true,
      prepNotes:
        "Prepare architecture one-pager, GTM slide, and SAFE / priced-round comparison for Q&A.",
    },
    {
      id: "2",
      title: "Pilot kickoff — Meridian Labs",
      date: d3,
      time: "14:00",
      duration: 45,
      participants: ["Alex Rivera", "Pilot team"],
      meetingUrl: "https://zoom.us/j/example-donna-pilot",
      description: "Success criteria, timeline, and success metrics",
      isDONNAInvited: true,
      prepNotes: "Confirm data residency checklist and onboarding owners.",
    },
    {
      id: "3",
      title: "Weekly exec standup",
      date: d0,
      time: "09:00",
      duration: 30,
      participants: ["Leadership"],
      location: "Virtual",
      isDONNAInvited: true,
    },
  ]
}

export function getDemoSecretaryTasks(): DemoTask[] {
  return [
    {
      id: "1",
      text: "Circulate DIN capability brief to investors",
      completed: false,
      dueDate: d1,
      priority: "high",
    },
    {
      id: "2",
      text: "Draft follow-up: live demo credentials request",
      completed: false,
      dueDate: d0,
      priority: "medium",
    },
    {
      id: "3",
      text: "Review SAFE summary for counsel",
      completed: true,
      dueDate: dm3,
      priority: "high",
    },
    {
      id: "4",
      text: "Schedule founders session — pipeline review",
      completed: false,
      dueDate: d7,
      priority: "low",
    },
    {
      id: "5",
      text: "Refresh product changelog for board",
      completed: false,
      dueDate: d5,
      priority: "medium",
    },
  ]
}

export function getDemoSecretaryNotes(): DemoNote[] {
  return [
    {
      id: "1",
      title: "Diligence themes",
      content:
        "Focus: moat, DIN adoption, enterprise security posture, and services margin. Follow up on references after pilot readout.",
      createdAt: isoDateTime(-1, 16, 0),
      tags: ["investor", "diligence"],
    },
    {
      id: "2",
      title: "Meridian pilot",
      content:
        "Champion confirmed; IT review scheduled. Risk: SSO timeline — propose phased rollout.",
      createdAt: isoDateTime(-2, 11, 30),
      tags: ["pilot", "sales"],
    },
  ]
}

export function getDemoSecretaryDeadlines(): DemoDeadline[] {
  return [
    {
      id: "1",
      title: "Board deck — growth & GTM",
      date: d5,
      time: "17:00",
      priority: "high",
    },
    {
      id: "2",
      title: "Pilot success review",
      date: d2,
      priority: "medium",
      relatedMeeting: "2",
    },
    {
      id: "3",
      title: "Data room refresh",
      date: d10,
      priority: "high",
    },
  ]
}
