"use client"

import { useState } from "react"
import { Brain, Search, FileText, Loader2 } from "lucide-react"

interface Source {
  title: string
  snippet: string
}

interface QueryResult {
  answer: string
  sources: Source[]
  query: string
}

export default function KnowledgePanel() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [history, setHistory] = useState<QueryResult[]>([])

  const handleQuery = async () => {
    if (!question.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/knowledge/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Query failed")

      const queryResult: QueryResult = {
        answer: json.answer,
        sources: json.sources ?? [],
        query: question.trim(),
      }
      setResult(queryResult)
      setHistory((prev) => [queryResult, ...prev.slice(0, 9)])
      setQuestion("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-12rem)]">
      {/* History Sidebar */}
      <div className="lg:col-span-3 space-y-4 overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Search className="w-3.5 h-3.5" />
          Recent Queries
        </h3>
        <div className="space-y-2">
          {history.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No queries yet.</p>
          )}
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => setResult(item)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                result?.query === item.query
                  ? "border-accent bg-accent/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <p className="font-medium truncate">{item.query}</p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                {item.sources.length} source{item.sources.length !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-9 flex flex-col bg-background border border-border rounded-2xl overflow-hidden shadow-xl">
        {/* Query Input */}
        <div className="p-6 border-b border-border bg-muted/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your DONNA research notebook anything..."
              className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleQuery()
              }}
            />
            <button
              onClick={() => void handleQuery()}
              disabled={loading || !question.trim()}
              className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-destructive mt-3">{error}</p>
          )}
        </div>

        {/* Answer Display */}
        <div className="flex-1 overflow-y-auto p-6">
          {result ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Question
                </p>
                <p className="text-sm font-medium">{result.query}</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/10 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-1.5">
                  <Brain className="w-3 h-3" />
                  Answer
                </p>
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">{result.answer}</p>
                </div>
              </div>

              {result.sources.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Sources ({result.sources.length})
                  </p>
                  <div className="space-y-2">
                    {result.sources.map((source, i) => (
                      <div key={i} className="rounded-lg border border-border p-4 bg-background">
                        <p className="text-xs font-bold">{source.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                          {source.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 opacity-15" />
              </div>
              <h3 className="text-sm font-bold">DONNA Knowledge Base</h3>
              <p className="text-xs max-w-[280px] mt-2">
                Ask questions about DONNA strategy, positioning, partner program, or technical architecture.
                Answers are grounded in your NotebookLM research.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
