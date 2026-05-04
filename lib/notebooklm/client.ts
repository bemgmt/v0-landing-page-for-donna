import "server-only"

/**
 * NotebookLM client.
 *
 * Since there is no official public API, this client can operate in two modes:
 *
 * 1. **MCP Mode (development):** Queries are proxied through the NotebookLM MCP server
 *    configured in the IDE. This is used during development sessions.
 *
 * 2. **Direct Mode (portal):** For the admin portal, we use a lightweight HTTP proxy
 *    to the community MCP server running locally. The MCP server must be started
 *    separately (see setup instructions).
 *
 * Default notebook: ef6a20e1-9bc3-402a-91f0-11f286c2c943
 */

const DEFAULT_NOTEBOOK_ID = process.env.NOTEBOOKLM_NOTEBOOK_ID ?? "ef6a20e1-9bc3-402a-91f0-11f286c2c943"

export interface NotebookSource {
  title: string
  snippet: string
  sourceId?: string
}

export interface NotebookAnswer {
  answer: string
  sources: NotebookSource[]
  notebookId: string
  query: string
}

/**
 * Query a NotebookLM notebook with a natural language question.
 *
 * This attempts to connect to a locally-running NotebookLM MCP proxy.
 * If the proxy is not available, it returns a helpful fallback message.
 */
export async function queryNotebook(
  question: string,
  notebookId?: string,
): Promise<NotebookAnswer> {
  const nbId = notebookId ?? DEFAULT_NOTEBOOK_ID
  const proxyUrl = process.env.NOTEBOOKLM_PROXY_URL ?? "http://localhost:4100"

  try {
    const res = await fetch(`${proxyUrl}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notebookId: nbId,
        question,
      }),
      signal: AbortSignal.timeout(30_000), // 30s timeout for browser automation
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`NotebookLM proxy error: ${res.status} ${body}`)
    }

    const json = (await res.json()) as {
      answer?: string
      sources?: NotebookSource[]
    }

    return {
      answer: json.answer ?? "No answer was returned.",
      sources: json.sources ?? [],
      notebookId: nbId,
      query: question,
    }
  } catch (err: any) {
    // If the proxy is not running, return a helpful message
    if (err.cause?.code === "ECONNREFUSED" || err.name === "AbortError") {
      return {
        answer:
          "NotebookLM proxy is not running. Start the MCP server with:\n\n```\nnpx mcp-server-notebooklm\n```\n\nThen try again.",
        sources: [],
        notebookId: nbId,
        query: question,
      }
    }

    return {
      answer: `Query failed: ${err.message}`,
      sources: [],
      notebookId: nbId,
      query: question,
    }
  }
}

/**
 * List sources in a notebook.
 */
export async function listNotebookSources(notebookId?: string): Promise<NotebookSource[]> {
  const nbId = notebookId ?? DEFAULT_NOTEBOOK_ID
  const proxyUrl = process.env.NOTEBOOKLM_PROXY_URL ?? "http://localhost:4100"

  try {
    const res = await fetch(`${proxyUrl}/sources?notebookId=${encodeURIComponent(nbId)}`)
    if (!res.ok) return []
    const json = (await res.json()) as { sources?: NotebookSource[] }
    return json.sources ?? []
  } catch {
    return []
  }
}
