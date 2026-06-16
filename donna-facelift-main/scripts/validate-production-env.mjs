import "dotenv/config";
import chalk from "chalk";

const {
  // Vercel Frontend
  NEXT_PUBLIC_WEBSOCKET_URL,
  NEXT_PUBLIC_API_BASE,
  NEXT_PUBLIC_USE_WS_PROXY,
  NEXT_PUBLIC_ALLOWED_ORIGIN,
  
  // Google OAuth
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,

  // SiteGround Backend
  MARKETING_API_BASE,

  NODE_ENV
} = process.env;

const EXPECTED_PROD_WS_URL = "wss://donna-interactive-production.up.railway.app/realtime";
const EXPECTED_PROD_API_BASE = "https://bemdonna.com/donna";
const EXPECTED_PROD_REDIRECT_URI = "https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback";
const EXPECTED_PROD_ALLOWED_ORIGIN = "https://donna-interactive-grid.vercel.app";

let hasErrors = false;

function check(description, condition, fix) {
  if (condition) {
    console.log(chalk.green(`✅ ${description}`));
  } else {
    console.error(chalk.red(`❌ ${description}`));
    console.log(chalk.yellow(`   ➡️  ${fix}`));
    hasErrors = true;
  }
}

console.log(chalk.bold.underline("Production Environment Validator\n"));

// Section 1: Vercel Frontend Environment
console.log(chalk.cyan.bold("1. Vercel Frontend Configuration"));
check(
  "NEXT_PUBLIC_WEBSOCKET_URL is set",
  !!NEXT_PUBLIC_WEBSOCKET_URL,
  "Set NEXT_PUBLIC_WEBSOCKET_URL to your Railway WebSocket server URL."
);
if (NEXT_PUBLIC_WEBSOCKET_URL) {
    check(
        "NEXT_PUBLIC_WEBSOCKET_URL is correct for production",
        NEXT_PUBLIC_WEBSOCKET_URL === EXPECTED_PROD_WS_URL,
        `Expected '${EXPECTED_PROD_WS_URL}', but found '${NEXT_PUBLIC_WEBSOCKET_URL}'.`
    );
}

check(
  "NEXT_PUBLIC_API_BASE is set",
  !!NEXT_PUBLIC_API_BASE,
  "Set NEXT_PUBLIC_API_BASE to your SiteGround PHP backend URL."
);
if (NEXT_PUBLIC_API_BASE) {
    check(
        "NEXT_PUBLIC_API_BASE is correct for production",
        NEXT_PUBLIC_API_BASE === EXPECTED_PROD_API_BASE,
        `Expected '${EXPECTED_PROD_API_BASE}', but found '${NEXT_PUBLIC_API_BASE}'.`
    );
}

check(
    "NEXT_PUBLIC_USE_WS_PROXY is set to 'true'",
    NEXT_PUBLIC_USE_WS_PROXY === 'true',
    "Set NEXT_PUBLIC_USE_WS_PROXY to 'true' to enable the WebSocket proxy hook."
);

check(
    "NEXT_PUBLIC_ALLOWED_ORIGIN is set",
    !!NEXT_PUBLIC_ALLOWED_ORIGIN,
    "Set NEXT_PUBLIC_ALLOWED_ORIGIN for CORS configuration on Vercel."
);
if (NEXT_PUBLIC_ALLOWED_ORIGIN) {
    check(
        "NEXT_PUBLIC_ALLOWED_ORIGIN is correct for production",
        NEXT_PUBLIC_ALLOWED_ORIGIN === EXPECTED_PROD_ALLOWED_ORIGIN,
        `Expected '${EXPECTED_PROD_ALLOWED_ORIGIN}', but found '${NEXT_PUBLIC_ALLOWED_ORIGIN}'.`
    );
}


// Section 2: Google OAuth Configuration
console.log(chalk.cyan.bold("\n2. Google OAuth Configuration"));
check("GOOGLE_CLIENT_ID is set", !!GOOGLE_CLIENT_ID, "Set GOOGLE_CLIENT_ID from your Google Cloud Console.");
check("GOOGLE_CLIENT_SECRET is set", !!GOOGLE_CLIENT_SECRET, "Set GOOGLE_CLIENT_SECRET from your Google Cloud Console.");
check("GOOGLE_REDIRECT_URI is set", !!GOOGLE_REDIRECT_URI, "Set GOOGLE_REDIRECT_URI for the OAuth callback.");
if (GOOGLE_REDIRECT_URI) {
    check(
        "GOOGLE_REDIRECT_URI is correct for production",
        GOOGLE_REDIRECT_URI === EXPECTED_PROD_REDIRECT_URI,
        `Expected '${EXPECTED_PROD_REDIRECT_URI}', but found '${GOOGLE_REDIRECT_URI}'.`
    );
}

// Section 3: Authentication (Demo mode - cookie-based via /sign-in)
console.log(chalk.cyan.bold("\n3. Authentication Configuration"));
console.log(chalk.gray("   Using demo mode: cookie-based auth via /sign-in (DONNA/DONNA123)"));

// Section 4: Connectivity Tests
console.log(chalk.cyan.bold("\n4. Connectivity Tests"));

async function testUrl(description, url) {
    try {
        const response = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'env-validator-script' } });
        check(
            `${description} is reachable (status: ${response.status})`,
            response.ok || response.status === 404 || response.status === 405, // OK, Not Found, or Method Not Allowed are acceptable for a simple check
            `Failed to connect to ${url}. Status: ${response.status}. Check firewall or URL.`
        );
    } catch (error) {
        check(
            `${description} is reachable`,
            false,
            `Failed to connect to ${url}. Error: ${error.message}`
        );
    }
}

if (NEXT_PUBLIC_API_BASE) {
    await testUrl("SiteGround Backend (API Base)", `${NEXT_PUBLIC_API_BASE}/health.php`);
}
if (NEXT_PUBLIC_WEBSOCKET_URL) {
    const httpUrl = NEXT_PUBLIC_WEBSOCKET_URL.replace(/^wss:/, 'https:').replace(/\/realtime$/, '/health');
    await testUrl("Railway WebSocket Server (Health Check)", httpUrl);
}


// Final Summary
console.log("\n" + chalk.bold.underline("Validation Summary"));
if (hasErrors) {
  console.error(chalk.red.bold("\nFound configuration errors for production environment. Please review and fix them."));
  process.exit(1);
} else {
  console.log(chalk.green.bold("\n✅ All production environment checks passed!"));
  console.log(chalk.gray("   This script validates the presence and format of key variables. Ensure the actual values (like API keys and secrets) are correct in your Vercel project."));
}

