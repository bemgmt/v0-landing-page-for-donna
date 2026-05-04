import "server-only"

import { getGscToken } from "@/lib/google/oauth"

const GSC_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3"
const GSC_SEARCH_ANALYTICS = "https://searchconsole.googleapis.com/webmasters/v3/sites"

type Dimension = "query" | "page" | "country" | "device" | "date"

export interface PerformanceRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface PerformanceResponse {
  rows: PerformanceRow[]
  responseAggregationType: string
}

export interface InspectionResult {
  inspectionResultLink: string
  indexStatusResult: {
    verdict: string
    coverageState: string
    robotsTxtState: string
    indexingState: string
    lastCrawlTime?: string
    pageFetchState?: string
    crawledAs?: string
  }
  mobileUsabilityResult?: {
    verdict: string
    issues?: { issueType: string; severity: string; message: string }[]
  }
}

// In-memory response cache (5-minute TTL)
const responseCache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000

function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key)
  if (entry && Date.now() < entry.expiresAt) return entry.data as T
  responseCache.delete(key)
  return null
}

function setCache(key: string, data: unknown): void {
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL })
}

/**
 * Query GSC Search Analytics for performance data.
 */
export async function queryPerformance(options: {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  dimensions?: Dimension[]
  rowLimit?: number
  startRow?: number
  dimensionFilterGroups?: Array<{
    filters: Array<{
      dimension: Dimension
      operator: "equals" | "contains" | "notContains"
      expression: string
    }>
  }>
}): Promise<PerformanceResponse> {
  const siteUrl = process.env.GSC_SITE_URL || "sc-domain:aidonna.co"
  const cacheKey = `perf:${JSON.stringify(options)}`
  const cached = getCached<PerformanceResponse>(cacheKey)
  if (cached) return cached

  const token = await getGscToken()

  const res = await fetch(
    `${GSC_SEARCH_ANALYTICS}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: options.startDate,
        endDate: options.endDate,
        dimensions: options.dimensions ?? ["query"],
        rowLimit: options.rowLimit ?? 25,
        startRow: options.startRow ?? 0,
        ...(options.dimensionFilterGroups && {
          dimensionFilterGroups: options.dimensionFilterGroups,
        }),
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GSC Search Analytics query failed: ${res.status} ${body}`)
  }

  const data = (await res.json()) as PerformanceResponse
  setCache(cacheKey, data)
  return data
}

/**
 * Inspect a URL via the GSC URL Inspection API.
 */
export async function inspectUrl(pageUrl: string): Promise<InspectionResult> {
  const siteUrl = process.env.GSC_SITE_URL || "sc-domain:aidonna.co"
  const cacheKey = `inspect:${pageUrl}`
  const cached = getCached<InspectionResult>(cacheKey)
  if (cached) return cached

  const token = await getGscToken()

  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl: pageUrl,
      siteUrl,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GSC URL Inspection failed: ${res.status} ${body}`)
  }

  const json = (await res.json()) as { inspectionResult: InspectionResult }
  setCache(cacheKey, json.inspectionResult)
  return json.inspectionResult
}

/**
 * Request indexing for a URL.
 * Note: This uses the Indexing API which requires separate setup.
 */
export async function requestIndexing(pageUrl: string): Promise<{ status: string }> {
  const token = await getGscToken()

  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: pageUrl,
      type: "URL_UPDATED",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Indexing API request failed: ${res.status} ${body}`)
  }

  return { status: "requested" }
}
