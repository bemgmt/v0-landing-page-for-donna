import type { SettingsOption } from "../types"

export const generalSettings: SettingsOption[] = [
  { id: "s1", label: "Email Notifications", description: "Receive email alerts for new matches and bid updates", type: "toggle", value: true },
  { id: "s2", label: "Push Notifications", description: "Browser push notifications for closing-soon bids", type: "toggle", value: true },
  { id: "s3", label: "Weekly Digest", description: "Receive a weekly summary of DIN activity", type: "toggle", value: false },
  { id: "s4", label: "Profile Visibility", description: "Make your DIN profile visible to other network members", type: "toggle", value: true },
]

export const paymentProfileData = {
  legalBusinessName: "BEM Management LLC",
  billingEmail: "billing@bemmanagement.com",
  payoutMethod: "ACH Direct Deposit",
  taxStatus: "W-9 on file",
  defaultCurrency: "USD",
  businessAddress: "123 Commerce Ave, Suite 400, Austin, TX 78701",
}

export const automaticBidSettings: SettingsOption[] = [
  { id: "ab1", label: "Enable Automatic Bids", description: "Allow DONNA to submit bids on your behalf when match criteria are met", type: "toggle", value: false },
  { id: "ab2", label: "Minimum Bid Amount", description: "Lowest amount for automatic bids", type: "input", value: 1000, min: 500, max: 50000 },
  { id: "ab3", label: "Maximum Bid Amount", description: "Highest amount for automatic bids", type: "input", value: 5000, min: 500, max: 50000 },
  { id: "ab4", label: "Fit Threshold", description: "Minimum fit score required to auto-bid", type: "slider", value: 80, min: 50, max: 100 },
  { id: "ab5", label: "Require Human Review", description: "Get approval notification before auto-bids are submitted", type: "toggle", value: true },
  { id: "ab6", label: "Cooldown Window", description: "Minimum hours between automatic bids", type: "select", value: "4 hours", options: ["1 hour", "2 hours", "4 hours", "8 hours", "24 hours"] },
  { id: "ab7", label: "Max Bids Per Day", description: "Maximum number of automatic bids per day", type: "select", value: "5", options: ["1", "3", "5", "10", "Unlimited"] },
]

export const preferredCategories = [
  "Software Development",
  "CRM Setup",
  "Workflow Automation",
  "Real Estate Ops",
  "Email Operations",
]

export const excludedCategories = [
  "Branding",
  "Voice Support",
]
