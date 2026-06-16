"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MapPin, 
  Link as LinkIcon,
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit2,
  Send,
  FileText,
  AlertCircle,
  CheckSquare,
  Square,
  X
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { FuturisticInput } from "@/components/ui/futuristic-input"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { useInvestorPreviewOptional } from "@/contexts/InvestorPreviewContext"
import { toast } from "@/hooks/use-toast"
import {
  getDemoSecretaryDeadlines,
  getDemoSecretaryMeetings,
  getDemoSecretaryNotes,
  getDemoSecretaryTasks,
} from "@/lib/investor/demo-seed"

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: number
  participants: string[]
  location?: string
  meetingUrl?: string
  description?: string
  isDONNAInvited: boolean
  prepNotes?: string
}

interface Task {
  id: string
  text: string
  completed: boolean
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
}

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  tags?: string[]
}

interface Deadline {
  id: string
  title: string
  date: string
  time?: string
  priority: 'low' | 'medium' | 'high'
  relatedMeeting?: string
}

export default function SecretaryInterface(): JSX.Element {
  const investorCtx = useInvestorPreviewOptional()
  const isInvestorPreview = investorCtx?.isInvestorPreview ?? false

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'donna', content: string, timestamp: string}>>([])
  const [chatInput, setChatInput] = useState("")
  const [showAddMeeting, setShowAddMeeting] = useState(false)
  const [showAddURL, setShowAddURL] = useState(false)
  const [meetingURL, setMeetingURL] = useState("")
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [showAddNote, setShowAddNote] = useState(false)

  const simulateSecretaryCommand = (
    commandId: string,
    detail: string,
    toastDescription: string
  ) => {
    if (!isInvestorPreview) return
    toast({
      title: "Secretary (simulated)",
      description: toastDescription,
    })
    setChatMessages((prev) => [
      ...prev,
      {
        id: `sim-${Date.now()}`,
        role: "donna",
        content: `[Demo] Simulated command “${commandId}”: ${detail}`,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  // Initialize with shared demo seed (relative dates)
  useEffect(() => {
    const mockMeetings = getDemoSecretaryMeetings() as Meeting[]
    const mockTasks = getDemoSecretaryTasks() as Task[]
    const mockNotes = getDemoSecretaryNotes() as Note[]
    const mockDeadlines = getDemoSecretaryDeadlines() as Deadline[]

    setMeetings(mockMeetings)
    setTasks(mockTasks)
    setNotes(mockNotes)
    setDeadlines(mockDeadlines)
    
    // Set first upcoming meeting as selected
    const upcoming = mockMeetings.find(m => new Date(m.date) >= new Date()) || mockMeetings[0]
    if (upcoming) {
      setSelectedMeeting(upcoming)
      // Initialize chat with prep notes if available
      if (upcoming.prepNotes) {
        setChatMessages([
          {
            id: '1',
            role: 'donna',
            content: `I've prepared some notes for "${upcoming.title}". ${upcoming.prepNotes}`,
            timestamp: new Date().toISOString()
          }
        ])
      }
    }
  }, [])

  const handleAddMeeting = () => {
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: 'New Meeting',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration: 30,
      participants: [],
      isDONNAInvited: false
    }
    setMeetings([...meetings, newMeeting].sort((a, b) => 
      new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
    ))
    setShowAddMeeting(false)
    setSelectedMeeting(newMeeting)
    simulateSecretaryCommand(
      "add_meeting",
      "Calendar write skipped in preview — local placeholder event created.",
      "Create meeting — simulated calendar sync."
    )
  }

  const handleAddMeetingFromURL = () => {
    if (!meetingURL.trim()) return
    
    // Parse URL to extract meeting info (simplified - in real app would use calendar API)
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: 'Meeting from URL',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration: 30,
      participants: [],
      meetingUrl: meetingURL,
      isDONNAInvited: true
    }
    setMeetings([...meetings, newMeeting].sort((a, b) => 
      new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
    ))
    setMeetingURL("")
    setShowAddURL(false)
    setSelectedMeeting(newMeeting)
    simulateSecretaryCommand(
      "add_from_url",
      `Parsed meeting URL host; would attach conferencing metadata in production.`,
      "Import from URL — simulated join link enrichment."
    )
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date().toISOString()
    }
    
    setChatMessages([...chatMessages, userMessage])
    setChatInput("")
    simulateSecretaryCommand(
      "prep_chat_user",
      `Recorded your note for “${selectedMeeting?.title ?? "meeting"}” (demo transcript only).`,
      "Meeting prep chat — simulated capture."
    )
    
    // Simulate DONNA response
    setTimeout(() => {
      const donnaResponse = {
        id: (Date.now() + 1).toString(),
        role: 'donna' as const,
        content: "I've noted that. Let me help you prepare for this meeting. What specific aspects would you like to focus on?",
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, donnaResponse])
    }, 1000)
  }

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    const wasCompleted = task?.completed ?? false
    setTasks(tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ))
    simulateSecretaryCommand(
      "toggle_task",
      `Task “${task?.text ?? taskId}” ${wasCompleted ? "reopened" : "marked complete"} in preview.`,
      "Task update — simulated workspace sync."
    )
  }

  const handleAddTask = (text: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      priority: 'medium'
    }
    setTasks([...tasks, newTask])
    simulateSecretaryCommand(
      "add_task",
      `Created task “${text}” — would sync to task graph in production DONNA.`,
      "Task created — simulated PM integration."
    )
  }

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date().toISOString()
    }
    setNotes([newNote, ...notes])
    setNewNoteTitle("")
    setNewNoteContent("")
    setShowAddNote(false)
    simulateSecretaryCommand(
      "add_note",
      `Stored note “${newNote.title}” locally (no cloud persistence in preview).`,
      "Note saved — simulated knowledge base write."
    )
  }

  const nextMeeting = meetings.find(m => new Date(m.date + 'T' + m.time) >= new Date()) || meetings[0]
  const upcomingDeadlines = deadlines.filter(d => new Date(d.date) >= new Date()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="min-h-screen text-white p-6 glass-dark backdrop-blur" data-tour="secretary-content">
      <div className="max-w-[1800px] mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-light">Secretary</h1>
        </div>

        {/* Main 3-column layout */}
        <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
          {/* Left Column - Upcoming Meetings */}
          <div className="col-span-3 flex flex-col glass rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Upcoming Meetings</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddURL(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Add from URL"
                >
                  <LinkIcon className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={handleAddMeeting}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Add Meeting"
                >
                  <Plus className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Add URL Modal */}
            {showAddURL && (
              <div className="mb-4 glass-heavy rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Paste meeting URL..."
                    value={meetingURL}
                    onChange={(e) => setMeetingURL(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddMeetingFromURL()
                      } else if (e.key === 'Escape') {
                        setShowAddURL(false)
                        setMeetingURL("")
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowAddURL(false)
                      setMeetingURL("")
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <NeonButton
                  size="sm"
                  variant="glass"
                  onClick={handleAddMeetingFromURL}
                  className="w-full"
                >
                  Invite DONNA to Meeting
                </NeonButton>
              </div>
            )}

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {meetings
                .filter(m => new Date(m.date + 'T' + m.time) >= new Date())
                .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                .map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      if (meeting.prepNotes) {
                        setChatMessages([
                          {
                            id: '1',
                            role: 'donna',
                            content: `I've prepared some notes for "${meeting.title}". ${meeting.prepNotes}`,
                            timestamp: new Date().toISOString()
                          }
                        ])
                      } else {
                        setChatMessages([])
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedMeeting?.id === meeting.id
                        ? 'glass-heavy border border-blue-400/50 bg-blue-500/10'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-white flex-1">{meeting.title}</h3>
                      {meeting.isDONNAInvited && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          DONNA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{meeting.time}</span>
                    </div>
                    {meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                        <Users className="w-3 h-3" />
                        <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Middle Column - Meeting Prep */}
          <div className="col-span-6 flex flex-col glass rounded-xl p-4 overflow-hidden">
            {selectedMeeting ? (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-white mb-1">{selectedMeeting.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedMeeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedMeeting.time} ({selectedMeeting.duration} min)</span>
                    </div>
                    {selectedMeeting.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedMeeting.location}</span>
                      </div>
                    )}
                    {selectedMeeting.meetingUrl && (
                      <a
                        href={selectedMeeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join</span>
                      </a>
                    )}
                  </div>
                  {selectedMeeting.participants.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-white/60" />
                      <div className="flex flex-wrap gap-1">
                        {selectedMeeting.participants.map((p, i) => (
                          <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-white/40 py-8">
                      <p>Start a conversation to prepare for this meeting</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <ChatBubble key={message.id} variant={message.role}>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-white/90">{message.content}</p>
                          <span className="text-xs text-white/40">
                            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </ChatBubble>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <FuturisticInput
                    type="text"
                    placeholder="Add details, ask questions, shape the conversation..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChat()
                      }
                    }}
                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50"
                  />
                  <NeonButton
                    variant="glass"
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </NeonButton>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a meeting to start preparing</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Notes, Tasks, Deadlines */}
          <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            {/* Notes Section */}
            <GlassCard className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Notes
                </h3>
                <button
                  onClick={() => setShowAddNote(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Add Note"
                >
                  <Plus className="w-3 h-3 text-white/60" />
                </button>
              </div>

              {showAddNote && (
                <div className="mb-3 glass-heavy rounded-lg p-3 border border-white/20">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full mb-2 bg-white/5 border border-white/20 rounded px-2 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50"
                    autoFocus
                  />
                  <textarea
                    placeholder="Note content..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full mb-2 bg-white/5 border border-white/20 rounded px-2 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <NeonButton
                      size="sm"
                      variant="glass"
                      onClick={handleAddNote}
                      className="flex-1"
                    >
                      Save
                    </NeonButton>
                    <button
                      onClick={() => {
                        setShowAddNote(false)
                        setNewNoteTitle("")
                        setNewNoteContent("")
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm text-white/60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2">
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <h4 className="text-xs font-medium text-white mb-1">{note.title}</h4>
                    <p className="text-xs text-white/60 line-clamp-2">{note.content}</p>
                    <span className="text-xs text-white/40 mt-1 block">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Tasks Section */}
            <GlassCard className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-400" />
                  Tasks
                </h3>
                <button
                  onClick={() => {
                    const text = prompt("New task:")
                    if (text) handleAddTask(text)
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Add Task"
                >
                  <Plus className="w-3 h-3 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {tasks.filter(t => !t.completed).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/40" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs text-white ${task.completed ? 'line-through text-white/40' : ''}`}>
                        {task.text}
                      </p>
                      {task.dueDate && (
                        <span className="text-xs text-white/40 mt-1 block">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Deadlines Section */}
            <GlassCard className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  Deadlines
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {upcomingDeadlines.map((deadline) => (
                  <motion.div
                    key={deadline.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2 rounded-lg border ${
                      deadline.priority === 'high' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : deadline.priority === 'medium'
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <h4 className="text-xs font-medium text-white mb-1">{deadline.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(deadline.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {deadline.time && ` at ${deadline.time}`}
                      </span>
                    </div>
                    {deadline.relatedMeeting && (
                      <span className="text-xs text-blue-400 mt-1 block">
                        Related to: {meetings.find(m => m.id === deadline.relatedMeeting)?.title}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
