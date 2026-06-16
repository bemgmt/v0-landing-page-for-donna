import type { TrendItem } from "../types"

// Graph data points for each trend (6 months of normalized demand 0-100)
export const trendGraphData: Record<string, number[]> = {
  t1: [22, 30, 38, 51, 62, 78],
  t2: [35, 38, 42, 50, 55, 64],
  t3: [18, 20, 25, 28, 32, 38],
  t4: [30, 34, 40, 52, 58, 72],
}

export const trendOverview: TrendItem[] = [
  {
    id: "t1",
    title: "AI Workflow Mapping",
    category: "Workflow Automation",
    demandSignal: "high",
    growthIndicator: "+34%",
    relatedRequests: 42,
    trendDirection: "up",
    percentChange: 34,
  },
  {
    id: "t2",
    title: "CRM Repair & Migration",
    category: "CRM Setup",
    demandSignal: "high",
    growthIndicator: "+22%",
    relatedRequests: 31,
    trendDirection: "up",
    percentChange: 22,
  },
  {
    id: "t3",
    title: "Proposal Automation",
    category: "Software Development",
    demandSignal: "medium",
    growthIndicator: "+18%",
    relatedRequests: 19,
    trendDirection: "up",
    percentChange: 18,
  },
  {
    id: "t4",
    title: "Real Estate Follow-up Systems",
    category: "Real Estate Ops",
    demandSignal: "high",
    growthIndicator: "+28%",
    relatedRequests: 27,
    trendDirection: "up",
    percentChange: 28,
  },
]

// Skills already downloaded to the user's DONNA
export const mySkills: TrendItem[] = [
  { id: "my1", title: "Workflow Automation", category: "Workflow Automation", demandSignal: "high", growthIndicator: "+34%", relatedRequests: 42 },
  { id: "my2", title: "CRM Setup", category: "CRM Setup", demandSignal: "high", growthIndicator: "+22%", relatedRequests: 31 },
  { id: "my3", title: "Process Design", category: "Workflow Automation", demandSignal: "medium", growthIndicator: "+15%", relatedRequests: 24 },
  { id: "my4", title: "Lead Management", category: "Lead Qualification", demandSignal: "high", growthIndicator: "+20%", relatedRequests: 29 },
  { id: "my5", title: "Email Operations", category: "Email Operations", demandSignal: "medium", growthIndicator: "+8%", relatedRequests: 22 },
  { id: "my6", title: "API Integration", category: "Software Development", demandSignal: "medium", growthIndicator: "+11%", relatedRequests: 18 },
]

export const newSkills: TrendItem[] = [
  { id: "ns1", title: "AI Workflow Mapping", category: "Workflow Automation", demandSignal: "high", growthIndicator: "+34%", relatedRequests: 42 },
  { id: "ns2", title: "CRM Repair", category: "CRM Setup", demandSignal: "high", growthIndicator: "+22%", relatedRequests: 31 },
  { id: "ns3", title: "Proposal Automation", category: "Software Development", demandSignal: "medium", growthIndicator: "+18%", relatedRequests: 19 },
  { id: "ns4", title: "Multi-channel Support Ops", category: "Voice Support", demandSignal: "medium", growthIndicator: "+14%", relatedRequests: 16 },
  { id: "ns5", title: "Real Estate Follow-up Systems", category: "Real Estate Ops", demandSignal: "high", growthIndicator: "+28%", relatedRequests: 27 },
  { id: "ns6", title: "Contractor Onboarding Automation", category: "Contractor Coordination", demandSignal: "medium", growthIndicator: "+12%", relatedRequests: 11 },
  { id: "ns7", title: "AI Meeting Summarization", category: "Software Development", demandSignal: "high", growthIndicator: "+31%", relatedRequests: 36 },
  { id: "ns8", title: "Revenue Operations Design", category: "Sales Ops", demandSignal: "high", growthIndicator: "+25%", relatedRequests: 28 },
  { id: "ns9", title: "Outbound Sequence Building", category: "Email Operations", demandSignal: "medium", growthIndicator: "+16%", relatedRequests: 20 },
  { id: "ns10", title: "WhatsApp Business Automation", category: "Voice Support", demandSignal: "medium", growthIndicator: "+13%", relatedRequests: 14 },
  { id: "ns11", title: "AI Document Processing", category: "Workflow Automation", demandSignal: "high", growthIndicator: "+29%", relatedRequests: 34 },
  { id: "ns12", title: "Inventory Ops Automation", category: "Contractor Coordination", demandSignal: "low", growthIndicator: "+7%", relatedRequests: 9 },
  { id: "ns13", title: "Predictive Lead Scoring", category: "Lead Qualification", demandSignal: "high", growthIndicator: "+26%", relatedRequests: 30 },
  { id: "ns14", title: "Client Portal Development", category: "Software Development", demandSignal: "medium", growthIndicator: "+17%", relatedRequests: 21 },
]

