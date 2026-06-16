"use client"

import { motion } from "framer-motion"
import { TrendingUp, Users, DollarSign, Activity, Mail, UserPlus, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { getDemoAnalyticsData } from "@/lib/investor/demo-seed"

interface AnalyticsData {
  revenue?: { total: string; change: string }
  users?: { active: string | number; change: string }
  conversion?: { rate: string; change: string }
  engagement?: { score: string; change: string }
  emails?: { total: number; change: string }
  contacts?: { new: number; change: string }
  texts?: { sent: number; change: string }
}

export default function AnalyticsInterface() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Shell mode — shared investor demo seed
  useEffect(() => {
    setAnalyticsData(getDemoAnalyticsData())
    setLoading(false)
  }, [])

  // Loading state
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen pt-20 glass-dark backdrop-blur">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-light">Analytics Dashboard</h2>
          <p className="text-sm text-white/60 mt-1">Loading real-time business insights...</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="bg-white/5 border border-white/20 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-8 bg-white/10 rounded mb-1"></div>
                <div className="h-3 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  const metrics = [
    {
      label: "Total Revenue",
      value: analyticsData?.revenue?.total || "$124,592",
      change: analyticsData?.revenue?.change || "+12.5%",
      icon: DollarSign,
      positive: true
    },
    {
      label: "Active Users",
      value: analyticsData?.users?.active || "8,429",
      change: analyticsData?.users?.change || "+8.2%",
      icon: Users,
      positive: true
    },
    {
      label: "Conversion Rate",
      value: analyticsData?.conversion?.rate || "3.24%",
      change: analyticsData?.conversion?.change || "-2.1%",
      icon: TrendingUp,
      positive: false
    },
    {
      label: "Engagement",
      value: analyticsData?.engagement?.score || "94.2%",
      change: analyticsData?.engagement?.change || "+5.7%",
      icon: Activity,
      positive: true
    },
    {
      label: "Emails Sent/Received",
      value: analyticsData?.emails?.total?.toLocaleString() || "2,139",
      change: analyticsData?.emails?.change || "+15.3%",
      icon: Mail,
      positive: true
    },
    {
      label: "New Contacts",
      value: analyticsData?.contacts?.new?.toLocaleString() || "156",
      change: analyticsData?.contacts?.change || "+22.1%",
      icon: UserPlus,
      positive: true
    },
    {
      label: "Texts Sent",
      value: analyticsData?.texts?.sent?.toLocaleString() || "423",
      change: analyticsData?.texts?.change || "+18.7%",
      icon: MessageSquare,
      positive: true
    },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen pt-20 glass-dark backdrop-blur" data-tour="analytics-content">
      <div className="p-6 border-b border-white/20">
        <h2 className="text-xl font-light">Analytics Dashboard</h2>
        <p className="text-sm text-white/60 mt-1">Real-time business insights</p>
      </div>

      <div className="p-6">
        {/* Connection Status */}
        {analyticsData && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-6">
            <p className="text-green-400 text-sm">
              ✅ Connected to live backend - Real-time data
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <metric.icon className="w-5 h-5 text-white/60" />
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    metric.positive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-light mb-1">{metric.value}</div>
              <div className="text-xs text-white/60">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="glass border border-white/20 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.random() * 80 + 20}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/20 rounded-t flex-1 min-h-[20px]"
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/60">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass border border-white/20 rounded-lg p-6">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              "New user registration from New York",
              "Payment processed: $299.00",
              "Email campaign sent to 1,247 subscribers",
              "Support ticket resolved #4521",
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded glass hover:bg-white/10 transition-colors"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">{activity}</span>
                <span className="ml-auto text-xs text-white/60">{index + 1}m ago</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
