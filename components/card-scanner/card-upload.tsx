"use client"

import { useRef, useState } from "react"
import { Camera, ImagePlus, Loader2 } from "lucide-react"
import type { BusinessCardExtraction } from "@/lib/card-scanner/card-scan-schema"

export type ScanApiResult = {
  extracted: BusinessCardExtraction
}

type CardUploadProps = {
  onScanned: (result: ScanApiResult, imageDataUrl: string) => void
  disabled?: boolean
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error("Could not read file"))
    r.readAsDataURL(file)
  })
}

export function CardUpload({ onScanned, disabled }: CardUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runScan = async (file: File) => {
    setError(null)
    setLoading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const res = await fetch("/api/card-scanner/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const reqId = res.headers.get("x-request-id")
        const errMsg =
          typeof json.error === "string" ? json.error : JSON.stringify(json)
        console.error(
          `[card-scanner client] ${JSON.stringify({ status: res.status, requestId: reqId, error: errMsg })}`
        )
        setError(typeof json.error === "string" ? json.error : "Scan failed")
        return
      }
      onScanned(json as ScanApiResult, dataUrl)
    } catch {
      setError("Network error — please check your connection and try again")
    } finally {
      setLoading(false)
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void runScan(file)
  }

  return (
    <div className="space-y-4">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        capture="environment"
        className="sr-only"
        onChange={onChange}
        disabled={disabled || loading}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="sr-only"
        onChange={onChange}
        disabled={disabled || loading}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          className="flex-1 h-14 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-medium flex items-center justify-center gap-2 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || loading}
          onClick={() => cameraInputRef.current?.click()}
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Camera className="size-5" />
              Take photo
            </>
          )}
        </button>
        <button
          type="button"
          className="flex-1 h-14 rounded-xl border border-white/15 bg-white/5 text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/25 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || loading}
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImagePlus className="size-5" />
          From gallery
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        JPEG or PNG, up to 10MB. Well-lit, flat cards work best.
      </p>
    </div>
  )
}
