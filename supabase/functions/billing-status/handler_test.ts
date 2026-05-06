import { assertEquals } from "@std/assert"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  extractBearer,
  handleBillingRequest,
  mapAccountStatus,
  parseBillingBody,
  sandboxResponseForEmail,
  tokensMatchConstantTime,
  type BillingEnv,
} from "./handler.ts"

const secret = "test_secret_value_for_unit_tests_only"

function baseEnv(mock: SupabaseClient): BillingEnv {
  return {
    supabaseUrl: "http://localhost",
    serviceRoleKey: "service_role_test",
    billingSecret: secret,
    _testSupabase: mock,
  }
}

function jsonPost(url: string, body: unknown, auth?: string): Request {
  const h = new Headers({ "Content-Type": "application/json" })
  if (auth) h.set("Authorization", auth)
  return new Request(url, { method: "POST", headers: h, body: JSON.stringify(body) })
}

function mockClient(opts: {
  viewRow?: Record<string, unknown> | null
  rpcData?: { count_after: number; exceeded: boolean; retry_after_seconds: number }
  resolveAccessData?: Record<string, unknown>[] | null
}): SupabaseClient {
  const rpcData = opts.rpcData ?? {
    count_after: 1,
    exceeded: false,
    retry_after_seconds: 0,
  }
  // resolveAccessData: if explicitly provided, use it for billing_s2s_resolve_access RPC.
  // If not provided but viewRow is given, wrap viewRow in an array with seat_type=purchaser.
  // If viewRow is null, return empty array.
  const resolveAccessData = opts.resolveAccessData !== undefined
    ? opts.resolveAccessData
    : opts.viewRow
      ? [{ ...opts.viewRow, seat_type: "purchaser" }]
      : []
  return {
    from(table: string) {
      if (table === "billing_auth_failures") {
        return {
          insert(_rows: unknown) {
            return Promise.resolve({ error: null })
          },
        }
      }
      return {}
    },
    rpc(name: string, _args: unknown) {
      if (name === "billing_s2s_resolve_access") {
        return Promise.resolve({ data: resolveAccessData, error: null })
      }
      // Rate limit RPC
      return Promise.resolve({ data: rpcData, error: null })
    },
  } as unknown as SupabaseClient
}

Deno.test("extractBearer parses Authorization header", () => {
  assertEquals(extractBearer("Bearer abc"), "abc")
  assertEquals(extractBearer("bearer tok.en"), "tok.en")
  assertEquals(extractBearer(null), null)
  assertEquals(extractBearer("Basic x"), null)
})

Deno.test("tokensMatchConstantTime accepts equal secrets", async () => {
  assertEquals(await tokensMatchConstantTime("x", "x"), true)
  assertEquals(await tokensMatchConstantTime("a", "b"), false)
})

Deno.test("mapAccountStatus maps Stripe statuses", () => {
  assertEquals(mapAccountStatus("active"), "active")
  assertEquals(mapAccountStatus("trialing"), "trialing")
  assertEquals(mapAccountStatus("past_due"), "past_due")
  assertEquals(mapAccountStatus("unpaid"), "past_due")
  assertEquals(mapAccountStatus("canceled"), "canceled")
  assertEquals(mapAccountStatus("incomplete_expired"), "canceled")
  assertEquals(mapAccountStatus("incomplete"), "canceled")
})

Deno.test("parseBillingBody requires non-empty email string", () => {
  assertEquals(parseBillingBody(null).ok, false)
  assertEquals(parseBillingBody({}).ok, false)
  assertEquals(parseBillingBody({ email: "" }).ok, false)
  assertEquals(parseBillingBody({ email: "  " }).ok, false)
  assertEquals(parseBillingBody({ email: 1 }).ok, false)
  const ok = parseBillingBody({
    email: "User@Example.com",
    requested_at: "2026-01-01T00:00:00.000Z",
    nonce: "n1",
  })
  assertEquals(ok.ok, true)
  if (ok.ok) assertEquals(ok.body.email, "user@example.com")
})

Deno.test("sandbox: active trial pastdue canceled team seatinvite and unknown", async () => {
  const cases: [string, number, string, string | null][] = [
    ["active@test.com", 200, "active", "purchaser"],
    ["trial@test.com", 200, "trialing", "purchaser"],
    ["pastdue@test.com", 200, "past_due", "purchaser"],
    ["canceled@test.com", 200, "canceled", "purchaser"],
    ["team@test.com", 200, "active", "purchaser"],
    ["seatinvite@test.com", 200, "active", "invite"],
    ["unknown@test.com", 404, "none", null],
  ]
  for (const [em, status, acct, seatType] of cases) {
    const r = sandboxResponseForEmail(em)
    assertEquals(r!.status, status)
    const j = JSON.parse(await r!.text()) as Record<string, unknown>
    assertEquals(j.account_status, acct)
    if (status === 200) {
      assertEquals(typeof j.plan, "string")
      assertEquals(typeof j.seats_allowance, "number")
      assertEquals(j.cancel_at_period_end, false)
      assertEquals(Array.isArray(j.notification_emails), true)
      assertEquals(typeof j.current_period_end, "string")
      assertEquals(typeof j.source_of_truth_at, "string")
      assertEquals(j.seat_type, seatType)
      if (em === "team@test.com") {
        assertEquals(j.plan, "full_toolkit_1000")
        assertEquals(j.seats_purchased, 1)
        assertEquals(j.seats_allowance, 6)
      }
      if (em === "active@test.com") {
        assertEquals(j.plan, "core_cloud_workspace_500")
        assertEquals(j.seats_allowance, 2)
        assertEquals(typeof j.stripe_customer_id, "string")
      }
      if (em === "seatinvite@test.com") {
        assertEquals(j.plan, "full_toolkit_1000")
        assertEquals(j.seats_allowance, 6)
        assertEquals(j.stripe_customer_id, null)
        assertEquals(j.seat_type, "invite")
      }
    } else {
      assertEquals(Object.keys(j).sort().join(","), "account_status,email")
    }
  }
})

