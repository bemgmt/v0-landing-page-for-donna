import "dotenv/config";
import chalk from "chalk";
import { WebSocket } from "ws";

const { VERCEL_URL, NEXT_PUBLIC_WEBSOCKET_URL, NEXT_PUBLIC_API_BASE } = process.env;

const VERCEL_PROD_URL = (process.env.VERCEL_URL && process.env.VERCEL_URL.startsWith('http')
  ? process.env.VERCEL_URL
  : (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://donna-interactive-grid.vercel.app'));
const RAILWAY_WS_URL = NEXT_PUBLIC_WEBSOCKET_URL || "wss://donna-interactive-production.up.railway.app/realtime";
const SITEGROUND_API_URL = NEXT_PUBLIC_API_BASE || "https://bemdonna.com/donna";

const services = [
  { name: "Vercel Frontend", url: VERCEL_PROD_URL, type: "http" },
  { name: "Railway WebSocket (HTTP Health)", url: RAILWAY_WS_URL.replace(/^wss:/, 'https:').replace(/\/realtime$/, '/health'), type: "http" },
  { name: "SiteGround Backend (PHP Health)", url: `${SITEGROUND_API_URL}/api/health.php`, type: "http" },
  { name: "Railway WebSocket (WS Connection)", url: RAILWAY_WS_URL, type: "ws" },
];

if (process.env.SUPABASE_URL) services.push({ name: 'Supabase API', url: process.env.SUPABASE_URL, type: 'http-postgrest' });

let hasErrors = false;

async function checkService(service) {
  const startTime = Date.now();
  let status = chalk.red("FAIL");
  let latency = "N/A";
  let details = "";

  try {
    if (service.type === "http" || service.type === "http-postgrest") {
      if (!service.url) throw new Error('URL not defined');
      const res = await fetch(service.url);
      latency = Date.now() - startTime;
      if (res.ok || (service.type === 'http-postgrest' && res.status === 401)) { // 401 is ok for Supabase without key
        status = chalk.green("OK");
      } else {
        hasErrors = true;
        details = `Status: ${res.status}`;
      }
    } else if (service.type === "ws") {
      await new Promise((resolve, reject) => {
        const origin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || VERCEL_PROD_URL;
        const ws = new WebSocket(service.url, { origin });
        ws.on('open', () => {
          latency = Date.now() - startTime;
          status = chalk.green("OK");
          ws.close();
          resolve();
        });
        ws.on('error', (err) => {
            hasErrors = true;
            details = err.message;
            reject(err);
        });
      });
    }
  } catch (error) {
    hasErrors = true;
    details = error.message;
  }

  console.log(
    `[${status}] ${service.name.padEnd(30)} | ` +
    `Latency: ${(latency + "ms").padEnd(10)} | ` +
    chalk.gray(service.url) +
    (details ? chalk.red(` | Details: ${details}`) : "")
  );
}

console.log(chalk.bold.underline("Comprehensive Production Health Check\n"));

await Promise.all(services.map(checkService));

// --- Final Summary ---
console.log("\n" + chalk.bold.underline("Health Check Summary"));
if (hasErrors) {
  console.error(chalk.red.bold("\n❌ One or more health checks failed. The system is unhealthy."));
  // In a real CI/CD pipeline, this would exit with a non-zero code to fail the job.
  process.exit(1);
} else {
  console.log(chalk.green.bold("\n✅ All services are healthy and operational."));
}
