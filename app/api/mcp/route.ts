import { Buffer } from "node:buffer"
import { randomUUID, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  extractBusinessCard,
  parseImagePayload,
  CARD_SCAN_MODEL,
} from "@/lib/card-scanner/extract-card"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendCardScanAlert } from "@/lib/email/send-card-scan-alert"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const maxDuration = 120
export const dynamic = "force-dynamic"

function isAuthorized(request: Request, hasSession: boolean): boolean {
  const expected = process.env.DONNA_MCP_TOKEN || process.env.DONNA_BILLING_TOKEN
  // If no server token is configured in environment, allow session or localhost/dev
  if (!expected) return true

  const authorization = request.headers.get("authorization") ?? ""
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (supplied) {
    const expectedBytes = Buffer.from(expected)
    const suppliedBytes = Buffer.from(supplied)
    if (
      expectedBytes.length === suppliedBytes.length &&
      timingSafeEqual(expectedBytes, suppliedBytes)
    ) {
      return true
    }
  }

  return hasSession
}

const TOOLS_MANIFEST = [
  {
    name: "scan_business_card",
    description:
      "Extract structured contact information from a business card image using vision AI, and save it as a new contact/lead in DONNA CRM with automated team notification.",
    parameters: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description:
            "Base64 data URL (e.g. data:image/jpeg;base64,...), raw base64 string, or publicly accessible HTTP/HTTPS URL of the card image.",
        },
        notes: {
          type: "string",
          description: "Optional notes about the contact or context of the encounter.",
        },
        event_tag: {
          type: "string",
          description: "Optional event tag, conference, or source location.",
        },
        auto_save: {
          type: "boolean",
          description:
            "Whether to automatically save the contact into DONNA CRM and send alert emails (defaults to true).",
          default: true,
        },
      },
      required: ["image"],
    },
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description:
            "Base64 data URL (e.g. data:image/jpeg;base64,...), raw base64 string, or publicly accessible HTTP/HTTPS URL of the card image.",
        },
        notes: {
          type: "string",
          description: "Optional notes about the contact or context of the encounter.",
        },
        event_tag: {
          type: "string",
          description: "Optional event tag, conference, or source location.",
        },
        auto_save: {
          type: "boolean",
          description:
            "Whether to automatically save the contact into DONNA CRM and send alert emails (defaults to true).",
          default: true,
        },
      },
      required: ["image"],
    },
  },
  {
    name: "add_contact",
    description: "Create a new contact or lead in DONNA CRM.",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Contact full name" },
        email: { type: "string", description: "Primary email address" },
        phone: { type: "string", description: "Phone number" },
        company: { type: "string", description: "Company or organization name" },
        job_title: { type: "string", description: "Job title or position" },
        website: { type: "string", description: "Website URL" },
        notes: { type: "string", description: "Notes or comments" },
        event_tag: { type: "string", description: "Lead source or event tag" },
      },
      required: ["full_name"],
    },
    inputSchema: {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Contact full name" },
        email: { type: "string", description: "Primary email address" },
        phone: { type: "string", description: "Phone number" },
        company: { type: "string", description: "Company or organization name" },
        job_title: { type: "string", description: "Job title or position" },
        website: { type: "string", description: "Website URL" },
        notes: { type: "string", description: "Notes or comments" },
        event_tag: { type: "string", description: "Lead source or event tag" },
      },
      required: ["full_name"],
    },
  },
  {
    name: "search_contacts",
    description: "Search existing contacts and leads in DONNA CRM.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (name, email, or company)" },
        limit: { type: "integer", description: "Maximum results to return (default 10)", default: 10 },
      },
      required: ["query"],
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (name, email, or company)" },
        limit: { type: "integer", description: "Maximum results to return (default 10)", default: 10 },
      },
      required: ["query"],
    },
  },
]

