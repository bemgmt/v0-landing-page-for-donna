"use client"

import { Users, Briefcase, Clock, FileText, CalendarCheck, TrendingUp } from "lucide-react"

const stats = [
  { label: "Active Clients", value: "34", icon: Users, trend: "+3 this month" },
  { label: "Open Projects", value: "12", icon: Briefcase, trend: "4 due this week" },
  { label: "Billable Hours", value: "126", icon: Clock, trend: "This week" },
  { label: "Pending Documents", value: "7", icon: FileText, trend: "3 awaiting review" },
]

const upcomingMeetings = [
  { client: "Meridian Partners", subject: "Q1 Review", time: "Today, 2:00 PM", type: "Video" },
  { client: "Apex Holdings", subject: "Contract Renewal", time: "Today, 4:30 PM", type: "In-person" },
  { client: "Nova Digital", subject: "Kickoff Meeting", time: "Tomorrow, 9:00 AM", type: "Video" },
]

const activeProjects = [
  { name: "Brand Strategy - Apex", status: "In Progress", progress: 72, deadline: "Mar 15" },
  { name: "Tax Filing - Meridian", status: "Review", progress: 90, deadline: "Mar 1" },
  { name: "Website Redesign - Nova", status: "Planning", progress: 25, deadline: "Apr 10" },
]

export function ProfessionalServicesDashboard() {
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
            <CalendarCheck className="w-4 h-4 text-[var(--donna-purple)]" />
            <h3 className="text-sm font-semibold text-white">Upcoming Meetings</h3>
          </div>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.subject}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div>
                  <p className="text-sm text-white/90 font-medium">{meeting.subject}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {meeting.client} · {meeting.time}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    meeting.type === "Video"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  {meeting.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--donna-cyan)]" />
            <h3 className="text-sm font-semibold text-white">Active Projects</h3>
          </div>
          <div className="space-y-3">
            {activeProjects.map((project) => (
              <div
                key={project.name}
                className="p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/90 font-medium">{project.name}</p>
                  <span className="text-xs text-white/40">Due {project.deadline}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--donna-purple)] to-[var(--donna-cyan)]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/50 w-8 text-right">
                    {project.progress}%
                  </span>
                </div>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    project.status === "In Progress"
                      ? "bg-blue-500/15 text-blue-400"
                      : project.status === "Review"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-white/8 text-white/50"
                  }`}
                >
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
