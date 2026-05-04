import "server-only"
import { getFlowToken } from "@/lib/google/oauth"

export type AssetType = "image" | "video"

export interface GenerateOptions {
  prompt: string
  type: AssetType
  dimensions?: string
  duration?: number
  aspectRatio?: string
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

const BRAND_PREFIX = `Brand: DONNA — AI Operational Infrastructure for SMBs.
Color palette: deep navy (#0a1628), cyan accents (#00d4ff), clean whites.
Style: Premium, calm, professional, infrastructure-grade. No robots, no cartoon AI characters.
Typography: Modern geometric sans-serif.`

export async function generateVertexAsset(
  options: GenerateOptions
): Promise<{ bytesBase64Encoded: string; mimeType: string }> {
  const token = await getFlowToken()
  const projectId = process.env.GOOGLE_FLOW_PROJECT_ID

  if (!projectId) {
    throw new Error("Missing GOOGLE_FLOW_PROJECT_ID")
  }

  const brandedPrompt = `${BRAND_PREFIX}\n\n${options.prompt}`
  const isVideo = options.type === "video"
  
  const modelId = isVideo ? "veo-2.0-generate-001" : "imagen-3.0-generate-001"
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:predict`

  const requestBody: any = {
    instances: [
      { prompt: brandedPrompt }
    ],
    parameters: {
      sampleCount: 1,
    }
  }

  if (isVideo) {
    requestBody.parameters.aspectRatio = options.aspectRatio ?? "16:9"
  } else {
    const ratioMap: Record<string, string> = {
      "1080x1080": "1:1",
      "1080x1920": "9:16",
      "1920x1080": "16:9",
      "1200x630": "16:9"
    }
    requestBody.parameters.aspectRatio = ratioMap[options.dimensions ?? "1080x1080"] ?? "1:1"
    requestBody.parameters.outputOptions = { mimeType: "image/jpeg" }
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
    throw new Error(`Vertex AI generation failed: ${res.status} ${body}`)
  }

  const json = await res.json()

  const prediction = json.predictions?.[0]
  if (!prediction || (!prediction.bytesBase64Encoded && !prediction.videoBase64Encoded)) {
    throw new Error("Unexpected Vertex AI response format")
  }

  return {
    bytesBase64Encoded: prediction.bytesBase64Encoded || prediction.videoBase64Encoded,
    mimeType: prediction.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg")
  }
}
