import "dotenv/config";
import chalk from "chalk";
import { WebSocket } from "ws";

/**
 * Railway WebSocket Health Monitor
 *
 * Environment variables:
 * - NEXT_PUBLIC_WEBSOCKET_URL     (required) WebSocket endpoint, e.g. wss://<host>/realtime
 * - CHECK_INTERVAL_MS             (optional) Interval between checks in ms, default 60000
 * - NEXT_PUBLIC_ALLOWED_ORIGIN    (optional) Origin header for WS, defaults to Vercel app URL
 * - ALLOWED_ORIGINS               (optional) Server-side allowed origins (for summary only)
 * - RAILWAY_TOKEN                 (optional) Token for Railway GraphQL API (logs ingestion)
 * - RAILWAY_PROJECT_ID            (optional) Railway project id
 * - RAILWAY_SERVICE_ID            (optional) Railway service id (WS service)
 * - SLACK_WEBHOOK_URL             (optional) Slack webhook to send alerts on threshold breaches
 */

const RAILWAY_WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://donna-interactive-production.up.railway.app/realtime";
const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS || "60000", 10);
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const RAILWAY_PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const RAILWAY_SERVICE_ID = process.env.RAILWAY_SERVICE_ID;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SERVER_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "(unknown)";
const ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'https://donna-interactive-grid.vercel.app';

let successfulChecks = 0;
let failedChecks = 0;
let totalLatency = 0;
let maxLatency = 0;
const errorTimestamps = [] as number[]; // unix ms timestamps of failures
let lastSeenIso = null as string | null; // last processed Railway log timestamp (ISO)
const logErrorWindows = new Map(); // Map<string, number[]> per-category timestamps
const lastAlertAtByCategory = new Map(); // cooldown tracking per category

// Initialize known categories
['timeout', 'invalid_origin', 'rate_limit', 'tls', 'other'].forEach((k) => {
  logErrorWindows.set(k, []);
});

console.log(chalk.bold.underline("Railway WebSocket Monitoring Dashboard\n"));
console.log(`Monitoring WebSocket URL: ${chalk.blue(RAILWAY_WS_URL)}`);
console.log(`Check interval: ${chalk.blue(`${CHECK_INTERVAL_MS} ms`)} (~${(CHECK_INTERVAL_MS/1000).toFixed(0)}s)`);
console.log(`WS Origin header: ${chalk.blue(ORIGIN)}`);
console.log(`Server ALLOWED_ORIGINS: ${chalk.blue(SERVER_ALLOWED_ORIGINS)}`);
console.log(`Railway logs configured: ${chalk.blue(!!(RAILWAY_TOKEN && RAILWAY_PROJECT_ID && RAILWAY_SERVICE_ID))}`);
console.log(`Slack alerting configured: ${chalk.blue(!!SLACK_WEBHOOK_URL)}\n`);

function windowedErrorCount(windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  while (errorTimestamps.length > 0 && errorTimestamps[0] < cutoff) {
    errorTimestamps.shift();
  }
  return errorTimestamps.length;
}

function categorizeError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('timed out') || m.includes('timeout')) return 'timeout';
  if (m.includes('origin') || m.includes('forbidden')) return 'invalid_origin';
  if (m.includes('rate') && m.includes('limit')) return 'rate_limit';
  if (m.includes('unable to verify') || m.includes('ssl')) return 'tls';
  return 'other';
}

async function sendSlackAlert(text: string) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch {}
}

async function fetchRailwayLogs(limit = 100) {
  if (!RAILWAY_TOKEN || !RAILWAY_PROJECT_ID || !RAILWAY_SERVICE_ID) return [] as any[];
  const url = `https://backboard.railway.app/graphql/v2`; // Public Railway GraphQL endpoint
  const query = `
    query FetchLogs($projectId: String!, $serviceId: String!, $limit: Int!) {
      logs(projectId: $projectId, serviceId: $serviceId, limit: $limit) {
        message
        timestamp
        level
      }
    }
  `;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({ query, variables: { projectId: RAILWAY_PROJECT_ID, serviceId: RAILWAY_SERVICE_ID, limit } })
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.logs || [];
  } catch {
    return [];
  }
}

