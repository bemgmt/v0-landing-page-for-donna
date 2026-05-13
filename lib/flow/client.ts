import "server-only"
import fs from "node:fs/promises"
import path from "node:path"
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

// Fallbacks if file loading fails
const FALLBACK_BRAND_RULES = `Brand: DONNA — AI Operational Infrastructure for SMBs.
Color palette: deep navy (#0a1628), cyan accents (#00d4ff), clean whites.
Style: Premium, calm, professional, infrastructure-grade. No robots, no cartoon AI characters.
Typography: Modern geometric sans-serif.`

const FALLBACK_ANTIGRAVITY_RULES = {
  agent_rules: {
    image_gen: {
      mandatory_prefix: "RENDER TEXT CLEARLY:",
      text_enforcement: "Always wrap literal overlay copy in triple quotes: '''COPY HERE''' to isolate it.",
    }
  }
}

/**
 * Helper to load brand knowledge artifacts safely.
 */
async function loadBrandContext(): Promise<{ brandRules: string; rulesJson: any }> {
  try {
    const cwd = process.cwd()
    const brandRulesPath = path.join(cwd, "brand_rules.md")
    const antiPath = path.join(cwd, "antigravity.json")

    const [brandRules, antiContent] = await Promise.all([
      fs.readFile(brandRulesPath, "utf-8").catch(() => FALLBACK_BRAND_RULES),
      fs.readFile(antiPath, "utf-8").catch(() => JSON.stringify(FALLBACK_ANTIGRAVITY_RULES))
    ])

    let rulesJson = FALLBACK_ANTIGRAVITY_RULES
    try {
      rulesJson = JSON.parse(antiContent)
    } catch {}

    return { brandRules, rulesJson }
  } catch {
    return { brandRules: FALLBACK_BRAND_RULES, rulesJson: FALLBACK_ANTIGRAVITY_RULES }
  }
}

/**
 * Plan Step: The Architect Agent
 * Uses Gemini to create an optimized prompt based on rules and brand rules.
 */
async function planPrompt(
  rawPrompt: string,
  projectId: string,
  token: string,
  brandRules: string,
  rulesJson: any,
  simplificationPrompt: boolean = false
): Promise<string> {
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:generateContent`
  
  const mandatoryPrefix = rulesJson?.agent_rules?.image_gen?.mandatory_prefix ?? "RENDER TEXT CLEARLY:"
  const textEnforcement = rulesJson?.agent_rules?.image_gen?.text_enforcement ?? "Wrap copy in triple quotes."
  
  const baseContext = `You are the Architect Agent for Project ClearCopy. Your job is to take a user's raw request and rewrite it into an optimized prompt for Imagen 3.
RULES FOR GENERATION:
1. Apply these brand guidelines: ${brandRules}
2. You MUST start the prompt with "${mandatoryPrefix}".
3. Ensure any textual copy to overlay is handled correctly: ${textEnforcement}.
4. Focus on legibility, premium layout, and contrast.`

  const instruct = simplificationPrompt
    ? `${baseContext}\n\nATTENTION: The previous attempt had gibberish or unreadable text. Simplify this prompt by 20%. Reduce visual noise, increase contrast around text elements, and focus ONLY on rendering the core text perfectly. Return JUST the final refined string.`
    : `${baseContext}\n\nReturn JUST the final refined prompt string. No introductory or conversational text.`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `User raw request: "${rawPrompt}"` }] }],
      systemInstruction: {
        role: "system",
        parts: [{ text: instruct }]
      },
      generationConfig: { temperature: 0.3 }
    })
  })

  if (!res.ok) return `${mandatoryPrefix} ${rawPrompt}`
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? rawPrompt
}

/**
 * Verify Step: The Vision Agent
 * Uses Multimodal Gemini to inspect the image and check for gibberish text.
 */
async function verifyAsset(
  base64Image: string,
  originalPrompt: string,
  projectId: string,
  token: string
): Promise<{ passed: boolean; feedback: string }> {
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:generateContent`

  const instruct = `You are the Vision Verification Agent. Inspect this generated marketing image.
Check if any visible text overlays look like gibberish, have broken fonts, or are badly misspelled compared to the intended copy.
The user wanted to generate an image related to: "${originalPrompt}".
If the text is readable and looks professional, respond with: "PASSED".
If the text is garbled, misspelled, or unreadable noise, respond with: "FAILED" followed by a brief 1-sentence explanation why.
Return only that verdict.`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: instruct },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    })
  })

  if (!res.ok) return { passed: true, feedback: "Skipped: Vision API unavailable" }
  const data = await res.json()
  const verdict = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "PASSED"
  
  const passed = verdict.toUpperCase().startsWith("PASSED")
  return { passed, feedback: verdict }
}

/**
 * Helper to download external URLs to base64 (if returned by Vertex instead of inline base64)
 */
async function downloadUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch external media from ${url}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer).toString("base64")
}

export type GenerationResult = 
  | { status: "sync"; bytesBase64Encoded: string; mimeType: string; optimizedPrompt: string }
  | { status: "async"; operationName: string; optimizedPrompt: string }

/**
 * Main Generation Endpoint implementing the "Plan-Execute-Verify" loop.
 * For videos, dispatches instantly and returns background tracking context.
 */
