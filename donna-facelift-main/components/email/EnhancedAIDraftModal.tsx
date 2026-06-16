"use client"

import { useState, useEffect } from "react"
import { Bot, RefreshCw, Copy, Send, Sparkles, Target, MessageSquare, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { AIReplyOptions, EnhancedMessage } from "@/types/email"

interface EnhancedAIDraftModalProps {
  isOpen: boolean
  onClose: () => void
  onDraftGenerated: (draft: string) => void
  message?: EnhancedMessage
  templates?: Array<{ id: string; name: string; template_type: string }>
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' }
] as const

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short', description: '2-3 sentences', estimate: '~50 words' },
  { value: 'medium', label: 'Medium', description: '1-2 paragraphs', estimate: '~150 words' },
  { value: 'long', label: 'Long', description: '3-4 paragraphs', estimate: '~300 words' }
] as const

const CTA_OPTIONS = [
  { value: 'meeting', label: 'Schedule Meeting', description: 'Invite to schedule a meeting' },
  { value: 'call', label: 'Phone Call', description: 'Request a phone or video call' },
  { value: 'demo', label: 'Product Demo', description: 'Offer a product demonstration' },
  { value: 'custom', label: 'Custom CTA', description: 'Custom call-to-action' }
] as const

const MARKETING_GOALS = [
  'Generate leads and prospects',
  'Schedule product demonstrations',
  'Follow up on previous conversations',
  'Nurture existing relationships',
  'Close pending deals',
  'Provide customer support',
  'Share valuable resources',
  'Request testimonials or reviews'
]

export function EnhancedAIDraftModal({
  isOpen,
  onClose,
  onDraftGenerated,
  message,
  templates = []
}: EnhancedAIDraftModalProps) {
  const [options, setOptions] = useState<AIReplyOptions>({
    tone: 'professional',
    length: 'medium',
    include_cta: false,
    cta_type: 'meeting'
  })
  
  const [goal, setGoal] = useState('')
  const [marketingGoal, setMarketingGoal] = useState('')
  const [customCTA, setCustomCTA] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDraft, setGeneratedDraft] = useState('')
  const [draftHistory, setDraftHistory] = useState<string[]>([])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOptions({
        tone: 'professional',
        length: 'medium',
        include_cta: false,
        cta_type: 'meeting'
      })
      setGoal('')
      setMarketingGoal('')
      setCustomCTA('')
      setSelectedTemplate('')
      setGeneratedDraft('')
      setDraftHistory([])
    }
  }, [isOpen])

  const handleGenerateDraft = async () => {
    if (!goal.trim()) {
      toast({
        title: "Goal Required",
        description: "Please specify your goal for this reply.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const requestBody = {
        message,
        goal: goal.trim(),
        ...options,
        marketing_goal: marketingGoal.trim() || undefined,
        template_id: selectedTemplate || undefined
      }

      const response = await fetch('/api/gmail/draft-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Failed to generate draft: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.draft) {
        setGeneratedDraft(data.draft)
        setDraftHistory(prev => [data.draft, ...prev.slice(0, 4)]) // Keep last 5 drafts
        
        toast({
          title: "Draft Generated",
          description: "AI has generated your email draft successfully."
        })
      } else {
        throw new Error(data.error || 'Failed to generate draft')
      }
    } catch (error) {
      console.error('Draft generation error:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate draft",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseDraft = () => {
    if (generatedDraft) {
      onDraftGenerated(generatedDraft)
      onClose()
    }
  }

  const handleCopyDraft = async () => {
    if (generatedDraft) {
      try {
        await navigator.clipboard.writeText(generatedDraft)
        toast({
          title: "Copied",
          description: "Draft copied to clipboard."
        })
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy draft to clipboard.",
          variant: "destructive"
        })
      }
    }
  }

  const handleRegenerateDraft = () => {
    handleGenerateDraft()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Enhanced AI Draft Assistant
          </DialogTitle>
          <DialogDescription>
            Generate intelligent email replies with advanced customization options.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Options</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Goal Input */}
                <div>
                  <Label htmlFor="goal" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Reply Goal *
                  </Label>
                  <Textarea
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Schedule a follow-up meeting to discuss their requirements"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Tone Selection */}
                <div>
                  <Label>Tone</Label>
                  <Select
                    value={options.tone}
                    onValueChange={(value: 'professional' | 'friendly' | 'casual') => setOptions(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div>
                            <div className="font-medium">{tone.label}</div>
                            <div className="text-xs text-muted-foreground">{tone.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Length Selection */}
                <div>
                  <Label>Response Length</Label>
                  <Select
                    value={options.length}
                    onValueChange={(value: 'short' | 'medium' | 'long') => setOptions(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map((length) => (
                        <SelectItem key={length.value} value={length.value}>
                          <div>
                            <div className="font-medium">{length.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {length.description} • {length.estimate}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Call-to-Action */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-cta"
                      checked={options.include_cta}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, include_cta: checked }))
                      }
                    />
                    <Label htmlFor="include-cta">Include Call-to-Action</Label>
                  </div>

                  {options.include_cta && (
                    <div className="space-y-2">
                      <Select
                        value={options.cta_type}
                        onValueChange={(value: 'meeting' | 'call' | 'demo' | 'custom') => setOptions(prev => ({ ...prev, cta_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CTA_OPTIONS.map((cta) => (
                            <SelectItem key={cta.value} value={cta.value}>
                              <div>
                                <div className="font-medium">{cta.label}</div>
                                <div className="text-xs text-muted-foreground">{cta.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {options.cta_type === 'custom' && (
                        <Input
                          value={customCTA}
                          onChange={(e) => setCustomCTA(e.target.value)}
                          placeholder="Enter your custom call-to-action"
                        />
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* Marketing Goal */}
                <div>
                  <Label htmlFor="marketing-goal" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Marketing Objective
                  </Label>
                  <Select
                    value={marketingGoal}
                    onValueChange={setMarketingGoal}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select marketing objective (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETING_GOALS.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Selection */}
                {templates.length > 0 && (
                  <div>
                    <Label htmlFor="template" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Base Template
                    </Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select template (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {template.template_type}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateDraft}
              disabled={isGenerating || !goal.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate Draft
                </>
              )}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Generated Draft
              </Label>
              {generatedDraft && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDraft}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateDraft}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-64 w-full border rounded-md p-4">
              {generatedDraft ? (
                <div className="whitespace-pre-wrap text-sm">
                  {generatedDraft}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Your AI-generated draft will appear here</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Draft History */}
            {draftHistory.length > 1 && (
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Previous Drafts
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {draftHistory.slice(1).map((draft, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded text-xs cursor-pointer hover:bg-muted"
                      onClick={() => setGeneratedDraft(draft)}
                    >
                      {draft.substring(0, 100)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUseDraft}
            disabled={!generatedDraft}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Use This Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
