import { APICallError } from "@ai-sdk/provider"

/**
 * Gather the full error chain from AI SDK errors (RetryError wraps inner errors).
 */
function gatherErrorChain(e: unknown, out: unknown[]) {
  if (e === null || e === undefined) return
  out.push(e)
  // RetryError from ai SDK has an `errors` array and `lastError`
  if (typeof e === "object" && e !== null && "errors" in e) {
    const re = e as { errors?: unknown[]; lastError?: unknown }
    if (Array.isArray(re.errors)) {
      for (const err of re.errors) gatherErrorChain(err, out)
    }
    if (re.lastError !== undefined) gatherErrorChain(re.lastError, out)
  }
  if (e instanceof Error && e.cause !== undefined && e.cause !== e) {
    gatherErrorChain(e.cause, out)
  }
}

function errorChain(e: unknown): unknown[] {
  const out: unknown[] = []
  gatherErrorChain(e, out)
  return out
}

/** Collect diagnostic text from nested AI SDK errors. */
function collectDiagnosticText(chain: unknown[]): string {
  const parts: string[] = []
  for (const x of chain) {
    if (APICallError.isInstance(x)) {
      parts.push(x.message)
      if (x.responseBody) parts.push(String(x.responseBody))
      if (typeof x.statusCode === "number") parts.push(String(x.statusCode))
    } else if (x instanceof Error) {
      parts.push(x.message)
    }
  }
  return parts.join(" ").toLowerCase()
}

export type CardScanErrorCode = "AI_QUOTA_EXCEEDED" | "AI_RATE_LIMIT" | "AI_AUTH"

export type CardScanErrorResponse = {
  error: string
  code: CardScanErrorCode
}

/**
 * Map AI SDK / provider failures to safe, user-friendly client responses.
 * Returns null if the error is not recognized as an AI-specific issue.
 */
export function mapCardScanAiError(
  e: unknown
): { status: number; body: CardScanErrorResponse } | null {
  const chain = errorChain(e)

  // Auth failure (invalid API key)
  if (chain.some((x) => APICallError.isInstance(x) && x.statusCode === 401)) {
    return {
      status: 503,
      body: {
        code: "AI_AUTH",
        error:
          "Card scanning is misconfigured (invalid AI API credentials). Please contact an administrator.",
      },
    }
  }

  const t = collectDiagnosticText(chain)

  // Quota / billing exhausted
  if (
    /exceeded your current quota|insufficient_quota|check your plan and billing|billing hard limit|you exceeded your/.test(
      t
    )
  ) {
    return {
      status: 503,
      body: {
        code: "AI_QUOTA_EXCEEDED",
        error:
          "Card scanning is temporarily unavailable because the AI service has reached its usage limit. Please try again later.",
      },
    }
  }

  // Rate limit
  if (/\b429\b|too many requests|rate_limit|rate limit/.test(t)) {
    return {
      status: 503,
      body: {
        code: "AI_RATE_LIMIT",
        error: "The scanning service is busy. Please wait a minute and try again.",
      },
    }
  }

  return null
}