Deno.test("handleBillingRequest 401 on bad token", async () => {
  const mock = mockClient({})
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status", { email: "a@b.com", requested_at: new Date().toISOString(), nonce: "1" }, "Bearer wrong"),
    baseEnv(mock),
  )
  assertEquals(res.status, 401)
})

Deno.test("handleBillingRequest 400 invalid JSON", async () => {
  const mock = mockClient({})
  const req = new Request("https://x.test/functions/v1/billing-status", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: "{not-json",
  })
  const res = await handleBillingRequest(req, baseEnv(mock))
  assertEquals(res.status, 400)
})

Deno.test("handleBillingRequest 400 missing email", async () => {
  const mock = mockClient({})
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status", { requested_at: "x", nonce: "y" }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 400)
})

Deno.test("handleBillingRequest 404 unknown real email (RPC returns empty)", async () => {
  const mock = mockClient({ resolveAccessData: [] })
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status", {
      email: "nobody@example.com",
      requested_at: new Date().toISOString(),
      nonce: "n",
    }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 404)
  const j = JSON.parse(await res.text()) as Record<string, unknown>
  assertEquals(j, { email: "nobody@example.com", account_status: "none" })
})

Deno.test("handleBillingRequest 200 direct purchaser via RPC", async () => {
  const viewRow = {
    billing_email: "paid@example.com",
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_123",
    subscription_status: "active",
    cancel_at_period_end: false,
    current_period_end: "2030-01-15T12:00:00.000Z",
    notification_emails: ["ops@example.com"],
    plan: "pro_monthly",
    seats_purchased: 3,
    seats_allowance: 3,
    source_of_truth_at: "2030-01-01T00:00:00.000Z",
    seat_type: "purchaser",
  }
  const mock = mockClient({ resolveAccessData: [viewRow] })
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status", {
      email: "paid@example.com",
      requested_at: new Date().toISOString(),
      nonce: "n",
    }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 200)
  const j = JSON.parse(await res.text()) as Record<string, unknown>
  assertEquals(j.email, "paid@example.com")
  assertEquals(j.account_status, "active")
  assertEquals(j.plan, "pro_monthly")
  assertEquals(j.cancel_at_period_end, false)
  assertEquals(j.seats_purchased, 3)
  assertEquals(j.seats_allowance, 3)
  assertEquals(j.stripe_customer_id, "cus_123")
  assertEquals(j.notification_emails, ["ops@example.com"])
  assertEquals(typeof j.current_period_end, "string")
  assertEquals(typeof j.source_of_truth_at, "string")
  assertEquals(j.seat_type, "purchaser")
})

Deno.test("handleBillingRequest 200 seat invite via RPC (stripe_customer_id null)", async () => {
  const inviteRow = {
    billing_email: "invited@example.com",
    stripe_customer_id: null,
    stripe_subscription_id: "sub_purchaser_456",
    subscription_status: "active",
    cancel_at_period_end: false,
    current_period_end: "2030-06-01T12:00:00.000Z",
    notification_emails: [],
    plan: "full_toolkit_1000",
    seats_purchased: 1,
    seats_allowance: 6,
    source_of_truth_at: "2030-01-01T00:00:00.000Z",
    seat_type: "invite",
  }
  const mock = mockClient({ resolveAccessData: [inviteRow] })
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status", {
      email: "invited@example.com",
      requested_at: new Date().toISOString(),
      nonce: "n",
    }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 200)
  const j = JSON.parse(await res.text()) as Record<string, unknown>
  assertEquals(j.email, "invited@example.com")
  assertEquals(j.account_status, "active")
  assertEquals(j.plan, "full_toolkit_1000")
  assertEquals(j.stripe_customer_id, null)
  assertEquals(j.seat_type, "invite")
  assertEquals(j.seats_allowance, 6)
})

Deno.test("handleBillingRequest 429 when rate limited", async () => {
  const mock = mockClient({
    viewRow: null,
    rpcData: { count_after: 61, exceeded: true, retry_after_seconds: 44 },
  })
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status", {
      email: "any@example.com",
      requested_at: new Date().toISOString(),
      nonce: "n",
    }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 429)
  assertEquals(res.headers.get("Retry-After"), "44")
})

Deno.test("handleBillingRequest sandbox skips rate RPC", async () => {
  let rpcCalls = 0
  const inner = mockClient({ viewRow: null }) as unknown as {
    rpc: (a: string, b: unknown) => Promise<{ data: unknown; error: unknown }>
  }
  const mock = {
    ...inner,
    rpc(name: string, args: unknown) {
      rpcCalls++
      return Promise.resolve({ data: { count_after: 1, exceeded: false, retry_after_seconds: 0 }, error: null })
    },
  } as unknown as SupabaseClient

  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status?sandbox=1", {
      email: "active@test.com",
      requested_at: new Date().toISOString(),
      nonce: "n",
    }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 200)
  assertEquals(rpcCalls, 0)
})

Deno.test("handleBillingRequest sandbox unknown email 404", async () => {
  const mock = mockClient({})
  const res = await handleBillingRequest(
    jsonPost("https://x.test/functions/v1/billing-status?sandbox=1", {
      email: "noone@test.com",
      requested_at: new Date().toISOString(),
      nonce: "n",
    }, `Bearer ${secret}`),
    baseEnv(mock),
  )
  assertEquals(res.status, 404)
})