export const updatedSkills: TrendItem[] = [
  { id: "us1", title: "Salesforce Administration", category: "CRM Setup", demandSignal: "high", growthIndicator: "+14%", relatedRequests: 38, trendDirection: "up", percentChange: 14, lastUpdated: "2 days ago", relatedCategories: ["CRM Setup", "Sales Ops"] },
  { id: "us2", title: "Email Deliverability", category: "Email Operations", demandSignal: "medium", growthIndicator: "+8%", relatedRequests: 22, trendDirection: "up", percentChange: 8, lastUpdated: "3 days ago", relatedCategories: ["Email Operations", "Marketing"] },
  { id: "us3", title: "WordPress Maintenance", category: "Website Support", demandSignal: "low", growthIndicator: "-3%", relatedRequests: 14, trendDirection: "down", percentChange: -3, lastUpdated: "1 day ago", relatedCategories: ["Website Support"] },
  { id: "us4", title: "Cold Calling", category: "Appointment Setting", demandSignal: "medium", growthIndicator: "+6%", relatedRequests: 18, trendDirection: "up", percentChange: 6, lastUpdated: "4 days ago", relatedCategories: ["Lead Qualification", "Sales Ops"] },
  { id: "us5", title: "Zapier Integrations", category: "Workflow Automation", demandSignal: "high", growthIndicator: "+19%", relatedRequests: 33, trendDirection: "up", percentChange: 19, lastUpdated: "1 day ago", relatedCategories: ["Workflow Automation", "CRM Setup"] },
  { id: "us6", title: "HubSpot Configuration", category: "CRM Setup", demandSignal: "high", growthIndicator: "+16%", relatedRequests: 29, trendDirection: "up", percentChange: 16, lastUpdated: "2 days ago", relatedCategories: ["CRM Setup", "Marketing"] },
  { id: "us7", title: "Google Ads Management", category: "Marketing", demandSignal: "medium", growthIndicator: "+9%", relatedRequests: 20, trendDirection: "up", percentChange: 9, lastUpdated: "3 days ago", relatedCategories: ["Marketing", "Lead Qualification"] },
  { id: "us8", title: "Data Migration", category: "Software Development", demandSignal: "medium", growthIndicator: "+11%", relatedRequests: 17, trendDirection: "up", percentChange: 11, lastUpdated: "5 days ago", relatedCategories: ["Software Development", "CRM Setup"] },
  { id: "us9", title: "Virtual Receptionist Setup", category: "Voice Support", demandSignal: "medium", growthIndicator: "+10%", relatedRequests: 15, trendDirection: "up", percentChange: 10, lastUpdated: "2 days ago", relatedCategories: ["Voice Support", "Appointment Setting"] },
  { id: "us10", title: "SEO Audit & Remediation", category: "Website Support", demandSignal: "low", growthIndicator: "+4%", relatedRequests: 12, trendDirection: "up", percentChange: 4, lastUpdated: "6 days ago", relatedCategories: ["Website Support", "Marketing"] },
  { id: "us11", title: "Slack Workflow Bots", category: "Workflow Automation", demandSignal: "high", growthIndicator: "+21%", relatedRequests: 26, trendDirection: "up", percentChange: 21, lastUpdated: "1 day ago", relatedCategories: ["Workflow Automation"] },
  { id: "us12", title: "Bookkeeping Automation", category: "Contractor Coordination", demandSignal: "medium", growthIndicator: "+7%", relatedRequests: 13, trendDirection: "up", percentChange: 7, lastUpdated: "4 days ago", relatedCategories: ["Contractor Coordination"] },
]

export const marketSignals = [
  { id: "ms1", label: "Emerging Demand", value: "AI Workflow Mapping", detail: "42 new requests this month" },
  { id: "ms2", label: "Most Requested Skills", value: "CRM + Automation", detail: "Combined 73 active requests" },
  { id: "ms3", label: "Fastest Growing Category", value: "Real Estate Ops", detail: "+28% month over month" },
  { id: "ms4", label: "Regional Activity", value: "US Northeast", detail: "Highest volume, 34% of total" },
]
