import "server-only"

import { getFlowToken } from "@/lib/google/oauth"

const FLOW_API_BASE = "https://flow.googleapis.com/v1"

export type AssetType = "image" | "video"

export interface GenerateOptions {
  prompt: string
  type: AssetType
  /** Image dimensions (e.g., "1080x1080") */
  dimensions?: string
  /** Video duration in seconds */
  duration?: number
  /** Aspect ratio for video (e.g., "16:9") */
  aspectRatio?: string
  /** Style preset */
  style?: string
}

export interface GeneratedAsset {
  id: string
  type: AssetType
  prompt: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  createdAt: string
  metadata: Record<string, unknown>
}

/**
 * DONNA brand prompt prefix — ensures generated assets stay on-brand.
 */
const BRAND_PREFIX = `Brand: DONNA — AI Operational Infrastructure for SMBs.
Color palette: deep navy (#0a1628), cyan accents (#00d4ff), clean whites.
Style: Premium, calm, professional, infrastructure-grade. No robots, no cartoon AI characters.
Typography: Modern geometric sans-serif.`

/**
 * Generate an image or video asset via Google Flow.
 */
export async function generateAsset(options: GenerateOptions): Promise<GeneratedAsset> {
  const token = await getFlowToken()

  const brandedPrompt = `${BRAND_PREFIX}\n\n${options.prompt}`

  const requestBody: Record<string, unknown> = {
    prompt: brandedPrompt,
  }

  let endpoint: string

  if (options.type === "video") {
    endpoint = `${FLOW_API_BASE}/videos:generate`
    requestBody.videoConfig = {
      duration: options.duration ?? 15,
      aspectRatio: options.aspectRatio ?? "16:9",
    }
  } else {
    endpoint = `${FLOW_API_BASE}/images:generate`
    requestBody.imageConfig = {
      dimensions: options.dimensions ?? "1080x1080",
      style: options.style ?? "photorealistic",
    }
  }

  const workspaceId = process.env.GOOGLE_FLOW_WORKSPACE_ID
  if (workspaceId) {
    requestBody.workspaceId = workspaceId
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Flow generation failed: ${res.status} ${body}`)
  }

  const json = (await res.json()) as {
    name?: string
    result?: {
      id: string
      uri: string
      thumbnailUri?: string
      mimeType: string
    }
  }

  return {
    id: json.result?.id ?? crypto.randomUUID(),
    type: options.type,
    prompt: options.prompt,
    url: json.result?.uri ?? "",
    thumbnailUrl: json.result?.thumbnailUri,
    mimeType: json.result?.mimeType ?? (options.type === "video" ? "video/mp4" : "image/png"),
    createdAt: new Date().toISOString(),
    metadata: { dimensions: options.dimensions, duration: options.duration },
  }
}

/**
 * List assets in the Flow workspace.
 */
export async function listWorkspaceAssets(): Promise<GeneratedAsset[]> {
  const workspaceId = process.env.GOOGLE_FLOW_WORKSPACE_ID
  if (!workspaceId) return []

  const token = await getFlowToken()

  const res = await fetch(`${FLOW_API_BASE}/workspaces/${workspaceId}/assets`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return []

  const json = (await res.json()) as { assets?: GeneratedAsset[] }
  return json.assets ?? []
}
