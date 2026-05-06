"use client"

import { useState } from "react"
import { Check, Info, Settings2, DollarSign, Calculator } from "lucide-react"

type ToolItem = {
  id: string
  name: string
  defaultCost: number
  description: string
}

const INDUSTRY_TOOLS: Record<string, ToolItem[]> = {
  "Real Estate": [
    { id: "crm", name: "Real Estate CRM (Follow Up Boss, etc.)", defaultCost: 150, description: "Lead tracking and pipeline." },
    { id: "tc", name: "Transaction Coordination Software", defaultCost: 80, description: "Checklists and deal tracking." },
    { id: "sms", name: "SMS / Dialers", defaultCost: 100, description: "Outbound communication." },
    { id: "va", name: "Virtual Assistant (Admin)", defaultCost: 600, description: "Manual data entry and task chasing." },
    { id: "zapier", name: "Integration Layer (Zapier)", defaultCost: 50, description: "Patching tools together." },
  ],
  "Mortgage": [
    { id: "los", name: "LOS / CRM", defaultCost: 250, description: "Loan origination system and tracking." },
    { id: "pos", name: "Point of Sale Software", defaultCost: 150, description: "Borrower application intake." },
    { id: "processor", name: "Processing Assistant", defaultCost: 800, description: "Chasing docs and conditions." },
    { id: "sms", name: "Communication Tools", defaultCost: 100, description: "Email and SMS platforms." },
  ],
  "Home Services": [
    { id: "fsm", name: "Field Service Management (ServiceTitan, etc.)", defaultCost: 200, description: "Dispatch and invoicing." },
    { id: "callcenter", name: "Answering Service / Receptionist", defaultCost: 450, description: "Handling inbound leads." },
    { id: "marketing", name: "Lead Nurture / CRM", defaultCost: 150, description: "Follow-ups and estimates." },
    { id: "zapier", name: "Automations", defaultCost: 50, description: "Syncing leads to dispatch." },
  ],
  "Other / Custom": [
    { id: "crm", name: "Primary CRM / Database", defaultCost: 150, description: "Lead tracking and pipeline." },
    { id: "marketing", name: "Marketing & Communications", defaultCost: 100, description: "Email and SMS platforms." },
    { id: "ops", name: "Operations & Task Management", defaultCost: 80, description: "Checklists and project tracking." },
    { id: "admin", name: "Virtual Assistants / Admin Support", defaultCost: 500, description: "Manual data entry and task chasing." },
    { id: "automations", name: "Automations & Integrations", defaultCost: 50, description: "Patching tools together." },
    { id: "other", name: "Other Subscriptions", defaultCost: 0, description: "Any other tool costs." },
  ]
}

export default function ToolStackAudit() {
  const [industry, setIndustry] = useState<"Real Estate" | "Mortgage" | "Home Services" | "Other / Custom">("Real Estate")
  
  // Custom costs overriding defaults
  const [customCosts, setCustomCosts] = useState<Record<string, number>>({})
  
  // Hidden cost sliders
  const [hoursLost, setHoursLost] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(50)

  const currentTools = INDUSTRY_TOOLS[industry]

  const getCost = (id: string, defaultCost: number) => {
    return customCosts[id] !== undefined ? customCosts[id] : defaultCost
  }

  const handleCostChange = (id: string, value: string) => {
    const num = parseInt(value) || 0
    setCustomCosts(prev => ({ ...prev, [id]: num }))
  }

  const hardCost = currentTools.reduce((acc, tool) => acc + getCost(tool.id, tool.defaultCost), 0)
  const hiddenCost = (hoursLost * hourlyRate) * 4 // approx 4 weeks per month
  const totalCost = hardCost + hiddenCost
  const donnaCost = 500 // Baseline tier comparison

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Industry Selector */}
      <div className="flex flex-wrap justify-center gap-4">
        {Object.keys(INDUSTRY_TOOLS).map((ind) => (
          <button
            key={ind}
            onClick={() => {
              setIndustry(ind as any)
              setCustomCosts({}) // Reset overrides on industry change
            }}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
              industry === ind
                ? "bg-accent text-background shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                : "glass-card hover:border-accent/50 text-foreground/80"
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Settings2 className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-xl font-medium text-foreground">Current Software Stack</h3>
            </div>

            <div className="space-y-4">
              {currentTools.map((tool) => (
                <div key={tool.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">{tool.name}</label>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                  <div className="relative w-full sm:w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={getCost(tool.id, tool.defaultCost)}
                      onChange={(e) => handleCostChange(tool.id, e.target.value)}
                      className="w-full bg-background/50 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-foreground focus:outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4 pt-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Info className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-medium text-foreground">The Hidden Cost of Fragmentation</h3>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Software subscriptions are only 30% of your real cost. The rest is lost productivity moving data between systems, chasing updates, and dropped leads.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-foreground">Hours lost per week to manual tasks & data entry</label>
                    <span className="text-orange-400 font-medium">{hoursLost} hrs</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="40" 
                    value={hoursLost} 
                    onChange={(e) => setHoursLost(parseInt(e.target.value))}
                    className="w-full accent-orange-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-foreground">Average hourly value of staff/operators</label>
                    <span className="text-orange-400 font-medium">${hourlyRate}/hr</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" max="150" step="5"
                    value={hourlyRate} 
                    onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                    className="w-full accent-orange-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-foreground/5 rounded-lg">
                <Calculator className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground">Monthly Operational Cost</h3>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Software Hard Spend</p>
                  <p className="text-2xl font-semibold text-foreground">${hardCost.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hidden Cost (Time Lost)</p>
                  <p className="text-2xl font-semibold text-orange-400">${hiddenCost.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-background/40 p-4 rounded-xl border border-white/5">
                <p className="text-sm text-muted-foreground mb-1">Total Current Cost (Monthly)</p>
                <p className="text-4xl font-bold text-foreground">${totalCost.toLocaleString()}</p>
              </div>

              <div className="pt-6 relative">
                <div className="absolute inset-x-0 -top-6 border-t border-dashed border-white/20" />
                <p className="text-sm font-medium text-accent mb-4 uppercase tracking-widest">The DONNA Alternative</p>
                <div className="bg-accent/10 border border-accent/20 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-medium">Unified Infrastructure</p>
                    <p className="text-2xl font-bold text-accent">From ${donnaCost}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-foreground/80">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Replace 3-5 disparate tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Reclaim {hoursLost} hours/week of operator time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Eliminate integration breakages</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <p className="text-sm text-center text-accent/80 font-medium">
                      Estimated Monthly Savings: ${(totalCost - donnaCost).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
