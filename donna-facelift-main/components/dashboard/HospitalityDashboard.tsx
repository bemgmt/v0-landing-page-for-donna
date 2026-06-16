"use client"

import { Calendar, Users, BedDouble, Clock, Bell, Star } from "lucide-react"

const stats = [
  { label: "Today's Check-ins", value: "8", icon: Users, trend: "3 VIP guests" },
  { label: "Reservations", value: "24", icon: Calendar, trend: "+5 new today" },
  { label: "Occupancy Rate", value: "87%", icon: BedDouble, trend: "Up 4% vs last week" },
  { label: "Pending Requests", value: "6", icon: Bell, trend: "2 urgent" },
]

const todayCheckins = [
  { guest: "Maria Gonzalez", room: "Suite 412", time: "2:00 PM", vip: true },
  { guest: "Robert Chen", room: "Room 208", time: "3:00 PM", vip: false },
  { guest: "Aisha Patel", room: "Suite 601", time: "4:30 PM", vip: true },
]

const recentRequests = [
  { guest: "Room 305", request: "Extra towels & pillows", time: "10 min ago", priority: "normal" },
  { guest: "Suite 412", request: "Airport shuttle arrangement", time: "25 min ago", priority: "urgent" },
  { guest: "Room 118", request: "Late checkout request", time: "1 hour ago", priority: "normal" },
]

export function HospitalityDashboard() {
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
            <Users className="w-4 h-4 text-[var(--donna-purple)]" />
            <h3 className="text-sm font-semibold text-white">Today&apos;s Check-ins</h3>
          </div>
          <div className="space-y-3">
            {todayCheckins.map((checkin) => (
              <div
                key={checkin.guest}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white/90 font-medium">{checkin.guest}</p>
                      {checkin.vip && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      {checkin.room} · {checkin.time}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-400">
                  Arriving
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-[var(--donna-cyan)]" />
            <h3 className="text-sm font-semibold text-white">Guest Requests</h3>
          </div>
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <div
                key={req.request}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div>
                  <p className="text-sm text-white/90 font-medium">{req.request}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {req.guest} · {req.time}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    req.priority === "urgent"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-white/8 text-white/50"
                  }`}
                >
                  {req.priority === "urgent" ? "Urgent" : "Normal"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
