"use client"

import { Building2, Calendar, UserCheck, FileText, TrendingUp, MapPin } from "lucide-react"

const stats = [
  { label: "Active Listings", value: "12", icon: Building2, trend: "+2 this week" },
  { label: "Upcoming Showings", value: "5", icon: Calendar, trend: "Next: Today 3PM" },
  { label: "Qualified Leads", value: "28", icon: UserCheck, trend: "+8 this month" },
  { label: "Documents Pending", value: "3", icon: FileText, trend: "2 need signatures" },
]

const upcomingShowings = [
  { property: "42 Maple Drive", time: "Today, 3:00 PM", status: "Confirmed" },
  { property: "118 Oak Boulevard", time: "Tomorrow, 10:00 AM", status: "Pending" },
  { property: "7 Pine Court", time: "Tomorrow, 2:30 PM", status: "Confirmed" },
]

const recentLeads = [
  { name: "Sarah Mitchell", interest: "3-bed, Downtown", score: 92 },
  { name: "James Olowu", interest: "2-bed, Lakeside", score: 85 },
  { name: "Chen Wei", interest: "Commercial, Midtown", score: 78 },
]

export function RealEstateDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/8">
                <stat.icon className="w-4 h-4 text-[var(--donna-cyan)]" />
              </div>
              <span className="text-xs text-white/50 uppercase tracking-wider font-medium">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[var(--donna-purple)]" />
            <h3 className="text-sm font-semibold text-white">Upcoming Showings</h3>
          </div>
          <div className="space-y-3">
            {upcomingShowings.map((showing) => (
              <div
                key={showing.property}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div>
                  <p className="text-sm text-white/90 font-medium">{showing.property}</p>
                  <p className="text-xs text-white/50 mt-0.5">{showing.time}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    showing.status === "Confirmed"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {showing.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--donna-cyan)]" />
            <h3 className="text-sm font-semibold text-white">Top Leads</h3>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.name}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div>
                  <p className="text-sm text-white/90 font-medium">{lead.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{lead.interest}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--donna-purple)] to-[var(--donna-cyan)]"
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/50">{lead.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
