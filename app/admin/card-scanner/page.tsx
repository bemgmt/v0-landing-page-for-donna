"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { CreditCard, ListChecks } from "lucide-react"
import { CardUpload, type ScanApiResult } from "@/components/card-scanner/card-upload"
import { CardPreviewForm } from "@/components/card-scanner/card-preview-form"
import { ShareLeadPanel } from "@/components/card-scanner/share-lead-panel"
import { EmailLeadButton } from "@/components/card-scanner/email-lead-button"
import type { BusinessCardExtraction } from "@/lib/card-scanner/card-scan-schema"

function cloneLead(lead: BusinessCardExtraction): BusinessCardExtraction {
  return { ...lead }
}

export default function CardScannerPage() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [scan, setScan] = useState<ScanApiResult | null>(null)
  const [lead, setLead] = useState<BusinessCardExtraction | null>(null)
  const [eventTag, setEventTag] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const onScanned = useCallback(
    (result: ScanApiResult, dataUrl: string) => {
      setScan(result)
      setImageDataUrl(dataUrl)
      setLead(cloneLead(result.extracted))
      setSavedLeadId(null)
      setShowShare(false)
      setEmailSent(false)
      toast.success("Card scanned — review and save")
    },
    []
  )

  const resetForNextScan = useCallback(() => {
    setScan(null)
    setLead(null)
    setImageDataUrl(null)
    setEventTag("")
    setNotes("")
    setSavedLeadId(null)
    setShowShare(false)
    setEmailSent(false)
  }, [])

  const onSave = async () => {
    if (!lead || !scan) return
    setSaving(true)
    try {
      const res = await fetch("/api/card-scanner/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          event_tag: eventTag || null,
          notes: notes || null,
          image: imageDataUrl,
        }),
        signal: AbortSignal.timeout(30_000),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          typeof json.error === "string" ? json.error : "Save failed"
        )
        return
      }
      const sent = json.email_sent === true
      setEmailSent(sent)
      if (sent) {
        toast.success("Lead saved and emailed to derek@aidonna.co")
      } else {
        toast.warning("Lead saved, but the workflow email needs to be retried")
      }
      const id = typeof json.id === "string" ? json.id : null
      if (id) {
        setSavedLeadId(id)
        setShowShare(true)
      }
    } catch (error) {
      toast.error(
        error instanceof DOMException && error.name === "TimeoutError"
          ? "Save timed out. Please try again."
          : "Network error",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="size-6 text-cyan-400" />
            <h1 className="text-2xl font-semibold gradient-text">
              Card Scanner
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Photograph a business card, review the extracted details, then save
            to your lead list. Share with team members and email to DONNA for
            CRM import.
          </p>
        </div>
        <Link
          href="/admin/card-scanner/leads"
          className="shrink-0 flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ListChecks className="size-4" />
          View all leads
        </Link>
      </div>

      {/* Upload zone */}
      <div className="rounded-xl border border-white/10 liquid-glass p-4 sm:p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Scan
        </h2>
        <CardUpload onScanned={onScanned} disabled={saving} />
      </div>

      {/* Card image preview */}
      {imageDataUrl && lead ? (
        <div className="rounded-xl border border-white/10 liquid-glass p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image preview */}
            <div className="lg:w-1/3 shrink-0">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Card Image
              </h2>
              <div className="rounded-lg overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Scanned business card"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Edit form */}
            <div className="flex-1">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Review &amp; Edit
              </h2>
              {!savedLeadId ? (
                <CardPreviewForm
                  value={lead}
                  onChange={setLead}
                  eventTag={eventTag}
                  onEventTagChange={setEventTag}
                  notes={notes}
                  onNotesChange={setNotes}
                  onSave={onSave}
                  saving={saving}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <p className="text-sm text-emerald-400 font-medium">
                      ✓ Lead saved successfully
                    </p>
                  </div>

                  {/* Email to CRM */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                      Email to CRM
                    </p>
                    {emailSent ? (
                      <p className="text-sm text-emerald-400">
                        Sent to derek@aidonna.co
                      </p>
                    ) : (
                      <EmailLeadButton leadId={savedLeadId} />
                    )}
                  </div>

                  {/* Scan another */}
                  <button
                    type="button"
                    onClick={resetForNextScan}
                    className="w-full h-10 rounded-lg border border-white/15 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                  >
                    Scan another card
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Share panel */}
      {showShare && savedLeadId ? (
        <ShareLeadPanel
          leadId={savedLeadId}
          onSkip={() => setShowShare(false)}
          onDone={() => setShowShare(false)}
        />
      ) : null}
    </div>
  )
}
