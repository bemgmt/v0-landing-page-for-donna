"use client"

import { useEffect, useState } from "react"
import type { AuthDiagnosticEvent } from "@/lib/auth/diagnostics"

type DbEvent = AuthDiagnosticEvent & { id: string; created_at: string }

export default function AuthDiagnosticsClient() {
  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/auth-diagnostics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events")
        return res.json()
      })
      .then((data) => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) return <div className="p-8">Loading diagnostics...</div>
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>

  return (
    <div className="p-8 bg-black text-foreground min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Auth Diagnostics</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Env</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Subject / Client</th>
              <th className="px-4 py-3">Correlation ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {new Date(ev.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium">
                  {ev.event_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ev.environment}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${ev.is_success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {ev.is_success ? "SUCCESS" : "FAILURE"}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs truncate" title={ev.error_message || ""}>
                  <div className="flex flex-col gap-1 text-xs">
                    {ev.error_message && <span className="text-red-400 font-medium">{ev.error_message}</span>}
                    {ev.endpoint && <span>Endpoint: {ev.endpoint}</span>}
                    {ev.redirect_host && <span>Redirect: {ev.redirect_host}</span>}
                    <div className="flex gap-2 text-muted-foreground">
                      <span>Session: {ev.has_session ? "Y" : "N"}</span>
                      <span>Token: {ev.has_access_token ? "Y" : "N"}</span>
                      <span>Auth Header: {ev.has_authorization_header ? "Y" : "N"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <span>Sub: {ev.subject_hash || "none"}</span>
                    <span>Client: {ev.cognito_client_id || "none"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {ev.correlation_id ? (
                    <button 
                      onClick={() => copyToClipboard(ev.correlation_id)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      {ev.correlation_id.slice(0, 8)}...
                      <span className="opacity-50">Copy</span>
                    </button>
                  ) : "-"}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No auth events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
