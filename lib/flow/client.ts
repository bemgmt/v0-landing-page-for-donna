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
 * Execute Step: High-efficiency generation
 */
async function runRawGeneration(
  prompt: string,
  options: GenerateOptions,
  projectId: string,
  token: string
): Promise<{ bytesBase64Encoded: string; mimeType: string }> {
  const isVideo = options.type === "video"
  const modelId = isVideo ? "veo-2.0-generate-001" : "imagen-3.0-generate-001"
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:predict`

  const requestBody: any = {
    instances: [{ prompt }],
    parameters: { sampleCount: 1 }
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

/**
 * Main Generation Endpoint implementing the "Plan-Execute-Verify" loop
 */
export async function generateVertexAsset(
  options: GenerateOptions
): Promise<{ bytesBase64Encoded: string; mimeType: string; optimizedPrompt: string }> {
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
  console.log("[ClearCopy] Executing generation...")
  let result = await runRawGeneration(optimizedPrompt, options, projectId, token)

  // Step 3: Verification Phase (Vision Agent)
  if (options.type === "image") {
    console.log("[ClearCopy] Verifying generation output for clear copy...")
    const verification = await verifyAsset(result.bytesBase64Encoded, options.prompt, projectId, token)
    
    if (!verification.passed) {
      console.warn(`[ClearCopy] Vision Check FAILED: ${verification.feedback}. Initiating 1x Re-roll...`)
      
      // Planning Re-roll: Simpler prompt
      optimizedPrompt = await planPrompt(options.prompt, projectId, token, brandRules, rulesJson, true)
      console.log(`[ClearCopy] Re-roll Optimized Prompt: ${optimizedPrompt}`)
      
      // Re-Execute
      result = await runRawGeneration(optimizedPrompt, options, projectId, token)
      console.log("[ClearCopy] Re-roll execution completed.")
    } else {
      console.log("[ClearCopy] Vision Check PASSED.")
    }
  } else {
    console.log("[ClearCopy] Asset type is Video. Bypassing Vision verification loop.")
  }

  return {
    bytesBase64Encoded: result.bytesBase64Encoded,
    mimeType: result.mimeType,
    optimizedPrompt
  }
}

