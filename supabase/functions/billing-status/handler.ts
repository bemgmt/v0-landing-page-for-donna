import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type BillingEnv = {
  supabaseUrl: string
  serviceRoleKey: string
  billingSecret: string
  /** Test-only: bypasses createClient when set */
  _testSupabase?: SupabaseClient
}

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
} as const

export function extractBearer(authorization: string | null): string | null {
  if (!authorization) return null
  const m = /^Bearer\s+(\S+)\s*$/i.exec(authorization.trim())
  return m?.[1] ?? null
}

export async function sha256HexUtf8(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Constant-time comparison of two secrets via SHA-256 digests (fixed length). */
export async function tokensMatchConstantTime(a: string, b: string): Promise<boolean> {
  const ha = await sha256HexUtf8(a)
  const hb = await sha256HexUtf8(b)
  const ua = new TextEncoder().encode(ha)
  const ub = new TextEncoder().encode(hb)
  if (ua.length !== ub.length) return false
  let diff = 0
  for (let i = 0; i < ua.length; i++) diff |= ua[i]! ^ ub[i]!
  return diff === 0
}

export function mapAccountStatus(raw: string): "active" | "trialing" | "past_due" | "canceled" {
  switch (raw) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
    case "unpaid":
      return "past_due"
    case "canceled":
    case "incomplete_expired":
      return "canceled"
    default:
      return "canceled"
  }
}

export function clientIpFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first.slice(0, 256)
  }
  const cf = req.headers.get("cf-connecting-ip")?.trim()
  if (cf) return cf.slice(0, 256)
  const xr = req.headers.get("x-real-ip")?.trim()
  if (xr) return xr.slice(0, 256)
  return "unknown"
}

export type BillingBody = {
  email: string
  requested_at: string
  nonce: string
}

export function parseBillingBody(json: unknown): { ok: true; body: BillingBody } | { ok: false; status: 400 } {
  if (json === null || typeof json !== "object") return { ok: false, status: 400 }
  const o = json as Record<string, unknown>
  const email = o.email
  if (email === undefined || email === null) return { ok: false, status: 400 }
  if (typeof email !== "string" || email.trim().length === 0) return { ok: false, status: 400 }
  const requested_at = typeof o.requested_at === "string" ? o.requested_at : ""
  const nonce = typeof o.nonce === "string" ? o.nonce : ""
  return {
    ok: true,
    body: {
      email: email.trim().toLowerCase(),
      requested_at,
      nonce,
    },
  }
}

function isoAddMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

export function sandboxResponseForEmail(email: string): Response | null {
  const e = email.trim().toLowerCase()
  const base = (status: string, plan: string, periodEndIso: string, seats: number) => {
    const body = {
      email: e,
      account_status: status,
      plan,
      current_period_end: periodEndIso,
      cancel_at_period_end: false,
      seats_purchased: seats,
      stripe_customer_id: `cus_sandbox_${e.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}`,
      notification_emails: [] as string[],
      source_of_truth_at: new Date().toISOString(),
    }
    return new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS })
  }

  const d = 86400000
  if (e === "active@test.com") return base("active", "pro_monthly", isoAddMs(30 * d), 1)
  if (e === "trial@test.com") return base("trialing", "pro_monthly", isoAddMs(7 * d), 1)
  if (e === "pastdue@test.com") return base("past_due", "pro_monthly", isoAddMs(-2 * d), 1)
  if (e === "canceled@test.com") return base("canceled", "pro_monthly", isoAddMs(-60 * d), 1)
  if (e === "team@test.com") return base("active", "team_annual", isoAddMs(300 * d), 5)
  if (e === "unknown@test.com") {
    return new Response(JSON.stringify({ email: e, account_status: "none" }), {
      status: 404,
      headers: JSON_HEADERS,
    })
  }
  return null
}

function normalizeNotificationEmails(v: unknown): string[] {
  if (v === null || v === undefined) return []
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
  return []
}

