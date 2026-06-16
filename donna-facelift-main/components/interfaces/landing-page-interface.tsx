"use client"

import { motion } from "framer-motion"
import { Palette, Layout, Type, ImageIcon } from "lucide-react"

export default function LandingPageInterface() {
  const templates = [
    { name: "SaaS Startup", color: "bg-blue-500/20", icon: ImageIcon },
    { name: "E-commerce", color: "bg-green-500/20", icon: Layout },
    { name: "Portfolio", color: "bg-purple-500/20", icon: Palette },
    { name: "Agency", color: "bg-orange-500/20", icon: Type },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen pt-20">
      <div className="p-6 border-b border-white/20">
        <h2 className="text-xl font-light">Landing Page Generator</h2>
        <p className="text-sm text-white/60 mt-1">Create stunning landing pages with AI</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-8">
          {templates.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${template.color} border border-white/20 rounded-lg p-6 cursor-pointer hover:border-white/40 transition-colors`}
            >
              <template.icon className="w-8 h-8 mb-4" />
              <h3 className="font-medium mb-2">{template.name}</h3>
              <p className="text-sm text-white/60">Professional template for {template.name.toLowerCase()}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-6">
          <h3 className="font-medium mb-4">Quick Start</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter your business name..."
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
            />
            <textarea
              placeholder="Describe your business or product..."
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
            />
            <button className="bg-white text-black px-6 py-2 rounded hover:bg-white/90 transition-colors">
              Generate Landing Page
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
