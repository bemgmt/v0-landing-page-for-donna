"use client"

import { useState, useEffect } from "react"
import { Wand2, Image, Video, Download, Copy, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react"

type AssetType = "image" | "video"
type Preset = {
  label: string
  type: AssetType
  dimensions?: string
  duration?: number
  aspectRatio?: string
  description: string
}

const PRESETS: Preset[] = [
  { label: "Social Post", type: "image", dimensions: "1080x1080", description: "Instagram/LinkedIn square" },
  { label: "Story / Reel Cover", type: "image", dimensions: "1080x1920", description: "Instagram/TikTok vertical" },
  { label: "Hero Banner", type: "image", dimensions: "1920x1080", description: "Website hero section" },
  { label: "OG Image", type: "image", dimensions: "1200x630", description: "Social share preview" },
  { label: "Short Video", type: "video", duration: 5, aspectRatio: "16:9", description: "5s promotional clip" },
  { label: "Social Video", type: "video", duration: 10, aspectRatio: "9:16", description: "10s vertical video" },
]

interface GeneratedAsset {
  id: string
  type: AssetType
  prompt: string
  optimizedPrompt?: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  createdAt: string
}

export default function FlowStudio() {
  const [prompt, setPrompt] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null)

  // Fetch existing history on mount
  useEffect(() => {
    let isMounted = true
    async function fetchHistory() {
      try {
        const res = await fetch("/api/flow/generate")
        if (!res.ok) throw new Error("Failed to fetch history")
        const json = await res.json()
        if (isMounted && json.assets) {
          setAssets(json.assets)
        }
      } catch (err) {
        console.error("History fetch failed:", err)
      } finally {
        if (isMounted) setLoadingHistory(false)
      }
    }
    void fetchHistory()
    return () => { isMounted = false }
  }, [])

  // Smart Background Poller: Periodically queries Cloud status for processing video generations
  useEffect(() => {
    const processingIds = assets
      .filter((a) => a.url === "processing" || (a.metadata as any)?.status === "processing")
      .map((a) => a.id)

    if (processingIds.length === 0) return

    const runSyncCheck = async () => {
      for (const id of processingIds) {
        try {
          const res = await fetch(`/api/flow/check-status?id=${id}`)
          const data = await res.json()
          
          if (res.ok && data.status !== "processing") {
            setAssets((prev) =>
              prev.map((asset) => {
                if (asset.id === id) {
                  if (data.status === "completed" && data.asset) {
                    return data.asset
                  } else if (data.status === "failed") {
                    return {
                      ...asset,
                      url: "failed",
                      metadata: { ...asset.metadata, status: "failed", error: data.error }
                    }
                  }
                }
                return asset
              })
            )
          }
        } catch (err) {
          console.error("[flow-studio] Polling error for job ID", id, err)
        }
      }
    }

    // Query backend once every 10s for current active sessions
    const pollInterval = setInterval(() => {
      void runSyncCheck()
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [assets])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/flow/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: selectedPreset.type,
          dimensions: selectedPreset.dimensions,
          duration: selectedPreset.duration,
          aspectRatio: selectedPreset.aspectRatio,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Generation failed")
      if (json.asset) {
        setAssets((prev) => [json.asset, ...prev])
        setPrompt("") // clear prompt on success
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = (url: string) => {
    void navigator.clipboard.writeText(url)
  }

  const toggleExpandAsset = (id: string) => {
    setExpandedAssetId(expandedAssetId === id ? null : id)
  }

  return (
    <div className="space-y-8">
      {/* Generator */}
      <div className="rounded-2xl border border-border bg-background shadow-xl p-6 space-y-5">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-accent" />
          Generate Marketing Collateral
        </h3>

        {/* Preset Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setSelectedPreset(preset)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedPreset.label === preset.label
                  ? "border-accent bg-accent/10 shadow-sm"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {preset.type === "image" ? (
                  <Image className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Video className="w-3.5 h-3.5 text-accent" />
                )}
                <p className="text-xs font-bold">{preset.label}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{preset.description}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                {preset.dimensions ?? `${preset.duration}s ${preset.aspectRatio}`}
              </p>
            </button>
          ))}
        </div>

        {/* Prompt */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the marketing asset you want to create... (e.g. 'Infographic showing system scalability')"
            className="mt-2 w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Project ClearCopy automatically reads <strong>brand_rules.md</strong> to apply your palette and ensure legible text overlay rendering.
          </p>
        </div>

        <button
          onClick={() => void handleGenerate()}
          disabled={loading || !prompt.trim()}
          className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Planning & Executing Agent Loop...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate {selectedPreset.type === "video" ? "Video" : "Image"}
            </>
          )}
        </button>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Asset Gallery / History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            Asset History
            {loadingHistory && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </h3>
        </div>

        {loadingHistory && assets.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-2xl border border-border bg-muted/20 animate-pulse flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <Image className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-xs font-medium text-muted-foreground">No generated assets yet.</p>
            <p className="text-[10px] text-muted-foreground/75">Create your first collateral item above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="aspect-square bg-muted/50 flex items-center justify-center relative group overflow-hidden">
                  {asset.url === "processing" || (asset.metadata as any)?.status === "processing" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 space-y-3 p-4 text-center">
                      <div className="relative flex items-center justify-center">
                        <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                        <Video className="w-5 h-5 text-accent absolute animate-pulse" />
                      </div>
                      <div className="space-y-1 animate-pulse">
                        <p className="text-[11px] font-bold text-foreground tracking-wide">Rendering Video...</p>
                        <p className="text-[9px] text-muted-foreground max-w-[85%] mx-auto leading-relaxed">
                          Cloud generation running in the background (Est. 2-5 mins). Safe to browse away.
                        </p>
                      </div>
                    </div>
                  ) : asset.url === "failed" || (asset.metadata as any)?.status === "failed" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/5 space-y-2 p-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-destructive">Rendering FAILED</p>
                        <p className="text-[9px] text-muted-foreground max-w-[85%] mx-auto leading-tight line-clamp-2">
                          {String((asset.metadata as any)?.error || "Internal Vertex capacity error.")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {asset.type === "image" ? (
                        <img
                          src={asset.url}
                          alt={asset.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <video src={asset.url} controls className="w-full h-full object-cover" />
                      )}
                    </>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-background/40 backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase text-accent tracking-wider">
                        {asset.type}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-mono">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">"{asset.prompt}"</p>

                    {/* Logic Chain Disclosure */}
                    {asset.optimizedPrompt && (
                      <div className="mt-2 rounded-lg border border-border/40 bg-muted/10 overflow-hidden">
                        <button
                          onClick={() => toggleExpandAsset(asset.id)}
                          className="w-full flex items-center justify-between p-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/30 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <Info className="w-2.5 h-2.5 text-accent" />
                            Logic Chain (Architect)
                          </span>
                          {expandedAssetId === asset.id ? (
                            <ChevronUp className="w-2.5 h-2.5" />
                          ) : (
                            <ChevronDown className="w-2.5 h-2.5" />
                          )}
                        </button>
                        {expandedAssetId === asset.id && (
                          <div className="p-2 border-t border-border/30 text-[10px] text-muted-foreground bg-muted/5 italic leading-relaxed animate-in slide-in-from-top-1 duration-200">
                            {asset.optimizedPrompt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    {asset.url && asset.url !== "processing" && asset.url !== "failed" && (
                      <>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-[10px] font-bold text-center py-1.5 rounded-lg bg-muted border border-border hover:bg-accent/10 transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                        <button
                          onClick={() => copyUrl(asset.url)}
                          className="flex-1 text-[10px] font-bold text-center py-1.5 rounded-lg bg-muted border border-border hover:bg-accent/10 transition-colors flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy URL
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

