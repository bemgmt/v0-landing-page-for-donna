import "server-only"
import fs from "node:fs/promises"
import { getFlowToken } from "@/lib/google/oauth"
import { STRATEGIC_PARTNER_DOCS, getStrategicPartnerDocPath } from "@/lib/portal/strategic-partner-docs"

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
 * Reads all strategic partner docs from the filesystem to inject as context.
 */
async function getContextString(): Promise<string> {
  const docs = []
  for (const docMeta of STRATEGIC_PARTNER_DOCS) {
    try {
      const p = getStrategicPartnerDocPath(docMeta.filename)
      const content = await fs.readFile(p, "utf-8")
      docs.push(`--- ${docMeta.title} ---\n${content}`)
    } catch (e) {
      console.warn(`[notebooklm] Failed to read doc: ${docMeta.filename}`, e)
    }
  }
  return docs.join("\n\n")
}

/**
 * Query the Knowledge Base using Vertex AI (Gemini 1.5 Pro/Flash).
 * This replaces the local MCP proxy by acting as a direct RAG integration.
 */
export async function queryNotebook(
  question: string,
  notebookId?: string,
): Promise<NotebookAnswer> {
  const projectId = process.env.GOOGLE_FLOW_PROJECT_ID
  const nbId = notebookId ?? "default"

  if (!projectId) {
    return {
      answer: "Knowledge base is unavailable: Missing GOOGLE_FLOW_PROJECT_ID in environment variables.",
      sources: [],
      notebookId: nbId,
      query: question,
    }
  }

  try {
    const token = await getFlowToken()
    const context = await getContextString()
    
    // We use Gemini 1.5 Flash for fast reasoning, but could be Pro
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:generateContent`

    const systemInstruction = {
      role: "system",
      parts: [
        { 
          text: `You are DONNA's internal Knowledge Base assistant. You must answer the user's question based strictly on the provided documents. If the answer is not in the documents, tell the user you don't know based on the available information. Be concise, helpful, and professional.\n\nAVAILABLE DOCUMENTS:\n${context}` 
        }
      ]
    }

    const requestBody = {
      contents: [{ role: "user", parts: [{ text: question }] }],
      systemInstruction,
      generationConfig: {
        temperature: 0.1, // Low temperature for factual accuracy
      }
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Vertex AI error: ${res.status} ${text}`)
    }

    const data = await res.json()
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer was generated."

    // Map the internal documents as the sources used
    const sources: NotebookSource[] = STRATEGIC_PARTNER_DOCS.map(d => ({
      title: d.title,
      snippet: d.description,
      sourceId: d.slug
    }))

    return {
      answer,
      sources,
      notebookId: nbId,
      query: question,
    }
  } catch (err: any) {
    console.error("[notebooklm] query failed:", err)
    return {
      answer: `Query failed: ${err.message}`,
      sources: [],
      notebookId: nbId,
      query: question,
    }
  }
}

/**
 * List sources in the current knowledge base.
 */
export async function listNotebookSources(notebookId?: string): Promise<NotebookSource[]> {
  return STRATEGIC_PARTNER_DOCS.map(d => ({
    title: d.title,
    snippet: d.description,
    sourceId: d.slug
  }))
}
