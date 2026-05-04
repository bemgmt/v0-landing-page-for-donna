"use client"

import { useState } from "react"
import { Wand2, Image, Video, Download, Copy, Loader2 } from "lucide-react"

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
  { label: "Short Video", type: "video", duration: 15, aspectRatio: "16:9", description: "15s promotional clip" },
  { label: "Social Video", type: "video", duration: 30, aspectRatio: "9:16", description: "30s vertical video" },
]

interface GeneratedAsset {
  id: string
  type: AssetType
  prompt: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  createdAt: string
}

export default function FlowStudio() {
  const [prompt, setPrompt] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<GeneratedAsset[]>([])

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
            placeholder="Describe the marketing asset you want to create... (DONNA brand guidelines are auto-applied)"
            className="mt-2 w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Brand colors, typography, and style guidelines are automatically prepended to your prompt.
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
              Generating...
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

      {/* Asset Gallery */}
      {assets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold">Generated Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted/50 flex items-center justify-center">
                  {asset.type === "image" ? (
                    asset.url ? (
                      <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-12 h-12 text-muted-foreground/20" />
                    )
                  ) : (
                    <Video className="w-12 h-12 text-muted-foreground/20" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{asset.prompt}</p>
                  <div className="flex gap-2">
                    {asset.url && (
                      <>
                        <a
                          href={asset.url}
                          download
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
        </div>
      )}
    </div>
  )
}