async function runHealthCheck() {
  const startTime = Date.now();
  
  try {
    // 1. HTTP Health Check
    const healthUrl = RAILWAY_WS_URL.replace(/^wss:/, 'https:').replace(/\/realtime$/, '/health');
    const httpRes = await fetch(healthUrl);
    const latency = Date.now() - startTime;

    if (!httpRes.ok) {
      throw new Error(`HTTP health check failed with status ${httpRes.status}`);
    }
    const data = await httpRes.json();
    if (data.status !== 'ok') {
      throw new Error(`Health check endpoint returned non-ok status: ${data.status}`);
    }

    // 2. WebSocket Connection Check
    await new Promise((resolve, reject) => {
        const ws = new WebSocket(RAILWAY_WS_URL, { origin: ORIGIN });
        ws.on('open', () => {
            ws.close();
            resolve();
        });
        ws.on('error', (err) => reject(new Error(`WebSocket connection failed: ${err.message}`)));
    });

    // 3. Logs polling (if configured)
    if (RAILWAY_TOKEN && RAILWAY_PROJECT_ID && RAILWAY_SERVICE_ID) {
      try {
        const logs = await fetchRailwayLogs(200);
        if (Array.isArray(logs) && logs.length > 0) {
          // Filter new logs based on timestamp
          const newLogs = logs
            .filter(l => l?.timestamp)
            .filter(l => !lastSeenIso || (l.timestamp > lastSeenIso));
          if (newLogs.length > 0) {
            // Update lastSeenIso to newest timestamp
            const newest = newLogs.reduce((acc, l) => (l.timestamp > acc ? l.timestamp : acc), lastSeenIso || newLogs[0].timestamp);
            lastSeenIso = newest;

            // Categorize and record timestamps
            const now = Date.now();
            for (const entry of newLogs) {
              const category = categorizeError(entry.message || '');
              const arr = logErrorWindows.get(category) || [];
              arr.push(now);
              logErrorWindows.set(category, arr);
            }

            // Prune windows
            pruneLogWindows();

            // Evaluate alerts based on logs
            evaluateLogAlerts();
          }
        }
      } catch (e) {
        // Ignore log ingestion errors; do not crash monitor
      }
    }

    // If all checks passed
    successfulChecks++;
    totalLatency += latency;
    if (latency > maxLatency) maxLatency = latency;

    console.log(
      chalk.green(`[${new Date().toISOString()}] ✅ HEALTHY `) +
      `| HTTP Status: ${httpRes.status} | Latency: ${latency}ms`
    );

  } catch (error) {
    failedChecks++;
    errorTimestamps.push(Date.now());
    const category = categorizeError((error as Error).message || '');
    console.error(
      chalk.red(`[${new Date().toISOString()}] ❌ UNHEALTHY `) +
      `| Error: ${(error as Error).message} | Category: ${category}`
    );
    const err15 = windowedErrorCount(15 * 60 * 1000);
    const err60 = windowedErrorCount(60 * 60 * 1000);
    if (failedChecks === 3 || err15 >= 5 || err60 >= 10) {
      sendSlackAlert(`Railway WS Monitor alert: ${failedChecks} total failures. Last error category: ${category}. 15m=${err15}, 60m=${err60}`);
    }
  } finally {
    printStats();
  }
}

function printStats() {
    const totalChecks = successfulChecks + failedChecks;
    const successRate = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
    const avgLatency = successfulChecks > 0 ? (totalLatency / successfulChecks).toFixed(2) : 0;
    const err15 = windowedErrorCount(15 * 60 * 1000);
    const err60 = windowedErrorCount(60 * 60 * 1000);

    // Build compact logs summary if logs are enabled
    let logsSummary = '';
    if (RAILWAY_TOKEN && RAILWAY_PROJECT_ID && RAILWAY_SERVICE_ID) {
      const counts15 = getLogCounts(15);
      const counts60 = getLogCounts(60);
      const fmt = (obj) => `invalid_origin=${obj.invalid_origin}|timeout=${obj.timeout}|rate_limit=${obj.rate_limit}|tls=${obj.tls}|other=${obj.other}`;
      logsSummary = ` | Logs (15m): ${fmt(counts15)} | (60m): ${fmt(counts60)}`;
    }

    console.log(
        chalk.yellow('-----------------------------------------------------------------')
    );
    console.log(
        `Success Rate: ${chalk.bold(successRate.toFixed(2) + '%')} (${successfulChecks}/${totalChecks}) | ` +
        `Avg Latency: ${chalk.bold(avgLatency + 'ms')} | ` +
        `Max Latency: ${chalk.bold(maxLatency + 'ms')} | ` +
        `Errors: ${chalk.bold(err15)} (15m) / ${chalk.bold(err60)} (60m)` + logsSummary
    );
    console.log(
        chalk.yellow('-----------------------------------------------------------------')
    );
}

function pruneLogWindows() {
  const now = Date.now();
  const pruneOlderThan = (arr, ms) => {
    const cutoff = now - ms;
    while (arr.length && arr[0] < cutoff) arr.shift();
  };
  for (const [, arr] of logErrorWindows) {
    // arrays hold timestamps; keep them sorted by pushing current now
    // prune 60m window (keeps both 15m and 60m accurate)
    pruneOlderThan(arr, 60 * 60 * 1000);
  }
}

function getLogCounts(windowMinutes) {
  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();
  const cutoff = now - windowMs;
  const countInWindow = (arr) => arr.filter(ts => ts >= cutoff).length;
  return {
    timeout: countInWindow(logErrorWindows.get('timeout') || []),
    invalid_origin: countInWindow(logErrorWindows.get('invalid_origin') || []),
    rate_limit: countInWindow(logErrorWindows.get('rate_limit') || []),
    tls: countInWindow(logErrorWindows.get('tls') || []),
    other: countInWindow(logErrorWindows.get('other') || []),
  };
}

function evaluateLogAlerts() {
  if (!SLACK_WEBHOOK_URL) return;
  const counts15 = getLogCounts(15);
  const counts60 = getLogCounts(60);
  const categories = ['invalid_origin', 'timeout', 'rate_limit', 'tls', 'other'];
  const now = Date.now();
  const cooldownMs = 10 * 60 * 1000; // 10 minutes per-category cooldown
  const alerts = [];

  for (const cat of categories) {
    const c15 = counts15[cat];
    const c60 = counts60[cat];
    const crossed = (c15 >= 5) || (c60 >= 10);
    if (!crossed) continue;
    const last = lastAlertAtByCategory.get(cat) || 0;
    if (now - last < cooldownMs) continue; // suppress rapid repeats
    lastAlertAtByCategory.set(cat, now);
    alerts.push(`${cat}=${c15} (15m), ${c60} (60m)`);
  }

  if (alerts.length > 0) {
    const msg = `Railway WS Logs thresholds: ${alerts.join('; ')}`;
    sendSlackAlert(msg);
  }
}

// Run the first check immediately, then start the interval
runHealthCheck();
setInterval(runHealthCheck, CHECK_INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down monitor...');
    process.exit(0);
});
