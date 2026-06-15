import { Buffer } from "node:buffer"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import {
  businessCardExtractionSchema,
  type BusinessCardExtraction,
} from "@/lib/card-scanner/card-scan-schema"

export { businessCardExtractionSchema, type BusinessCardExtraction }

/** Vision-capable model; override with CARD_SCAN_OPENAI_MODEL env var. */
export const CARD_SCAN_MODEL =
  process.env.CARD_SCAN_OPENAI_MODEL ?? "gpt-4o-mini"

const EXTRACTION_SYSTEM = `You extract structured contact information from business card images.
Rules:
- Output exactly these fields: full_name, company, job_title, phone, email, website. Use "" when missing or illegible.
- If multiple phones or emails appear, choose the one most likely to reach the named person directly; avoid generic company inboxes (info@, sales@, contact@) when a personal email exists.
- Preserve extensions and country codes for phone when visible.
- For website, use a single URL string when clearly shown; do not guess https:// if unclear.
- For job_title, extract the person's role or position (e.g. "CEO", "Marketing Director").
- Do not invent names, emails, URLs, or phone numbers.`

/**
 * Parse an image payload string into its components.
 * Accepts both raw base64 and data URL formats.
 */
export function parseImagePayload(image: string): {
  rawBase64: string
  mimeType: string
} {
  const m = image.match(/^data:([^;]+);base64,(.+)$/s)
  if (m) {
    return { rawBase64: m[2].replace(/\s/g, ""), mimeType: m[1] }
  }
  return { rawBase64: image.replace(/\s/g, ""), mimeType: "image/jpeg" }
}

/**
 * Extract business card fields from an image using OpenAI GPT-4o-mini vision.
 * Single-step extraction: the vision model reads the card image directly.
 */
export async function extractBusinessCard(
  imageBase64: string,
  mimeType: string,
  requestId?: string
): Promise<BusinessCardExtraction> {
  const buf = Buffer.from(imageBase64, "base64")

  console.info(
    "[card-scanner]",
    JSON.stringify({
      requestId: requestId ?? null,
      phase: "extract_start",
      model: CARD_SCAN_MODEL,
      imageBytes: buf.length,
    })
  )

  const { object } = await generateObject({
    model: openai(CARD_SCAN_MODEL),
    maxRetries: 2,
    schema: businessCardExtractionSchema,
    schemaName: "BusinessCard",
    schemaDescription:
      "Name, company, job title, phone, email, website from a business card image",
    system: EXTRACTION_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "The image is a business card. Extract the six fields from it.",
          },
          { type: "image", image: buf, mimeType },
        ],
      },
    ],
  })

  console.info(
    "[card-scanner]",
    JSON.stringify({
      requestId: requestId ?? null,
      phase: "extract_done",
      name: object.full_name,
      company: object.company,
    })
  )

  return object
}
