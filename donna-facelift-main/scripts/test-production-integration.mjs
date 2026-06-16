import "dotenv/config";
import chalk from "chalk";
import { WebSocket } from "ws";

if (process.env.CONFIRM_PROD_TESTS !== '1') {
  console.error('Refusing to run without CONFIRM_PROD_TESTS=1');
  process.exit(1);
}

const {
  NEXT_PUBLIC_WEBSOCKET_URL,
  NEXT_PUBLIC_API_BASE,
  GOOGLE_CLIENT_ID,
  VERCEL_URL, // Vercel provides this
} = process.env;

const VERCEL_PROD_URL = (VERCEL_URL && VERCEL_URL.startsWith('http') ? VERCEL_URL : (VERCEL_URL ? 'https://' + VERCEL_URL : 'https://donna-interactive-grid.vercel.app'));
const RAILWAY_WS_URL = NEXT_PUBLIC_WEBSOCKET_URL || "wss://donna-interactive-production.up.railway.app/realtime";
const SITEGROUND_API_URL = NEXT_PUBLIC_API_BASE || "https://bemdonna.com/donna";

let hasErrors = false;

// A simple test runner
async function test(description, testFn) {
  try {
    await testFn();
    console.log(chalk.green(`✅ PASS: ${description}`));
  } catch (error) {
    console.error(chalk.red(`❌ FAIL: ${description}`));
    console.error(chalk.gray(`   ${error.stack}
`));
    hasErrors = true;
  }
}

console.log(chalk.bold.underline("Production Integration Test Suite\n"));
await test("Gmail API routes respond with expected statuses", async () => {
  // Unauthenticated should be 401
  const unauth = await fetch(`${VERCEL_PROD_URL}/api/gmail/messages?maxResults=5`, { redirect: 'manual' });
  if (unauth.status !== 401) throw new Error(`Expected 401 for unauthenticated messages, got ${unauth.status}`);

  // Draft reply should validate payload and return 400 without required fields
  const badDraft = await fetch(`${VERCEL_PROD_URL}/api/gmail/draft-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { id: 'x' }, goal: '' })
  });
  if (![400, 401].includes(badDraft.status)) throw new Error(`Expected 400/401 for bad draft payload, got ${badDraft.status}`);
});

// --- Test Suite ---

await test("Vercel Frontend is available", async () => {
  const res = await fetch(VERCEL_PROD_URL);
  if (!res.ok) throw new Error(`Vercel frontend returned status ${res.status}`);
});

await test("SiteGround Backend is available", async () => {
  const res = await fetch(`${SITEGROUND_API_URL}/api/health.php`);
  if (!res.ok) throw new Error(`SiteGround health check returned status ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(`SiteGround health check returned non-ok status: ${data.status}`);
});

await test("Railway WebSocket Server is available", async () => {
    const healthUrl = RAILWAY_WS_URL.replace(/^wss:/, 'https:').replace(/\/realtime$/, '/health');
    const res = await fetch(healthUrl);
    if (!res.ok) throw new Error(`Railway health check returned status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Railway health check returned non-ok status: ${data.status}`);
});

await test("WebSocket connects successfully from a Node.js client", () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(RAILWAY_WS_URL, {
      origin: VERCEL_PROD_URL,
    });

    ws.on('open', () => {
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      reject(new Error(`WebSocket connection failed: ${err.message}`));
    });
  });
});

await test("WebSocket can exchange a health/ping message", () => new Promise((resolve, reject) => {
  const ws = new WebSocket(RAILWAY_WS_URL, { origin: VERCEL_PROD_URL });
  const timer = setTimeout(() => reject(new Error('No response to ping within 5s')), 5000);
  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
  });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(String(data));
      if (msg?.type === 'pong' || msg?.type === 'health' || msg?.ok === true) {
        clearTimeout(timer);
        ws.close();
        resolve(null);
      }
    } catch {}
  });
  ws.on('error', (err) => reject(err));
}));

await test("Gmail OAuth start route generates a valid auth URL", async () => {
    const res = await fetch(`${VERCEL_PROD_URL}/api/gmail/oauth/start`, { redirect: 'manual' });
    if (![301,302,303,307,308].includes(res.status)) throw new Error(`Expected redirect, got ${res.status}`);
    const location = res.headers.get('location') || '';
    if (!location.startsWith('https://accounts.google.com/o/oauth2/v2/auth')) throw new Error(`Unexpected redirect: ${location}`);
});

await test("Marketing API endpoint rejects requests with invalid origin", async () => {
    const res = await fetch(`${SITEGROUND_API_URL}/api/inbox.php`, {
        headers: { 'Origin': 'https://evil.com' }
    });
    const aco = res.headers.get('access-control-allow-origin');
    if (aco && aco !== 'null') {
      throw new Error(`Expected no ACAO for invalid origin, got: ${aco}`);
    }
});

await test("Marketing API endpoint accepts requests with valid origin", async () => {
    const res = await fetch(`${SITEGROUND_API_URL}/api/inbox.php`, {
        headers: { 'Origin': VERCEL_PROD_URL }
    });
    const aco = res.headers.get('access-control-allow-origin');
    if (aco !== VERCEL_PROD_URL && aco !== '*') {
      throw new Error(`Expected ACAO to allow ${VERCEL_PROD_URL}, got: ${aco}`);
    }
    // Optionally still expect a 400 due to missing action, but don’t couple CORS to status
});


// --- Final Summary ---
console.log("\n" + chalk.bold.underline("Test Summary"));
if (hasErrors) {
  console.error(chalk.red.bold("\nIntegration tests failed. Please review the logs above."));
  process.exit(1);
} else {
  console.log(chalk.green.bold("\n✅ All basic integration checks passed!"));
  console.log(chalk.gray("   Note: This script covers basic connectivity and configuration. Full E2E tests for OAuth and real-time messaging require browser automation (e.g., Playwright)."));
}