type BillingViewRow = {
  billing_email: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string
  cancel_at_period_end: boolean
  current_period_end: string | null
  notification_emails: unknown
  plan: string
  seats_purchased: number
  source_of_truth_at: string
}

export function rowToSuccessResponse(row: BillingViewRow, email: string): Response {
  const account_status = mapAccountStatus(row.subscription_status)
  const current_period_end =
    row.current_period_end && row.current_period_end.length > 0
      ? new Date(row.current_period_end).toISOString()
      : new Date().toISOString()

  const body = {
    email,
    account_status,
    plan: row.plan ?? "",
    current_period_end,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    seats_purchased: Number(row.seats_purchased) || 1,
    stripe_customer_id: row.stripe_customer_id ?? "",
    notification_emails: normalizeNotificationEmails(row.notification_emails),
    source_of_truth_at: new Date(row.source_of_truth_at).toISOString(),
  }
  return new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS })
}

async function logAuthFailure(supabase: SupabaseClient, req: Request): Promise<void> {
  const ip = clientIpFromRequest(req)
  try {
    const { error } = await supabase.from("billing_auth_failures").insert({
      client_ip: ip,
      path: "billing-status",
    })
    void error
  } catch {
    /* never block 401 on audit failure */
  }
}

type RpcRateResult = {
  count_after: number
  exceeded: boolean
  retry_after_seconds: number
}

async function consumeRateLimit(
  supabase: SupabaseClient,
  tokenFingerprint: string,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const { data, error } = await supabase.rpc("billing_s2s_touch_and_check", {
    p_token_fingerprint: tokenFingerprint,
  })
  if (error) {
    return { ok: false, retryAfter: 60 }
  }
  const row = (typeof data === "string" ? JSON.parse(data) : data) as RpcRateResult | null
  if (!row || typeof row !== "object") return { ok: false, retryAfter: 60 }
  const exceeded = Boolean(row.exceeded)
  const retryAfter = Number(row.retry_after_seconds) || 60
  if (exceeded) return { ok: false, retryAfter }
  return { ok: true }
}

export async function handleBillingRequest(req: Request, env: BillingEnv): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    })
  }

  const url = new URL(req.url)
  const sandbox = url.searchParams.get("sandbox") === "1"

  const supabase = env._testSupabase ??
    createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

  const bearer = extractBearer(req.headers.get("authorization"))
  const secret = env.billingSecret
  if (!secret || !bearer || !(await tokensMatchConstantTime(bearer, secret))) {
    await logAuthFailure(supabase, req)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    })
  }

  let parsedJson: unknown
  try {
    parsedJson = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: JSON_HEADERS,
    })
  }

  const parsed = parseBillingBody(parsedJson)
  if (!parsed.ok) {
    return new Response(JSON.stringify({ error: "Missing or invalid email" }), {
      status: 400,
      headers: JSON_HEADERS,
    })
  }
  const { email } = parsed.body

  if (sandbox) {
    const sand = sandboxResponseForEmail(email)
    if (sand) return sand
    return new Response(JSON.stringify({ email, account_status: "none" }), {
      status: 404,
      headers: JSON_HEADERS,
    })
  }

  const fp = await sha256HexUtf8(secret)
  const rate = await consumeRateLimit(supabase, fp)
  if (!rate.ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        ...JSON_HEADERS,
        "Retry-After": String(rate.retryAfter),
      },
    })
  }

  const { data, error } = await supabase
    .from("billing_status_view")
    .select(
      "billing_email,stripe_customer_id,stripe_subscription_id,subscription_status,cancel_at_period_end,current_period_end,notification_emails,plan,seats_purchased,source_of_truth_at",
    )
    .eq("billing_email", email)
    .order("source_of_truth_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return new Response(JSON.stringify({ error: "Lookup failed" }), {
      status: 500,
      headers: JSON_HEADERS,
    })
  }

  if (!data) {
    return new Response(JSON.stringify({ email, account_status: "none" }), {
      status: 404,
      headers: JSON_HEADERS,
    })
  }

  return rowToSuccessResponse(data as BillingViewRow, email)
}
