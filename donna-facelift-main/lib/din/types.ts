export type BidStatus = "open" | "pending" | "won" | "lost" | "closing-soon"

export interface BidItem {
  id: string
  title: string
  category: string
  budgetMin: number
  budgetMax: number
  skills: string[]
  timeRemaining: string
  status: BidStatus
  locked?: boolean
  fitScore?: number
  location?: string
  submittedAmount?: number
  decisionDate?: string
  submittedDate?: string
  projectValue?: number
  note?: string
  recommendedAction?: string
}

export interface DashboardStat {
  id: string
  label: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
  icon?: string
}

export interface NewsItem {
  id: string
  title: string
  timestamp: string
  category?: string
}

export interface MatchProfile {
  id: string
  companyName: string
  industry: string
  matchedSkills: string[]
  fitScore: number
  responseSpeed: string
  verified: boolean
  whyMatch: string
  tags: string[]
}

export interface TrendItem {
  id: string
  title: string
  category: string
  demandSignal: "high" | "medium" | "low"
  growthIndicator: string
  relatedRequests: number
  trendDirection?: "up" | "down" | "stable"
  percentChange?: number
  lastUpdated?: string
  relatedCategories?: string[]
}

export interface DiscussionThread {
  id: string
  title: string
  category: string
  replies: number
  lastActivity: string
  author: string
  pinned?: boolean
  trending?: boolean
}

export interface ForumCategory {
  id: string
  name: string
  description: string
  threadCount: number
  icon?: string
}

export interface ProfileData {
  name: string
  company: string
  description: string
  verified: boolean
  matchQuality: string
  avgResponse: string
  coverageRegions: string[]
  preferredBudgetMin: number
  preferredBudgetMax: number
  skills: string[]
  categories: string[]
  certifications: string[]
  metrics: ProfileMetric[]
}

export interface ProfileMetric {
  id: string
  label: string
  value: string | number
  description?: string
}

export interface SettingsOption {
  id: string
  label: string
  description: string
  type: "toggle" | "select" | "input" | "slider"
  value: string | number | boolean
  options?: string[]
  min?: number
  max?: number
}

export interface DinNavGroup {
  label: string
  items: DinNavItem[]
}

export interface DinNavItem {
  href: string
  label: string
  icon: string
  badge?: string | number
}
