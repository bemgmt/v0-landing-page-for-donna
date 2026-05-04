"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, TrendingUp, Globe, Smartphone, Monitor, ArrowUpDown, RefreshCw, ExternalLink } from "lucide-react"

interface PerformanceRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

type Dimension = "query" | "page" | "device" | "country" | "date"
type SortKey = "clicks" | "impressions" | "ctr" | "position"
type DateRange = "7d" | "28d" | "90d"

function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const end = new Date()
  end.setDate(end.getDate() - 1) // GSC data lags ~1 day
  const start = new Date(end)

  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7)
      break
    case "28d":
      start.setDate(start.getDate() - 28)
      break
    case "90d":
      start.setDate(start.getDate() - 90)
      break
  }

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function SeoDashboard() {
  const [rows, setRows] = useState<PerformanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dimension, setDimension] = useState<Dimension>("query")
  const [dateRange, setDateRange] = useState<DateRange>("28d")
  const [sortKey, setSortKey] = useState<SortKey>("clicks")
  const [sortAsc, setSortAsc] = useState(false)
  const [inspectUrl, setInspectUrl] = useState("")
  const [inspectResult, setInspectResult] = useState<any>(null)
  const [inspecting, setInspecting] = useState(false)

  // Aggregated totals
  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
    }),
    { clicks: 0, impressions: 0 },
  )
  const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0
  const avgPosition =
    rows.length > 0 ? rows.reduce((sum, r) => sum + r.position, 0) / rows.length : 0

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = getDateRange(dateRange)
      const res = await fetch(
        `/api/seo/performance?startDate=${startDate}&endDate=${endDate}&dimensions=${dimension}`,
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Query failed")
      setRows(json.rows ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dateRange, dimension])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const sortedRows = [...rows].sort((a, b) => {
    const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0)
    return sortAsc ? diff : -diff
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const handleInspect = async () => {
    if (!inspectUrl.trim()) return
    setInspecting(true)
    setInspectResult(null)
    try {
      const fullUrl = inspectUrl.startsWith("http") ? inspectUrl : `https://aidonna.co${inspectUrl}`
      const res = await fetch(`/api/seo/inspect?url=${encodeURIComponent(fullUrl)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Inspection failed")
      setInspectResult(json)
    } catch (err: any) {
      setInspectResult({ error: err.message })
    } finally {
      setInspecting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Clicks</p>
          <p className="text-3xl font-bold mt-1">{formatNumber(totals.clicks)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Impressions</p>
          <p className="text-3xl font-bold mt-1">{formatNumber(totals.impressions)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg CTR</p>
          <p className="text-3xl font-bold mt-1">{(avgCtr * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Position</p>
          <p className="text-3xl font-bold mt-1">{avgPosition.toFixed(1)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border">
          {(["7d", "28d", "90d"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-all ${
                dateRange === r
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "28d" ? "28 Days" : "90 Days"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border">
          {(["query", "page", "device", "country"] as Dimension[]).map((d) => (
            <button
              key={d}
              onClick={() => setDimension(d)}
              className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-all flex items-center gap-1 ${
                dimension === d
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background"
              }`}
            >
              {d === "query" && <Search className="w-3 h-3" />}
              {d === "page" && <Globe className="w-3 h-3" />}
              {d === "device" && <Monitor className="w-3 h-3" />}
              {d === "country" && <TrendingUp className="w-3 h-3" />}
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="text-[10px] font-bold uppercase px-3 py-1.5 rounded bg-background border border-border hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-2xl border border-border bg-background shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {dimension}
                </th>
                {(["clicks", "impressions", "ctr", "position"] as SortKey[]).map((key) => (
                  <th key={key} className="text-right px-4 py-3">
                    <button
                      onClick={() => handleSort(key)}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-auto"
                    >
                      {key === "ctr" ? "CTR" : key}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 font-medium truncate max-w-[300px]">
                    {row.keys[0]}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">
                    {formatNumber(row.clicks)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatNumber(row.impressions)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {(row.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {row.position.toFixed(1)}
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {error ? "Failed to load data" : "No data available for this period"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* URL Inspection */}
      <div className="rounded-2xl border border-border bg-background shadow-xl p-6 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-accent" />
          URL Inspection
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={inspectUrl}
            onChange={(e) => setInspectUrl(e.target.value)}
            placeholder="Enter a URL or path (e.g. /early-adopter-program)"
            className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-accent text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleInspect()
            }}
          />
          <button
            onClick={() => void handleInspect()}
            disabled={inspecting || !inspectUrl.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-bold disabled:opacity-50 transition-all"
          >
            {inspecting ? "Inspecting..." : "Inspect"}
          </button>
        </div>

        {inspectResult && !inspectResult.error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Verdict</p>
              <p className={`text-sm font-bold mt-0.5 ${
                inspectResult.indexStatusResult?.verdict === "PASS" ? "text-green-500" : "text-amber-500"
              }`}>
                {inspectResult.indexStatusResult?.verdict ?? "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Coverage</p>
              <p className="text-sm font-bold mt-0.5">
                {inspectResult.indexStatusResult?.coverageState ?? "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Last Crawl</p>
              <p className="text-sm font-bold mt-0.5">
                {inspectResult.indexStatusResult?.lastCrawlTime
                  ? new Date(inspectResult.indexStatusResult.lastCrawlTime).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Robots</p>
              <p className="text-sm font-bold mt-0.5">
                {inspectResult.indexStatusResult?.robotsTxtState ?? "N/A"}
              </p>
            </div>
          </div>
        )}

        {inspectResult?.error && (
          <p className="text-sm text-destructive mt-2">{inspectResult.error}</p>
        )}
      </div>
    </div>
  )
}