async function resolveImageBase64(imageInput: string): Promise<{ rawBase64: string; mimeType: string }> {
  const trimmed = imageInput.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const res = await fetch(trimmed)
    if (!res.ok) {
      throw new Error(`Failed to fetch image from URL: ${res.statusText}`)
    }
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()
    return {
      rawBase64: Buffer.from(buffer).toString("base64"),
      mimeType: contentType.includes("png") ? "image/png" : "image/jpeg",
    }
  }
  return parseImagePayload(trimmed)
}

async function executeScanBusinessCard(args: Record<string, unknown>, requestId: string) {
  const image = typeof args.image === "string" ? args.image : ""
  if (!image) throw new Error("Parameter 'image' is required")

  const { rawBase64, mimeType } = await resolveImageBase64(image)
  const extracted = await extractBusinessCard(rawBase64, mimeType, requestId)

  const autoSave = args.auto_save !== false
  let leadId: string | null = null
  let emailSent = false

  if (autoSave) {
    const supabase = createAdminClient()
    const notes = typeof args.notes === "string" ? args.notes : null
    const eventTag = typeof args.event_tag === "string" ? args.event_tag : null

    const insertRow = {
      full_name: extracted.full_name || null,
      company: extracted.company || null,
      job_title: extracted.job_title || null,
      primary_email: extracted.email?.trim() || null,
      phone: extracted.phone?.trim() || null,
      website: extracted.website || null,
      notes: notes?.trim() || null,
      event_tag: eventTag?.trim() || null,
      extraction_model: CARD_SCAN_MODEL,
      status: "new",
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("business_card_leads")
      .insert(insertRow)
      .select("id")
      .single()

    if (insertErr) {
      console.error("[mcp] card save error", insertErr)
    } else if (inserted) {
      leadId = inserted.id

      // Upload image to storage
      try {
        const buf = Buffer.from(rawBase64, "base64")
        if (buf.length > 0 && buf.length <= 10 * 1024 * 1024) {
          const ext = mimeType.includes("png") ? "png" : "jpg"
          const objectPath = `${leadId}/${randomUUID()}.${ext}`
          const { error: upErr } = await supabase.storage
            .from("business-cards")
            .upload(objectPath, buf, { contentType: mimeType, upsert: false })
          if (!upErr) {
            await supabase
              .from("business_card_leads")
              .update({ image_storage_path: objectPath })
              .eq("id", leadId)
          }
        }
      } catch (err) {
        console.warn("[mcp] card storage upload failed", err)
      }

      // Send alert email
      emailSent = await sendCardScanAlert({
        leadId,
        fullName: extracted.full_name || null,
        company: extracted.company || null,
        jobTitle: extracted.job_title || null,
        email: extracted.email?.trim() || null,
        phone: extracted.phone?.trim() || null,
        website: extracted.website || null,
        eventOrLocation: eventTag?.trim() || null,
        notes: notes?.trim() || null,
      })
    }
  }

  return {
    extracted,
    saved: autoSave && !!leadId,
    lead_id: leadId,
    email_sent: emailSent,
    message: autoSave
      ? `Successfully scanned card and saved contact: ${extracted.full_name || extracted.company || "New Lead"}`
      : `Successfully scanned and extracted card details.`,
  }
}

async function executeAddContact(args: Record<string, unknown>) {
  const fullName = typeof args.full_name === "string" ? args.full_name.trim() : ""
  if (!fullName) throw new Error("Parameter 'full_name' is required")

  const email = typeof args.email === "string" ? args.email.trim() : null
  const phone = typeof args.phone === "string" ? args.phone.trim() : null
  const company = typeof args.company === "string" ? args.company.trim() : null
  const jobTitle = typeof args.job_title === "string" ? args.job_title.trim() : null
  const website = typeof args.website === "string" ? args.website.trim() : null
  const notes = typeof args.notes === "string" ? args.notes.trim() : null
  const eventTag = typeof args.event_tag === "string" ? args.event_tag.trim() : null

  const supabase = createAdminClient()
  const { data: inserted, error } = await supabase
    .from("business_card_leads")
    .insert({
      full_name: fullName,
      primary_email: email,
      phone,
      company,
      job_title: jobTitle,
      website,
      notes,
      event_tag: eventTag,
      status: "new",
    })
    .select("id")
    .single()

  if (error) throw error

  return {
    success: true,
    lead_id: inserted.id,
    contact: {
      id: inserted.id,
      full_name: fullName,
      primary_email: email,
      phone,
      company,
      job_title: jobTitle,
    },
    message: `Contact added: ${fullName}`,
  }
}

async function executeSearchContacts(args: Record<string, unknown>) {
  const query = typeof args.query === "string" ? args.query.trim() : ""
  const limit = typeof args.limit === "number" ? Math.min(Math.max(args.limit, 1), 50) : 10

  const supabase = createAdminClient()
  let q = supabase
    .from("business_card_leads")
    .select("id, full_name, primary_email, phone, company, job_title, status, created_at")

  if (query) {
    q = q.or(`full_name.ilike.%${query}%,company.ilike.%${query}%,primary_email.ilike.%${query}%`)
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error

  return {
    contacts: data ?? [],
    count: (data ?? []).length,
    query,
  }
}

async function handleToolExecution(name: string, args: Record<string, unknown>, requestId: string) {
  switch (name) {
    case "scan_business_card":
    case "card_scanner":
      return await executeScanBusinessCard(args, requestId)
    case "add_contact":
      return await executeAddContact(args)
    case "search_contacts":
      return await executeSearchContacts(args)
    default:
      throw new Error(`Tool '${name}' not found`)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") ?? "info"

  if (action === "tools") {
    return NextResponse.json({
      success: true,
      tools: TOOLS_MANIFEST,
      count: TOOLS_MANIFEST.length,
    })
  }

  return NextResponse.json({
    success: true,
    name: "donna-mcp",
    version: "1.0.0",
    protocol: "mcp-jsonrpc-2.0",
    description: "DONNA Model Context Protocol Server",
    capabilities: {
      tools: TOOLS_MANIFEST.map((t) => t.name),
      sessions: false,
    },
    endpoints: {
      "POST /api/mcp": "Execute MCP tools or JSON-RPC 2.0 requests",
      "GET /api/mcp?action=tools": "List available MCP tools",
      "GET /api/mcp?action=info": "Server information",
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(request, !!session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const requestId = randomUUID()

  try {
    const body = await request.json()

    // 1. JSON-RPC 2.0 Handling
    if (body && typeof body === "object" && body.jsonrpc === "2.0") {
      const rpcId = body.id ?? null

      if (body.method === "initialize") {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: rpcId,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: {
              name: "donna-mcp",
              version: "1.0.0",
            },
            capabilities: {
              tools: {},
            },
          },
        })
      }

      if (body.method === "tools/list") {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: rpcId,
          result: {
            tools: TOOLS_MANIFEST.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            })),
          },
        })
      }

      if (body.method === "tools/call") {
        const toolName = body.params?.name
        const toolArgs = (body.params?.arguments || {}) as Record<string, unknown>

        const result = await handleToolExecution(toolName, toolArgs, requestId)
        return NextResponse.json({
          jsonrpc: "2.0",
          id: rpcId,
          result: {
            content: [
              {
                type: "text",
                text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
              },
            ],
            structured: result,
          },
        })
      }

      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        error: {
          code: -32601,
          message: `Method '${body.method}' not found`,
        },
      })
    }

    // 2. Simple REST / Legacy DONNA format
    if (body.type === "tool_list") {
      return NextResponse.json({
        success: true,
        tools: TOOLS_MANIFEST,
        count: TOOLS_MANIFEST.length,
      })
    }

    const toolName = body.tool_name || body.tool
    const parameters = body.parameters || body.args || {}

    if (!toolName) {
      return NextResponse.json({ error: "tool_name is required" }, { status: 400 })
    }

    const result = await handleToolExecution(toolName, parameters, requestId)
    return NextResponse.json({
      success: true,
      result,
      tool: toolName,
      session_id: body.session_id ?? "default",
    })
  } catch (err) {
    console.error("[mcp] request error", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