export async function generateVertexAsset(
  options: GenerateOptions
): Promise<GenerationResult> {
  const token = await getFlowToken()
  const projectId = process.env.GOOGLE_FLOW_PROJECT_ID

  if (!projectId) {
    throw new Error("Missing GOOGLE_FLOW_PROJECT_ID")
  }

  // Step 0: Load contexts
  const { brandRules, rulesJson } = await loadBrandContext()

  // Step 1: Planning Phase (Architect Agent)
  console.log("[ClearCopy] Planning prompt optimized for brand and clear text...")
  let optimizedPrompt = await planPrompt(options.prompt, projectId, token, brandRules, rulesJson)
  console.log(`[ClearCopy] Optimized Prompt: ${optimizedPrompt}`)

  // Step 2: Execution Phase
  const isVideo = options.type === "video"
  const modelId = isVideo ? "veo-2.0-generate-001" : "imagen-3.0-generate-001"
  
  const apiAction = isVideo ? "predictLongRunning" : "predict"
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:${apiAction}`

  const requestBody: any = {
    instances: [{ prompt: optimizedPrompt }],
    parameters: { sampleCount: 1 }
  }

  if (isVideo) {
    requestBody.parameters.aspectRatio = options.aspectRatio ?? "16:9"
    requestBody.parameters.durationSeconds = Math.min(options.duration ?? 5, 15)
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

  console.log(`[ClearCopy] Dispatching ${options.type} to Vertex AI...`)
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
    throw new Error(`Vertex AI initial dispatch failed: ${res.status} ${body}`)
  }

  const json = await res.json()

  // ------------------------------------------------------------------
  // ASYNC BRANCH: VIDEOS DISPATCH IMMEDIATELY FOR BACKGROUND RUNNING
  // ------------------------------------------------------------------
  if (isVideo) {
    const operationName = json.name
    if (!operationName) {
      throw new Error("Veo dispatch succeeded but returned no Tracking Operation Name.")
    }
    console.log(`[ClearCopy] Veo LRO initiated. Operation Tracking ID: ${operationName}`)
    return {
      status: "async",
      operationName,
      optimizedPrompt
    }
  }

  // ------------------------------------------------------------------
  // SYNC BRANCH: IMAGES PROCESS INLINE WITH INTELLIGENT 1X RETRY
  // ------------------------------------------------------------------
  let prediction = json.predictions?.[0]
  if (!prediction || (!prediction.bytesBase64Encoded && !prediction.videoBase64Encoded)) {
    throw new Error("Unexpected image generation response structure.")
  }

  let finalBytes = prediction.bytesBase64Encoded || prediction.videoBase64Encoded
  let finalMime = prediction.mimeType ?? "image/jpeg"

  // Step 3: Verification Phase (Vision Agent)
  console.log("[ClearCopy] Verifying generation output for clear copy...")
  const verification = await verifyAsset(finalBytes, options.prompt, projectId, token)
  
  if (!verification.passed) {
    console.warn(`[ClearCopy] Vision Check FAILED: ${verification.feedback}. Initiating 1x Re-roll...`)
    
    // Re-Plan
    optimizedPrompt = await planPrompt(options.prompt, projectId, token, brandRules, rulesJson, true)
    console.log(`[ClearCopy] Re-roll Optimized Prompt: ${optimizedPrompt}`)
    
    // Re-Execute
    requestBody.instances[0].prompt = optimizedPrompt
    const retryRes = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    if (!retryRes.ok) throw new Error("Re-roll execution failed.")
    
    const retryJson = await retryRes.json()
    const retryPred = retryJson.predictions?.[0]
    if (!retryPred) throw new Error("Re-roll response empty.")
    
    finalBytes = retryPred.bytesBase64Encoded || retryPred.videoBase64Encoded
    finalMime = retryPred.mimeType ?? "image/jpeg"
    console.log("[ClearCopy] Re-roll completed successfully.")
  } else {
    console.log("[ClearCopy] Vision Check PASSED.")
  }

  return {
    status: "sync",
    bytesBase64Encoded: finalBytes,
    mimeType: finalMime,
    optimizedPrompt
  }
}

/**
 * Polling handler called by client status tickers to resolve background tasks.
 */
export async function checkVertexOperation(
  operationName: string
): Promise<{ done: boolean; bytesBase64Encoded?: string; mimeType?: string; error?: string }> {
  const token = await getFlowToken()
  
  const pollRes = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/${operationName}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!pollRes.ok) {
    throw new Error(`Failed to query operation status: ${pollRes.status}`)
  }

  const op = await pollRes.json()
  if (op.error) {
    return { done: true, error: op.error.message || JSON.stringify(op.error) }
  }

  if (!op.done) {
    return { done: false }
  }

  const lroResponse = op.response
  if (!lroResponse) {
    throw new Error("Finished but returned empty response body.")
  }

  const prediction = lroResponse.predictions?.[0] || lroResponse.generatedSamples?.[0] || lroResponse
  if (!prediction) {
    throw new Error("Could not map output prediction structure.")
  }

  let base64Data = 
    prediction.videoBase64Encoded || 
    prediction.bytesBase64Encoded || 
    prediction.video?.bytesBase64Encoded ||
    prediction.video?.videoBase64Encoded

  const mimeType = prediction.mimeType || prediction.video?.mimeType || "video/mp4"

  if (!base64Data) {
    const externalUrl = prediction.uri || prediction.url || prediction.video?.uri || prediction.video?.url
    if (externalUrl && externalUrl.startsWith("http")) {
      console.log(`[ClearCopy] Downloading background video output binary: ${externalUrl}`)
      base64Data = await downloadUrlToBase64(externalUrl)
    } else {
      throw new Error(`Unable to extract payload in op resolution: ${JSON.stringify(prediction)}`)
    }
  }

  return {
    done: true,
    bytesBase64Encoded: base64Data,
    mimeType
  }
}


