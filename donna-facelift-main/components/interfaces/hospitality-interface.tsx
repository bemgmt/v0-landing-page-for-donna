"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Phone, Clock, Settings, Play, CheckCircle, Users, Calendar, MapPin, Mail, Search, Filter, Plus, Eye, Edit, Download, Bell, Star } from "lucide-react"

interface Workflow {
  id: string
  name: string
  trigger_keywords: string[]
  response: string
}

interface Call {
  id: string
  caller?: string
  timestamp: string
  workflow_id?: string
  status: string
  data?: unknown
}

interface Reservation {
  id: string
  guest_name: string
  check_in: string
  check_out: string
  room_type: string
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  total_amount: number
  special_requests?: string
}

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  total_stays: number
  last_visit?: string
  preferences?: string[]
}

interface HospitalityData {
  workflows: Workflow[]
  recent_calls: Call[]
  reservations: Reservation[]
  guests: Guest[]
  stats: {
    total_workflows: number
    calls_today: number
    active_reservations: number
    guests_today: number
    occupancy_rate: number
    revenue_today: number
  }
}

const HospitalityInterface: React.FC = () => {
  const [hospitalityData, setHospitalityData] = useState<HospitalityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'calls' | 'reservations' | 'guests' | 'settings'>('overview')
  const [searchTerm, setSearchTerm] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; fetchHospitalityData encapsulates its own state updates
  useEffect(() => {
    fetchHospitalityData()
  }, [])

  const fetchHospitalityData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/donna'
      const response = await fetch(`${apiBase}/api/bridge.php?path=hospitality`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      if (result?.success) {
        setHospitalityData(result.data)
      } else {
        // Fallback dummy data
        setHospitalityData({
          workflows: [
            { id: '1', name: 'Room Service Request', trigger_keywords: ['room service', 'food', 'order'], response: 'I\'ll connect you with room service right away.' },
            { id: '2', name: 'Wake-up Call', trigger_keywords: ['wake up', 'alarm', 'morning call'], response: 'What time would you like your wake-up call?' },
            { id: '3', name: 'Concierge Service', trigger_keywords: ['concierge', 'recommendation', 'restaurant'], response: 'I\'d be happy to help with recommendations.' },
            { id: '4', name: 'Check-in Assistance', trigger_keywords: ['check in', 'arrival', 'registration'], response: 'Welcome! Let me help you with check-in.' },
          ],
          recent_calls: [
            { id: '1', caller: 'John Smith', timestamp: new Date().toISOString(), status: 'completed', workflow_id: '1' },
            { id: '2', caller: 'Sarah Johnson', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'completed', workflow_id: '2' },
            { id: '3', caller: 'Mike Davis', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'in_progress', workflow_id: '3' },
          ],
          reservations: [
            { id: '1', guest_name: 'John Smith', check_in: '2024-01-22', check_out: '2024-01-25', room_type: 'Deluxe Suite', status: 'confirmed', total_amount: 1200, special_requests: 'Late check-in requested' },
            { id: '2', guest_name: 'Sarah Johnson', check_in: '2024-01-20', check_out: '2024-01-23', room_type: 'Standard Room', status: 'checked_in', total_amount: 600 },
            { id: '3', guest_name: 'Mike Davis', check_in: '2024-01-21', check_out: '2024-01-24', room_type: 'Executive Suite', status: 'confirmed', total_amount: 1800 },
          ],
          guests: [
            { id: '1', name: 'John Smith', email: 'john@example.com', phone: '+1-555-0101', loyalty_tier: 'gold', total_stays: 12, last_visit: '2024-01-15', preferences: ['non-smoking', 'high floor'] },
            { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1-555-0102', loyalty_tier: 'platinum', total_stays: 25, last_visit: '2024-01-10', preferences: ['ocean view', 'late checkout'] },
            { id: '3', name: 'Mike Davis', email: 'mike@example.com', phone: '+1-555-0103', loyalty_tier: 'silver', total_stays: 5, last_visit: '2023-12-20' },
          ],
          stats: {
            total_workflows: 4,
            calls_today: 23,
            active_reservations: 12,
            guests_today: 8,
            occupancy_rate: 87.5,
            revenue_today: 15400
          }
        })
      }
    } catch (error: unknown) {
      console.error('Failed to fetch hospitality data:', error)
      // Set dummy data on error
      setHospitalityData({
        workflows: [],
        recent_calls: [],
        reservations: [],
        guests: [],
        stats: {
          total_workflows: 0,
          calls_today: 0,
          active_reservations: 0,
          guests_today: 0,
          occupancy_rate: 0,
          revenue_today: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerWorkflow = async (workflowId: string, data: Record<string, unknown> = {}) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/donna'
      const response = await fetch(`${apiBase}/api/bridge.php?path=hospitality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trigger_workflow',
          workflow_id: workflowId,
          data: data
        })
      })
      const result = await response.json()
      if (result?.success) {
        fetchHospitalityData() // Refresh data
        console.log('Workflow triggered successfully')
      }
    } catch (error: unknown) {
      console.error('Failed to trigger workflow:', error)
    }
  }

  const logCall = async (callData: Partial<Call>) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/donna'
      const response = await fetch(`${apiBase}/api/bridge.php?path=hospitality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'log_call',
          call: callData
        })
      })
      const result = await response.json()
      if (result?.success) {
        fetchHospitalityData() // Refresh data
      }
    } catch (error: unknown) {
      console.error('Failed to log call:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-6 rounded-lg overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-light text-white">Hospitality Dashboard</h2>
            <p className="text-white/60 text-sm">Manage guest services and workflows</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/60 text-sm">System Active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 overflow-x-auto">
          {['overview', 'workflows', 'calls', 'reservations', 'guests', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
            <div className="space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-orange-400" />
                  <div>
                    <p className="text-white/60 text-sm">Active Workflows</p>
                    <p className="text-2xl font-light text-white">{hospitalityData?.stats.total_workflows || 0}</p>
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
                  <Phone className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-white/60 text-sm">Calls Today</p>
                    <p className="text-2xl font-light text-white">{hospitalityData?.stats.calls_today || 0}</p>
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
                  <Clock className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white/60 text-sm">Avg Response</p>
                    <p className="text-2xl font-light text-white">45s</p>
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
                  <CheckCircle className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white/60 text-sm">Success Rate</p>
                    <p className="text-2xl font-light text-white">98%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-white/60 text-sm">Active Reservations</p>
                    <p className="text-2xl font-light text-white">{hospitalityData?.stats.active_reservations || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-pink-400" />
                  <div>
                    <p className="text-white/60 text-sm">Guests Today</p>
                    <p className="text-2xl font-light text-white">{hospitalityData?.stats.guests_today || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-white/60 text-sm">Occupancy Rate</p>
                    <p className="text-2xl font-light text-white">{hospitalityData?.stats.occupancy_rate || 0}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white/60 text-sm">Revenue Today</p>
                    <p className="text-2xl font-light text-white">${(hospitalityData?.stats.revenue_today || 0).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>

              </div>

              {/* Recent Activity */}
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-white font-medium mb-4">Recent Calls</h3>
                <div className="space-y-2">
                  {(hospitalityData?.recent_calls?.slice(0, 5) ?? []).map((call) => (
                    <div key={call.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                      <div>
                        <p className="text-white text-sm">{call.caller || 'Unknown Caller'}</p>
                        <p className="text-white/60 text-xs">{formatTime(call.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          call.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          call.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Reservations */}
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-medium">Upcoming Reservations</h3>
                  <button className="text-sm text-white/60 hover:text-white">View All</button>
                </div>
                <div className="space-y-3">
                  {hospitalityData?.reservations.slice(0, 3).map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{reservation.guest_name}</p>
                        <p className="text-white/60 text-sm">{reservation.room_type} • {new Date(reservation.check_in).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        reservation.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                        reservation.status === 'checked_in' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {reservation.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Available Workflows</h3>
                <button className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg text-sm transition-colors">
                  Add Workflow
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {hospitalityData?.workflows.map((workflow) => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{workflow.name}</h4>
                        <p className="text-white/60 text-sm mt-1">{workflow.response}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workflow.trigger_keywords.map((keyword, index) => (
                            <span key={index} className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => triggerWorkflow(workflow.id)}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 p-2 rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Call History</h3>
                <button
                  onClick={() => {
                    const caller = prompt('Caller Name:')
                    if (caller) {
                      logCall({ caller, status: 'completed' })
                    }
                  }}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Log Call
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {(hospitalityData?.recent_calls ?? []).map((call) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{call.caller || 'Unknown Caller'}</h4>
                        <p className="text-white/60 text-sm">{formatDate(call.timestamp)} at {formatTime(call.timestamp)}</p>
                        {call.workflow_id && (
                          <p className="text-white/60 text-xs mt-1">Workflow: {call.workflow_id}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        call.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        call.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {call.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium text-lg">Reservations</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search reservations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glass border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <button className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    New Reservation
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {hospitalityData?.reservations.map((reservation) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{reservation.guest_name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            reservation.status === 'checked_in' ? 'bg-green-500/20 text-green-400' :
                            reservation.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                            reservation.status === 'checked_out' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {reservation.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(reservation.check_in).toLocaleDateString()} - {new Date(reservation.check_out).toLocaleDateString()}
                          </span>
                          <span>{reservation.room_type}</span>
                        </div>
                        {reservation.special_requests && (
                          <p className="text-white/50 text-xs mt-1">Special: {reservation.special_requests}</p>
                        )}
                        <p className="text-white font-medium mt-2">${reservation.total_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="View Details">
                          <Eye className="w-4 h-4 text-white/60" />
                        </button>
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="Edit">
                          <Edit className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium text-lg">Guest Management</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glass border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <button className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Guest
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {hospitalityData?.guests.map((guest) => (
                  <motion.div
                    key={guest.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{guest.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            guest.loyalty_tier === 'platinum' ? 'bg-purple-500/20 text-purple-400' :
                            guest.loyalty_tier === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
                            guest.loyalty_tier === 'silver' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {guest.loyalty_tier}
                          </span>
                          {guest.loyalty_tier === 'platinum' && <Star className="w-4 h-4 text-purple-400" />}
                        </div>
                        <p className="text-white/60 text-sm">{guest.email}</p>
                        <p className="text-white/60 text-sm">{guest.phone}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                          <span>Total Stays: {guest.total_stays}</span>
                          {guest.last_visit && <span>Last Visit: {new Date(guest.last_visit).toLocaleDateString()}</span>}
                        </div>
                        {guest.preferences && guest.preferences.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {guest.preferences.map((pref, idx) => (
                              <span key={idx} className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                                {pref}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="View">
                          <Eye className="w-4 h-4 text-white/60" />
                        </button>
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="Email">
                          <Mail className="w-4 h-4 text-white/60" />
                        </button>
                        <button className="p-2 hover:bg-white/20 rounded transition-colors" title="Call">
                          <Phone className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full">
              <h3 className="text-white font-medium mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Voice Recognition</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Enable voice commands</span>
                    <button className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm">
                      Enabled
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Auto Response</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Automatic workflow triggers</span>
                    <button className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm">
                      Active
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Call Logging</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Log all incoming calls</span>
                    <button className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm">
                      Enabled
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Notifications</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Email notifications</span>
                      <button className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm">
                        Enabled
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">SMS alerts</span>
                      <button className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded text-sm">
                        Disabled
                      </button>
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

export default HospitalityInterface
