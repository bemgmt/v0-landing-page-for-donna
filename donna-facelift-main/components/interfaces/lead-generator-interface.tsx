"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Target, TrendingUp, Plus, Search, Filter, Download, Upload, Eye, Mail, Phone, CheckCircle, XCircle, FileText } from "lucide-react"
import { getDemoLeadGeneratorData } from "@/lib/investor/demo-seed"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: 'website' | 'social' | 'referral' | 'event' | 'cold_outreach'
  score: number
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  created_at: string
  last_contact?: string
  notes?: string
}

interface LeadGeneratorData {
  leads: Lead[]
  stats: {
    total_leads: number
    qualified_leads: number
    conversion_rate: number
    avg_score: number
  }
  sources: {
    [key: string]: number
  }
}

const LeadGeneratorInterface: React.FC = () => {
  const [leadData, setLeadData] = useState<LeadGeneratorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'generate' | 'import'>('overview')
  // Search and filter UI planned for a future iteration
  const [showAddLead, setShowAddLead] = useState(false)
  // showAddLead will be used for modal/form display in future
  void showAddLead

  // Lead generation states
  const [generationCriteria, setGenerationCriteria] = useState({
    industry: '',
    location: '',
    company_size: '',
    job_title: '',
    keywords: ''
  })

  // Shell mode — shared investor demo seed
  useEffect(() => {
    const seeded = getDemoLeadGeneratorData()
    const mockData: LeadGeneratorData = {
        leads: seeded.leads as Lead[],
        stats: seeded.stats,
        sources: { ...seeded.sources }
      }
      
      setLeadData(mockData)
      setLoading(false)
    }, [])

  // Shell mode - visual only
  const generateLeads = async () => {
    alert("Design Preview Mode - Lead generation disabled")
    // No API call in shell mode
  }
  

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full glass-dark p-6 rounded-lg overflow-hidden backdrop-blur" data-tour="lead-generator-content">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-light text-white">Lead Generator</h2>
            <p className="text-white/60 text-sm">Generate, import, and manage leads</p>
          </div>
          <button
            onClick={() => setShowAddLead(true)}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {['overview', 'leads', 'generate', 'import'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white/60 text-sm">Total Leads</p>
                    <p className="text-2xl font-light text-white">{leadData?.stats.total_leads || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-white/60 text-sm">Qualified</p>
                    <p className="text-2xl font-light text-white">{leadData?.stats.qualified_leads || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white/60 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-light text-white">{leadData?.stats.conversion_rate || 0}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-orange-400" />
                  <div>
                    <p className="text-white/60 text-sm">Avg Score</p>
                    <p className="text-2xl font-light text-white">{leadData?.stats.avg_score || 0}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="glass rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">AI Lead Generation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Industry</label>
                    <input
                      type="text"
                      value={generationCriteria.industry}
                      onChange={(e) => setGenerationCriteria(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Technology, Healthcare, Finance"
                      className="w-full glass border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Location</label>
                    <input
                      type="text"
                      value={generationCriteria.location}
                      onChange={(e) => setGenerationCriteria(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Los Angeles, CA"
                      className="w-full glass border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Company Size</label>
                    <select
                      value={generationCriteria.company_size}
                      onChange={(e) => setGenerationCriteria(prev => ({ ...prev, company_size: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="">Any Size</option>
                      <option value="startup">Startup (1-10)</option>
                      <option value="small">Small (11-50)</option>
                      <option value="medium">Medium (51-200)</option>
                      <option value="large">Large (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Job Title</label>
                    <input
                      type="text"
                      value={generationCriteria.job_title}
                      onChange={(e) => setGenerationCriteria(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="e.g., CEO, Marketing Director, CTO"
                      className="w-full glass border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-white/60 text-sm mb-2">Keywords</label>
                  <input
                    type="text"
                    value={generationCriteria.keywords}
                    onChange={(e) => setGenerationCriteria(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="e.g., SaaS, AI, automation, digital transformation"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <button
                  onClick={generateLeads}
                  className="mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Generate Leads
                </button>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="h-full flex flex-col">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    className="w-full glass border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <select className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40">
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <button className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-4 py-2 text-white flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-4 py-2 text-white flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {leadData?.leads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{lead.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            lead.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                            lead.status === 'qualified' ? 'bg-blue-500/20 text-blue-400' :
                            lead.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                            lead.status === 'new' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {lead.status}
                          </span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Score: {lead.score}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">{lead.email}</p>
                        {lead.phone && <p className="text-white/60 text-sm">{lead.phone}</p>}
                        {lead.company && <p className="text-white/50 text-xs mt-1">{lead.company}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                          <span>Source: {lead.source}</span>
                          {lead.last_contact && <span>Last: {new Date(lead.last_contact).toLocaleDateString()}</span>}
                          {lead.notes && <span className="text-white/50">{lead.notes}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="View">
                          <Eye className="w-4 h-4 text-white/60" />
                        </button>
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="Email">
                          <Mail className="w-4 h-4 text-white/60" />
                        </button>
                        {lead.phone && (
                          <button className="p-2 hover:bg-white/20 rounded transition-colors" title="Call">
                            <Phone className="w-4 h-4 text-white/60" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="glass rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Import Leads</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                    <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">Drag and drop CSV file here, or click to browse</p>
                    <button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm transition-colors">
                      Choose File
                    </button>
                    <p className="text-white/40 text-xs mt-2">Supports CSV, Excel, and Google Sheets</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Import Format
                    </h4>
                    <p className="text-white/60 text-sm mb-2">Your CSV should include the following columns:</p>
                    <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
                      <li>Name (required)</li>
                      <li>Email (required)</li>
                      <li>Phone (optional)</li>
                      <li>Company (optional)</li>
                      <li>Source (optional)</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Recent Imports</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div>
                          <p className="text-white text-sm">leads_2024_01.csv</p>
                          <p className="text-white/60 text-xs">127 leads imported • 2 days ago</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div>
                          <p className="text-white text-sm">prospects_q4.csv</p>
                          <p className="text-white/60 text-xs">89 leads imported • 1 week ago</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadGeneratorInterface
