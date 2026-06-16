import type { DashboardStat, NewsItem, BidItem, MatchProfile } from "../types"

export const dashboardStats: DashboardStat[] = [
  { id: "open-requests", label: "Open Requests", value: 128, change: "+12%", trend: "up" },
  { id: "active-bids", label: "Active Bids", value: 14, change: "+3", trend: "up" },
  { id: "win-rate", label: "Win Rate", value: "68%", change: "+4%", trend: "up" },
  { id: "new-matches", label: "New Matches", value: 6, change: "+2", trend: "up" },
  { id: "closing-soon", label: "Closing Soon", value: 3, trend: "neutral" },
  { id: "intel-updates", label: "Intelligence Updates", value: 12, change: "+5", trend: "up" },
]

export const dinNews: NewsItem[] = [
  { id: "n1", title: "Workflow automation demand up 18% this quarter", timestamp: "2h ago", category: "Market Signal" },
  { id: "n2", title: "Real estate ops requests trending across the network", timestamp: "4h ago", category: "Trend" },
  { id: "n3", title: "Three new verified DIN categories added", timestamp: "6h ago", category: "Network Update" },
  { id: "n4", title: "Average response window down 12% — network speed improving", timestamp: "8h ago", category: "Performance" },
  { id: "n5", title: "Contractor coordination requests surpass Q1 forecast", timestamp: "12h ago", category: "Market Signal" },
]

export const activeBidsPreview: BidItem[] = [
  {
    id: "ab1",
    title: "CRM Cleanup + Workflow Setup",
    category: "CRM Setup",
    budgetMin: 2500,
    budgetMax: 5000,
    skills: ["Salesforce", "Zapier", "Process Design"],
    timeRemaining: "02h 15m",
    status: "open",
    fitScore: 91,
  },
  {
    id: "ab2",
    title: "Real Estate Lead Routing Support",
    category: "Real Estate Ops",
    budgetMin: 1500,
    budgetMax: 3000,
    skills: ["Lead Management", "CRM", "Automation"],
    timeRemaining: "04h 30m",
    status: "open",
    fitScore: 84,
  },
  {
    id: "ab3",
    title: "Email Operations Overhaul",
    category: "Email Operations",
    budgetMin: 3000,
    budgetMax: 6000,
    skills: ["Email Marketing", "Deliverability", "Analytics"],
    timeRemaining: "06h 10m",
    status: "pending",
    fitScore: 77,
  },
]

export const suggestedMatchesPreview: MatchProfile[] = [
  {
    id: "sm1",
    companyName: "Northstar Ops Collective",
    industry: "Workflow Automation",
    matchedSkills: ["Process Design", "Zapier", "CRM"],
    fitScore: 94,
    responseSpeed: "18 min avg",
    verified: true,
    whyMatch: "Strong category overlap with your recent requests",
    tags: ["Verified DONNA Node", "Fast Responder"],
  },
  {
    id: "sm2",
    companyName: "Blue Harbor Automation",
    industry: "Software Development",
    matchedSkills: ["API Integration", "Automation", "Testing"],
    fitScore: 88,
    responseSpeed: "22 min avg",
    verified: true,
    whyMatch: "Matched based on recent network demand signals",
    tags: ["Verified DONNA Node", "Strong Category Match"],
  },
]
