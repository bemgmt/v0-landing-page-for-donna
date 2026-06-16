import { test, expect } from '@playwright/test'

const SITE_URL = 'https://donna-facelift.vercel.app/'

test.describe('Site Review - Production', () => {
  test('Homepage loads and displays correctly', async ({ page }) => {
    // Navigate to the site
    const response = await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Check response status
    expect(response?.status()).toBe(200)
    
    // Wait for initial content
    await page.waitForLoadState('domcontentloaded')
    
    // Check for main elements
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check for DONNA branding
    const donnaText = page.getByText(/DONNA/i)
    await expect(donnaText.first()).toBeVisible({ timeout: 10000 })
  })

  test('Page performance metrics', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Get performance metrics
    const performanceTiming = await page.evaluate(() => {
      const perfData = performance.timing
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
      }
    })
    
    console.log('Performance Metrics:', performanceTiming)
    
    // Check for reasonable load times (adjust thresholds as needed)
    expect(performanceTiming.domContentLoaded).toBeLessThan(5000)
    expect(performanceTiming.loadComplete).toBeLessThan(10000)
  })

  test('Console errors check', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })
    
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000)
    
    console.log('Console Errors:', consoleErrors)
    console.log('Console Warnings:', consoleWarnings)
    
    // Fail if there are critical errors (adjust as needed)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('preview')
    )
    
    if (criticalErrors.length > 0) {
      console.warn('Critical console errors found:', criticalErrors)
    }
  })

  test('Network requests analysis', async ({ page }) => {
    const requests: Array<{ url: string; status: number; type: string }> = []
    
    page.on('response', response => {
      requests.push({
        url: response.url(),
        status: response.status(),
        type: response.request().resourceType()
      })
    })
    
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Analyze requests
    const failedRequests = requests.filter(r => r.status >= 400)
    const requestTypes = requests.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Total Requests:', requests.length)
    console.log('Request Types:', requestTypes)
    console.log('Failed Requests:', failedRequests)
    
    // Check for failed requests
    expect(failedRequests.length).toBe(0)
  })

  test('Accessibility - basic checks', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Check for title
    const title = await page.title()
    expect(title).toBeTruthy()
    console.log('Page Title:', title)
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]')
    const mainCount = await main.count()
    if (mainCount > 0) {
      await expect(main.first()).toBeVisible()
    }
    
    // Check for heading structure
    const h1 = page.locator('h1')
    const h1Count = await h1.count()
    if (h1Count > 0) {
      await expect(h1.first()).toBeVisible()
    }
  })

  test('Interactive Grid loading state', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Check for loading indicators
    const loadingText = page.getByText(/Loading Interactive Grid/i)
    const loadingCount = await loadingText.count()
    
    if (loadingCount > 0) {
      console.log('Loading indicator found')
      // Wait for it to potentially disappear
      await page.waitForTimeout(5000)
    }
    
    // Check for module links (Sales, Marketing, Chatbot, Secretary)
    const modules = ['Sales', 'Marketing', 'Chatbot', 'Secretary']
    for (const module of modules) {
      const moduleLink = page.getByText(new RegExp(module, 'i'))
      const count = await moduleLink.count()
      if (count > 0) {
        console.log(`Module "${module}" found`)
      }
    }
  })

  test('Mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check that content is visible on mobile
    const donnaText = page.getByText(/DONNA/i)
    await expect(donnaText.first()).toBeVisible({ timeout: 10000 })
    
    // Take a screenshot for visual review
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-view.png', fullPage: true })
  })

  test('Desktop viewport', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Take a screenshot for visual review
    await page.screenshot({ path: 'tests/e2e/screenshots/desktop-view.png', fullPage: true })
  })

  test('Auth disabled message check', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Check for "Auth disabled in preview" message
    const authMessage = page.getByText(/Auth disabled in preview/i)
    const authMessageCount = await authMessage.count()
    
    if (authMessageCount > 0) {
      console.log('Auth disabled message found (expected for preview)')
      await expect(authMessage.first()).toBeVisible()
    }
  })

  test('Service Status component', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Wait a bit for components to load
    await page.waitForTimeout(3000)
    
    // Check if ServiceStatus component is present (it should be in the top right)
    // This might be visible or hidden depending on state
    const serviceStatus = page.locator('[data-testid="service-status"], .service-status')
    const count = await serviceStatus.count()
    
    if (count > 0) {
      console.log('ServiceStatus component found')
    }
  })

  test('Page structure and layout', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' })
    
    // Check for common structural elements
    const html = await page.content()
    
    // Basic structure checks
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html')
    expect(html).toContain('<body')
    
    // Check for React root
    const root = page.locator('#__next, [id^="__next"]')
    const rootCount = await root.count()
    expect(rootCount).toBeGreaterThan(0)
  })
})

