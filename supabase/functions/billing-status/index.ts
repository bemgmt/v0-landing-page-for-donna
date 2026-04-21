import { handleBillingRequest, type BillingEnv } from "./handler.ts"

function readEnv(): BillingEnv | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const billingSecret = Deno.env.get("DONNA_BILLING_TOKEN") ?? ""
  if (!supabaseUrl || !serviceRoleKey || !billingSecret) return null
  return { supabaseUrl, serviceRoleKey, billingSecret }
}

Deno.serve(async (req) => {
  const env = readEnv()
  if (!env) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  }
  return handleBillingRequest(req, env)
})
