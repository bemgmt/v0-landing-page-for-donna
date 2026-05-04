/**
 * One-time OAuth token generator for DONNA integrations.
 *
 * Usage:
 *   node scripts/generate-oauth-tokens.mjs gsc
 *   node scripts/generate-oauth-tokens.mjs flow
 *
 * Prerequisites:
 *   1. Add your OAuth client ID and secret to .env.local
 *   2. Run this script — it opens your browser for Google sign-in
 *   3. After authorizing, the refresh token is printed to your terminal
 *   4. Copy the refresh token into .env.local
 */

import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const REDIRECT_PORT = 3939
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`

// Parse .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local")
    const content = readFileSync(envPath, "utf-8")
    const vars = {}
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      vars[key] = val
    }
    return vars
  } catch {
    return {}
  }
}

const PROFILES = {
  gsc: {
    label: "Google Search Console (derek@bem.studio)",
    clientIdKey: "GSC_OAUTH_CLIENT_ID",
    clientSecretKey: "GSC_OAUTH_CLIENT_SECRET",
    tokenKey: "GSC_REFRESH_TOKEN",
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/bigquery",
    ],
  },
  flow: {
    label: "Google Flow (djtalbird@gmail.com)",
    clientIdKey: "GOOGLE_FLOW_OAUTH_CLIENT_ID",
    clientSecretKey: "GOOGLE_FLOW_OAUTH_CLIENT_SECRET",
    tokenKey: "GOOGLE_FLOW_REFRESH_TOKEN",
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
    ],
  },
}

async function main() {
  const profileName = process.argv[2]

  if (!profileName || !PROFILES[profileName]) {
    console.error(`\nUsage: node scripts/generate-oauth-tokens.mjs <profile>\n`)
    console.error(`Available profiles:`)
    for (const [key, p] of Object.entries(PROFILES)) {
      console.error(`  ${key}  — ${p.label}`)
    }
    process.exit(1)
  }

  const profile = PROFILES[profileName]
  const env = loadEnv()

  const clientId = env[profile.clientIdKey]
  const clientSecret = env[profile.clientSecretKey]

  if (!clientId || !clientSecret) {
    console.error(`\n❌ Missing credentials in .env.local:`)
    if (!clientId) console.error(`   ${profile.clientIdKey}=<your-client-id>`)
    if (!clientSecret) console.error(`   ${profile.clientSecretKey}=<your-client-secret>`)
    console.error(`\nAdd them to .env.local and try again.\n`)
    process.exit(1)
  }

  console.log(`\n🔐 OAuth Token Generator — ${profile.label}`)
  console.log(`   Client ID: ${clientId.slice(0, 20)}...`)
  console.log(`   Scopes: ${profile.scopes.join(", ")}`)

  // Build the consent URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", profile.scopes.join(" "))
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")

  // Start a local server to catch the callback
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`)

    if (url.pathname !== "/callback") {
      res.writeHead(404)
      res.end("Not found")
      return
    }

    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")

    if (error) {
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(`<h1>❌ Authorization denied</h1><p>${error}</p>`)
      console.error(`\n❌ Authorization denied: ${error}`)
      process.exit(1)
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" })
      res.end(`<h1>❌ No authorization code received</h1>`)
      return
    }

    // Exchange code for tokens
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      })

      const tokenData = await tokenRes.json()

      if (tokenData.error) {
        throw new Error(`${tokenData.error}: ${tokenData.error_description}`)
      }

      const refreshToken = tokenData.refresh_token

      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(`
        <html>
          <body style="font-family: system-ui; max-width: 600px; margin: 80px auto; text-align: center;">
            <h1>✅ Token Generated!</h1>
            <p>You can close this tab and return to your terminal.</p>
          </body>
        </html>
      `)

      console.log(`\n✅ Success! Add this to your .env.local:\n`)
      console.log(`${profile.tokenKey}=${refreshToken}`)
      console.log(`\n`)

      server.close()
      process.exit(0)
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html" })
      res.end(`<h1>❌ Token exchange failed</h1><pre>${err.message}</pre>`)
      console.error(`\n❌ Token exchange failed: ${err.message}`)
      process.exit(1)
    }
  })

  server.listen(REDIRECT_PORT, () => {
    console.log(`\n📌 Listening on http://localhost:${REDIRECT_PORT}/callback`)
    console.log(`\n🌐 Opening your browser...\n`)

    // Open the browser
    const url = authUrl.toString()
    const openCmd =
      process.platform === "win32" ? `start "${url}"` :
      process.platform === "darwin" ? `open "${url}"` :
      `xdg-open "${url}"`

    import("node:child_process").then(({ exec }) => {
      exec(openCmd, (err) => {
        if (err) {
          console.log(`\n⚠️  Could not open browser automatically.`)
          console.log(`   Open this URL manually:\n`)
          console.log(`   ${url}\n`)
        }
      })
    })
  })
}

main()
