import "dotenv/config";
import chalk from "chalk";

if (process.env.CONFIRM_PROD_TESTS !== '1') {
  console.error('Refusing to run without CONFIRM_PROD_TESTS=1');
  process.exit(1);
}

const SITEGROUND_API_URL = process.env.NEXT_PUBLIC_API_BASE || "https://bemdonna.com/donna";
const VERCEL_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || "https://donna-interactive-grid.vercel.app";
const API_SECRET = process.env.API_SECRET; // If your PHP backend requires this, ensure it's set

if (!API_SECRET) {
    console.warn(chalk.yellow("Warning: API_SECRET is not set. Some tests may be skipped."));
}

let hasErrors = false;

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

async function post(action, body) {
    const endpointBase = `${SITEGROUND_API_URL}/api/inbox.php`;
    const url = `${endpointBase}?action=${action}`;
    const headers = {
            'Origin': VERCEL_ORIGIN,
            'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (API_SECRET) headers['X-Api-Secret'] = API_SECRET;
    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: new URLSearchParams(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API call failed with status ${res.status}: ${text}`);
    }
    return res.json();
}

console.log(chalk.bold.underline("Marketing Email System Test Suite\n"));

await test("Can read the inbox", async () => {
    const data = await post('read_inbox', {});
    if (!data.success || !Array.isArray(data.data.threads)) {
        throw new Error("API response for 'read_inbox' was not successful or data format is incorrect.");
    }
});

await test("Can send a new email", async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const data = await post('send_email', {
        to: testEmail,
        subject: 'Test Email from Integration Suite',
        body: 'This is a test email.'
    });
    if (!data.success || data.data.status !== 'sent') {
        throw new Error("API response for 'send_email' was not successful.");
    }
});

await test("AI draft reply generates a draft", async () => {
    let inbox = await post('read_inbox', {});
    if (!inbox.data.threads?.length) {
      const self = process.env.MARKETING_TEST_TO || process.env.GMAIL_TEST_USER;
      if (!self) return console.warn('Skipping draft test; no inbox threads and no seed recipient configured.');
      await post('send_email', { to: self, subject: `[DONNA-INTEGRATION-TEST] Seed Thread ${Date.now()}`, body: 'Seed' });
      await new Promise(r => setTimeout(r, 5000));
      inbox = await post('read_inbox', {});
      if (!inbox.data.threads?.length) throw new Error('Inbox still empty after seeding.');
    }
    const firstThread = inbox.data.threads[0];

    const data = await post('draft_ai_reply', {
        threadId: firstThread.id,
        goal: 'Acknowledge receipt and say we will look into it.',
        full_name: 'Donna Test Suite'
    });

    if (!data.success || !data.data.draft || data.data.draft.length < 10) {
        throw new Error("AI draft reply did not generate a valid draft.");
    }
});


// --- Final Summary ---
console.log("\n" + chalk.bold.underline("Test Summary"));
if (hasErrors) {
  console.error(chalk.red.bold("\nMarketing email system tests failed. Please review the logs."));
  process.exit(1);
} else {
  console.log(chalk.green.bold("\n✅ All marketing email system checks passed!"));
  console.log(chalk.gray("   Note: This script assumes the SiteGround backend has a valid GMAIL_REFRESH_TOKEN and OPENAI_API_KEY configured."));
}
