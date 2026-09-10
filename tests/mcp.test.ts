import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))

const mocks = vi.hoisted(() => ({
  extract: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  send: vi.fn(),
  upload: vi.fn(),
}))

vi.mock("@/lib/card-scanner/extract-card", () => ({
  CARD_SCAN_MODEL: "test-model",
  extractBusinessCard: mocks.extract,
  parseImagePayload: (img: string) => ({ rawBase64: "dGVzdA==", mimeType: "image/jpeg" }),
}))

vi.mock("@/lib/email/send-card-scan-alert", () => ({
  sendCardScanAlert: mocks.send,
}))

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/supabase/admin", () => {
  const queryBuilder: any = {}
  queryBuilder.select = vi.fn().mockReturnValue(queryBuilder)
  queryBuilder.or = vi.fn().mockReturnValue(queryBuilder)
  queryBuilder.order = vi.fn().mockReturnValue(queryBuilder)
  queryBuilder.limit = vi.fn().mockResolvedValue({
    data: [
      { id: "lead-1", full_name: "Alice Smith", company: "Wonderland", primary_email: "alice@example.com" },
    ],
    error: null,
  })

  return {
    createAdminClient: () => ({
      from: () => ({
        insert: mocks.insert,
        select: queryBuilder.select,
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
      storage: {
        from: () => ({
          upload: mocks.upload,
        }),
      },
    }),
  }
})

import { GET, POST } from "@/app/api/mcp/route"

describe("MCP Endpoint (/api/mcp)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.extract.mockResolvedValue({
      full_name: "Jane Doe",
      company: "Innovate Inc",
      job_title: "CTO",
      email: "jane@innovate.com",
      phone: "+1-555-987-6543",
      website: "https://innovate.com",
    })
    mocks.insert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { id: "mcp-lead-123" },
          error: null,
        }),
      }),
    })
    mocks.send.mockResolvedValue(true)
    mocks.upload.mockResolvedValue({ error: null })
  })

  it("returns server info and tools list on GET", async () => {
    const infoReq = new Request("https://aidonna.co/api/mcp?action=info")
    const infoRes = await GET(infoReq)
    expect(infoRes.status).toBe(200)
    const infoJson = await infoRes.json()
    expect(infoJson).toMatchObject({
      name: "donna-mcp",
      version: "1.0.0",
      capabilities: expect.objectContaining({
        tools: expect.arrayContaining(["scan_business_card", "add_contact", "search_contacts"]),
      }),
    })

    const toolsReq = new Request("https://aidonna.co/api/mcp?action=tools")
    const toolsRes = await GET(toolsReq)
    expect(toolsRes.status).toBe(200)
    const toolsJson = await toolsRes.json()
    expect(toolsJson.success).toBe(true)
    expect(toolsJson.tools.some((t: { name: string }) => t.name === "scan_business_card")).toBe(true)
  })

  it("handles JSON-RPC 2.0 initialize request", async () => {
    const req = new Request("https://aidonna.co/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        serverInfo: { name: "donna-mcp" },
      },
    })
  })

  it("handles JSON-RPC 2.0 tools/list request", async () => {
    const req = new Request("https://aidonna.co/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result.tools.length).toBeGreaterThanOrEqual(3)
    expect(json.result.tools.some((t: { name: string }) => t.name === "scan_business_card")).toBe(true)
  })

  it("handles JSON-RPC 2.0 tools/call to scan_business_card with auto_save", async () => {
    const req = new Request("https://aidonna.co/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "scan_business_card",
          arguments: {
            image: "data:image/jpeg;base64,dGVzdA==",
            notes: "Met at Expo 2026",
            event_tag: "Expo 2026",
            auto_save: true,
          },
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result.structured).toMatchObject({
      saved: true,
      lead_id: "mcp-lead-123",
      email_sent: true,
      extracted: expect.objectContaining({ full_name: "Jane Doe" }),
    })
    expect(mocks.extract).toHaveBeenCalled()
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Jane Doe",
        notes: "Met at Expo 2026",
        event_tag: "Expo 2026",
      })
    )
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: "mcp-lead-123",
        fullName: "Jane Doe",
      })
    )
  })

  it("handles REST tool_execute format for scan_business_card", async () => {
    const req = new Request("https://aidonna.co/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        type: "tool_execute",
        tool_name: "scan_business_card",
        parameters: {
          image: "data:image/jpeg;base64,dGVzdA==",
          auto_save: false,
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.result.saved).toBe(false)
    expect(json.result.extracted.company).toBe("Innovate Inc")
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("supports add_contact and search_contacts tools", async () => {
    // Test add_contact
    const addReq = new Request("https://aidonna.co/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        type: "tool_execute",
        tool_name: "add_contact",
        parameters: {
          full_name: "Bob Builder",
          email: "bob@construction.com",
          company: "Builder Co",
        },
      }),
    })
    const addRes = await POST(addReq)
    expect(addRes.status).toBe(200)
    const addJson = await addRes.json()
    expect(addJson.success).toBe(true)
    expect(addJson.result.lead_id).toBe("mcp-lead-123")

    // Test search_contacts
    const searchReq = new Request("https://aidonna.co/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        type: "tool_execute",
        tool_name: "search_contacts",
        parameters: {
          query: "Alice",
        },
      }),
    })
    const searchRes = await POST(searchReq)
    expect(searchRes.status).toBe(200)
    const searchJson = await searchRes.json()
    expect(searchJson.success).toBe(true)
    expect(searchJson.result.contacts).toHaveLength(1)
    expect(searchJson.result.contacts[0].full_name).toBe("Alice Smith")
  })
})
