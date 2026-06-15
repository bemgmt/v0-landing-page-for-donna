import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { mapCardScanAiError } from "@/lib/card-scanner/card-scan-errors"
import {
  extractBusinessCard,
  parseImagePayload,
} from "@/lib/card-scanner/extract-card"

export const maxDuration = 120

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/png"])

function estimateDecodedBytes(image: string): number {
  const raw = image.includes(",") ? (image.split(",", 2)[1] ?? "") : image
  return Math.floor((raw.replace(/\s/g, "").length * 3) / 4)
}

function scanJson(
  body: unknown,
  requestId: string,
  init: { status?: number } = {}
): NextResponse {
  return NextResponse.json(body, {
    status: init.status,
    headers: { "X-Request-Id": requestId },
  })
}

export async function POST(request: Request) {
  const requestId = randomUUID()

  try {
    const body = await request.json()
    const image = typeof body.image === "string" ? body.image : ""

    console.info(
      "[card-scanner scan]",
      JSON.stringify({
        requestId,
        phase: "parsed",
        hasImageField: typeof body.image === "string",
        imageChars: typeof body.image === "string" ? body.image.length : 0,
      })
    )

    if (!image) {
      return scanJson({ error: "image is required" }, requestId, {
        status: 400,
      })
    }

    const { rawBase64, mimeType } = parseImagePayload(image)
    const normalizedMime = mimeType.replace("image/jpg", "image/jpeg")
    if (!ALLOWED_MIME.has(normalizedMime)) {
      return scanJson(
        { error: "Only JPEG and PNG images are allowed" },
        requestId,
        { status: 400 }
      )
    }

    const decodedApprox = estimateDecodedBytes(image)
    if (decodedApprox > MAX_IMAGE_BYTES) {
      return scanJson({ error: "Image must be at most 10MB" }, requestId, {
        status: 400,
      })
    }

    console.info(
      "[card-scanner scan]",
      JSON.stringify({
        requestId,
        phase: "validated",
        mime: mimeType,
        decodedApproxBytes: decodedApprox,
      })
    )

    const extracted = await extractBusinessCard(rawBase64, mimeType, requestId)

    console.info(
      "[card-scanner scan]",
      JSON.stringify({ requestId, phase: "success" })
    )

    return scanJson({ extracted }, requestId)
  } catch (e) {
    const mapped = mapCardScanAiError(e)
    if (mapped) {
      console.error(
        "[card-scanner scan]",
        JSON.stringify({
          requestId,
          phase: "error",
          code: mapped.body.code,
          clientMessage: mapped.body.error,
        })
      )
      return scanJson(
        { error: mapped.body.error, code: mapped.body.code },
        requestId,
        { status: mapped.status }
      )
    }

    const message = e instanceof Error ? e.message : "Scan failed"
    const stack = e instanceof Error ? e.stack : undefined
    console.error(
      "[card-scanner scan]",
      JSON.stringify({
        requestId,
        phase: "error",
        message,
        stack: stack?.split("\n").slice(0, 12).join("\n"),
      })
    )
    return scanJson(
      {
        error: "Something went wrong while scanning. Please try again.",
        code: "SCAN_FAILED",
      },
      requestId,
      { status: 500 }
    )
  }
}
