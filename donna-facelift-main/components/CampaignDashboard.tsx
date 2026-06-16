"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Play, Pause, BarChart3, Users, Mail, Calendar, Eye, Edit } from "lucide-react"

interface Campaign {
  id: string
  name: string
  eventName: string
  contactLabel: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  stats: {
    totalContacts: number
    emailsSent: number
    replies: number
    meetings: number
    openRate: number
    replyRate: number
  }
  createdAt: string
  lastActivity: string
}

interface CampaignDashboardProps {
  onCreateCampaign: () => void
  onEditCampaign: (campaign: Campaign) => void
}

const CampaignDashboard: React.FC<CampaignDashboardProps> = ({ 
  onCreateCampaign, 
  onEditCampaign 
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [, setSelectedCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API call
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'West SGV Business Mixer Follow-up',
          eventName: 'West SGV Business Mixer',
          contactLabel: 'Networking Contact',
          status: 'active',
          stats: {
            totalContacts: 12,
            emailsSent: 24,
            replies: 3,
            meetings: 2,
            openRate: 75,
            replyRate: 25
          },
          createdAt: '2025-08-30',
          lastActivity: '2 hours ago'
        },
        {
          id: '2',
          name: 'Chamber Event Follow-up',
          eventName: 'Monterey Park Chamber Networking',
          contactLabel: 'Chamber Member',
          status: 'paused',
          stats: {
            totalContacts: 8,
            emailsSent: 8,
            replies: 1,
            meetings: 0,
            openRate: 62,
            replyRate: 12
          },
          createdAt: '2025-08-28',
          lastActivity: '1 day ago'
        },
        {
          id: '3',
          name: 'Trade Show Leads',
          eventName: 'LA Business Expo',
          contactLabel: 'Trade Show Lead',
          status: 'draft',
          stats: {
            totalContacts: 15,
            emailsSent: 0,
            replies: 0,
            meetings: 0,
            openRate: 0,
            replyRate: 0
          },
          createdAt: '2025-08-31',
          lastActivity: 'Never'
        }
      ]
      setCampaigns(mockCampaigns)
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400'
      case 'draft': return 'bg-gray-500/20 text-gray-400'
      case 'completed': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'draft': return <Edit className="w-3 h-3" />
      case 'completed': return <BarChart3 className="w-3 h-3" />
      default: return <Edit className="w-3 h-3" />
    }
  }

  const toggleCampaignStatus = async (campaignId: string, currentStatus: 'active' | 'paused' | 'draft' | 'completed') => {
    const newStatus: 'active' | 'paused' = currentStatus === 'active' ? 'paused' : 'active'
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: newStatus }
        : campaign
    ))
    // TODO: API call to update status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaign Management</h2>
          <p className="text-white/60 mt-1">Automate your networking follow-up sequences</p>
        </div>
        <button
          onClick={onCreateCampaign}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Active Campaigns', 
            value: campaigns.filter(c => c.status === 'active').length,
            icon: Play,
            color: 'text-green-400'
          },
          { 
            label: 'Total Contacts', 
            value: campaigns.reduce((sum, c) => sum + c.stats.totalContacts, 0),
            icon: Users,
            color: 'text-blue-400'
          },
          { 
            label: 'Emails Sent', 
            value: campaigns.reduce((sum, c) => sum + c.stats.emailsSent, 0),
            icon: Mail,
            color: 'text-purple-400'
          },
          { 
            label: 'Meetings Booked', 
            value: campaigns.reduce((sum, c) => sum + c.stats.meetings, 0),
            icon: Calendar,
            color: 'text-orange-400'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass border border-white/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-2">No campaigns yet</h3>
            <p className="text-white/40 mb-4">Create your first networking follow-up campaign</p>
            <button
              onClick={onCreateCampaign}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-white">{campaign.name}</h3>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-white/60 mb-4">Event: {campaign.eventName}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <p className="text-xs text-white/40">Contacts</p>
                      <p className="text-sm font-medium text-white">{campaign.stats.totalContacts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Emails Sent</p>
                      <p className="text-sm font-medium text-white">{campaign.stats.emailsSent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Replies</p>
                      <p className="text-sm font-medium text-white">{campaign.stats.replies}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Meetings</p>
                      <p className="text-sm font-medium text-white">{campaign.stats.meetings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Open Rate</p>
                      <p className="text-sm font-medium text-white">{campaign.stats.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Reply Rate</p>
                      <p className="text-sm font-medium text-white">{campaign.stats.replyRate}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEditCampaign(campaign)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit Campaign"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {campaign.status !== 'draft' && (
                    <button
                      onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.status === 'active'
                          ? 'text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-green-400 hover:bg-green-500/10'
                      }`}
                      title={campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                    >
                      {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40">
                  Created {campaign.createdAt} • Last activity: {campaign.lastActivity}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default CampaignDashboard
