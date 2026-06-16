import { test, expect } from '@playwright/test';
import 'dotenv/config';

if (process.env.CONFIRM_PROD_TESTS !== '1') {
  console.error('Refusing to run without CONFIRM_PROD_TESTS=1');
  process.exit(1);
}

const VERCEL_PROD_URL = (process.env.VERCEL_URL && process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://donna-interactive-grid.vercel.app'));
const INTEGRATIONS_PATH = process.env.INTEGRATIONS_PATH || '/settings/integrations';
const CONNECT_SELECTOR = process.env.GMAIL_CONNECT_SELECTOR || 'button:has-text("Connect Gmail")';
const GMAIL_USER = process.env.GMAIL_TEST_USER;
const GMAIL_PASSWORD = process.env.GMAIL_TEST_PASSWORD;

if (!GMAIL_USER || !GMAIL_PASSWORD) {
    console.error("Please set GMAIL_TEST_USER and GMAIL_TEST_PASSWORD environment variables for the E2E test.");
    process.exit(1);
}

test.describe('Gmail OAuth End-to-End Flow', () => {
  test('should complete the full OAuth flow and connect a Gmail account', async ({ page }) => {
    // 1. Navigate to the page that starts the OAuth flow
    // This assumes there's a page/component with a "Connect Gmail" button.
    // Replace '/settings/integrations' with the actual path.
    await page.goto(`${VERCEL_PROD_URL}${INTEGRATIONS_PATH}`);
    
    // 2. Click the "Connect Gmail" button (configurable selector)
    await page.click(CONNECT_SELECTOR);

    // 3. Handle the Google OAuth popup/redirect
    // Playwright's new page handler can be tricky. A simpler way is to wait for navigation.
    await page.waitForURL(/accounts\.google\.com/);

    // 4. Fill in Google login credentials
    await page.fill('input[type="email"]', GMAIL_USER);
    await page.click('#identifierNext');
    await page.waitForSelector('input[type="password"]', { state: 'visible' });
    await page.fill('input[type="password"]', GMAIL_PASSWORD);
    await page.click('#passwordNext');

    // 5. Handle the consent screen
    // This selector might change depending on whether the user has granted consent before.
    // It might be a "Continue" or "Allow" button.
    // Use a robust selector that can handle both cases if possible.
    // Handle consent: try robust selectors for Continue/Allow
    const allowBtn = page.locator('button:has-text("Allow"), div[role="button"]:has-text("Allow")');
    const continueBtn = page.locator('button:has-text("Continue"), div[role="button"]:has-text("Continue")');
    if (await allowBtn.count()) {
      await allowBtn.first().click();
    } else if (await continueBtn.count()) {
      await continueBtn.first().click();
    }

    // Wait for callback then app
    await page.waitForURL(/\/api\/gmail\/oauth\/callback/);
    await page.waitForURL(new RegExp(VERCEL_PROD_URL.replace(/\//g, '\\/')));
    
    // 6. Verify successful callback
    // The user should be redirected back to the application.
    // Check for a success message on the page.
    await expect(page.locator('text=/connected|gmail linked|success/i')).toBeVisible({ timeout: 20000 });

    // 7. (Optional) Verify token storage
    // This would require an API call to a test-only endpoint to check if the
    // refresh token was stored in Supabase for the test user.
    // Security Note: Use a dedicated test account with limited scope. Prefer app passwords or
    // pre-seeded session cookies to avoid handling raw credentials in CI. See README next to this test.
    console.log('OAuth flow completed successfully and success message was displayed.');
  });
});
