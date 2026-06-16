import "dotenv/config";
import chalk from "chalk";

const { NEXT_PUBLIC_API_BASE, NEXT_PUBLIC_ALLOWED_ORIGIN } = process.env;

const SITEGROUND_BASE_URL = NEXT_PUBLIC_API_BASE || "https://bemdonna.com/donna";
const VERCEL_ORIGIN = NEXT_PUBLIC_ALLOWED_ORIGIN || "https://donna-interactive-grid.vercel.app";

let hasErrors = false;

async function check(description, condition, fix) {
  if (await condition()) {
    console.log(chalk.green(`✅ ${description}`));
  } else {
    console.error(chalk.red(`❌ ${description}`));
    if (fix) {
        console.log(chalk.yellow(`   ➡️  ${fix}`));
    }
    hasErrors = true;
  }
}

console.log(chalk.bold.underline("SiteGround Backend Connectivity Test\n"));
console.log(`Testing backend at: ${chalk.blue(SITEGROUND_BASE_URL)}`);
console.log(`Simulating requests from origin: ${chalk.blue(VERCEL_ORIGIN)}\n`);


// 1. Test API Endpoints
console.log(chalk.cyan.bold("1. Testing API Endpoint Reachability..."));

await check("'/api/inbox.php' is reachable", async () => {
    try {
        const res = await fetch(`${SITEGROUND_BASE_URL}/api/inbox.php`);
        // Expect 400 because no action is specified
        return res.status === 400;
    } catch {
        return false;
    }
}, "Ensure the inbox.php file is deployed and the URL is correct.");

await check("'/api/marketing.php' is reachable", async () => {
    try {
        const res = await fetch(`${SITEGROUND_BASE_URL}/api/marketing.php`);
        // Expect 400 because no action is specified
        return res.status === 400;
    } catch {
        return false;
    }
}, "Ensure the marketing.php file is deployed and the URL is correct.");


// 2. Test CORS Headers
console.log(chalk.cyan.bold("\n2. Testing CORS Configuration..."));

await check("CORS OPTIONS preflight for 'inbox.php' is handled correctly", async () => {
    try {
        const res = await fetch(`${SITEGROUND_BASE_URL}/api/inbox.php`, {
            method: 'OPTIONS',
            headers: {
                'Origin': VERCEL_ORIGIN,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type'
            }
        });
        const originHeader = res.headers.get('access-control-allow-origin');
        return res.status === 200 && (originHeader === VERCEL_ORIGIN || originHeader === '*');
    } catch {
        return false;
    }
}, `Check the CORSHelper in inbox.php and the ALLOWED_ORIGINS env var on SiteGround.`);

await check("CORS GET request for 'inbox.php' has correct headers", async () => {
    try {
        const res = await fetch(`${SITEGROUND_BASE_URL}/api/inbox.php`, {
            headers: { 'Origin': VERCEL_ORIGIN }
        });
        const originHeader = res.headers.get('access-control-allow-origin');
        return (originHeader === VERCEL_ORIGIN || originHeader === '*');
    } catch {
        return false;
    }
}, "The API is not returning the correct 'Access-Control-Allow-Origin' header for GET requests.");


// 3. Test a valid API action
console.log(chalk.cyan.bold("\n3. Testing a valid API action..."));

await check("'read_inbox' action returns an error (as expected without auth)", async () => {
    try {
        const res = await fetch(`${SITEGROUND_BASE_URL}/api/inbox.php?action=read_inbox`, {
            headers: { 'Origin': VERCEL_ORIGIN }
        });
        const json = await res.json();
        // This is expected to fail because GMAIL_REFRESH_TOKEN is not set in this test env
        // But a 500 error with a specific message proves the code is being executed.
        return res.status === 500 && json.error.includes("Failed to read inbox");
    } catch {
        return false;
    }
}, "The 'read_inbox' action did not execute as expected. Check the PHP code and logs on SiteGround.");


// Final Summary
console.log("\n" + chalk.bold.underline("Validation Summary"));
if (hasErrors) {
  console.error(chalk.red.bold("\nFound connectivity errors. Please review the logs above and check your SiteGround deployment."));
  process.exit(1);
} else {
  console.log(chalk.green.bold("\n✅ All connectivity checks passed!"));
  console.log(chalk.gray("   This script validates basic reachability and CORS setup. Ensure your SiteGround environment variables are correctly set for full functionality."));
}
