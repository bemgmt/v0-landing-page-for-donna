import type { ProfileData } from "../types"

export const profileData: ProfileData = {
  name: "Derek Thornton",
  company: "BEM Management",
  description:
    "Full-service business operations and technology consultancy specializing in workflow automation, CRM optimization, and digital transformation for mid-market enterprises.",
  verified: true,
  matchQuality: "High",
  avgResponse: "23 min",
  coverageRegions: ["United States", "Canada", "United Kingdom"],
  preferredBudgetMin: 1500,
  preferredBudgetMax: 10000,
  skills: [
    "Workflow Automation",
    "CRM Setup",
    "Process Design",
    "Lead Management",
    "Email Operations",
    "API Integration",
    "Sales Ops",
    "Real Estate Tech",
    "Voice Support",
    "Data Analysis",
  ],
  categories: [
    "Software Development",
    "CRM Setup",
    "Workflow Automation",
    "Real Estate Ops",
    "Email Operations",
    "Lead Qualification",
  ],
  certifications: [
    "Verified DONNA Node",
    "DIN Trusted Provider",
    "Fast Responder Badge",
    "Premium Network Member",
  ],
  metrics: [
    { id: "pm1", label: "Projects Completed", value: 47, description: "Across all DIN categories" },
    { id: "pm2", label: "Client Retention", value: "94%", description: "Repeat engagement rate" },
    { id: "pm3", label: "Avg. Delivery Time", value: "4.2 days", description: "Below network average" },
    { id: "pm4", label: "Network Rating", value: "4.8 / 5", description: "Based on 38 reviews" },
    { id: "pm5", label: "Response Speed", value: "23 min", description: "Faster than 89% of nodes" },
    { id: "pm6", label: "Bid Success Rate", value: "68%", description: "Above network median" },
  ],
}
