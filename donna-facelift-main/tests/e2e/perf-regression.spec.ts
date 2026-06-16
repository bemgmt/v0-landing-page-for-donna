import { test, expect } from '@playwright/test'

// Performance thresholds
const THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint - 2.5s
  FID: 100,  // First Input Delay - 100ms
  CLS: 0.1,  // Cumulative Layout Shift - 0.1
  TTI: 3000, // Time to Interactive - 3s
  CACHE_SPEEDUP: 0.5 // Cached responses should be at least 50% faster
}

test.describe('Performance Regression Tests @perf', () => {
  test('homepage loads within performance thresholds', async ({ page }) => {
    // Navigate to homepage and measure Core Web Vitals
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry?.renderTime || lastEntry?.loadTime || 0)
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        
        // Fallback timeout
        setTimeout(() => resolve(0), 5000)
      })
    })
    
    // Measure Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          resolve(clsValue)
        }).observe({ type: 'layout-shift', buffered: true })
        
        // Resolve after a short delay to capture shifts
        setTimeout(() => resolve(clsValue), 2000)
      })
    })
    
    // Measure Time to Interactive (TTI) approximation
    const loadTime = Date.now() - startTime
    
    console.log(`Performance Metrics:`)
    console.log(`- LCP: ${lcp}ms (threshold: ${THRESHOLDS.LCP}ms)`)
    console.log(`- CLS: ${cls} (threshold: ${THRESHOLDS.CLS})`)
    console.log(`- Load Time: ${loadTime}ms (threshold: ${THRESHOLDS.TTI}ms)`)
    
    // Assert performance thresholds
    expect(lcp).toBeLessThan(THRESHOLDS.LCP)
    expect(cls).toBeLessThan(THRESHOLDS.CLS)
    expect(loadTime).toBeLessThan(THRESHOLDS.TTI)
  })

  test('interactive grid performance', async ({ page }) => {
    await page.goto('/')
    
    // Wait for grid to be visible
    await page.waitForSelector('[data-testid="interactive-grid"]', { timeout: 10000 })
    
    // Measure time to click and load interface
    const startTime = Date.now()
    
    // Click on first grid item (should be Gmail/Email)
    await page.click('[data-testid="grid-item"]:first-child')
    
    // Wait for interface to load (look for loading state to disappear)
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"]')
      return loadingElements.length === 0
    }, { timeout: 10000 })
    
    const interactionTime = Date.now() - startTime
    
    console.log(`Grid Interaction Time: ${interactionTime}ms`)
    
    // Should load interface within reasonable time
    expect(interactionTime).toBeLessThan(3000)
    
    // Go back to grid
    await page.click('[data-testid="back-button"]')
    await page.waitForSelector('[data-testid="interactive-grid"]')
  })

  test('API response caching performance', async ({ page }) => {
    // Test cached vs uncached API responses
    const apiEndpoints = [
      '/api/health',
      '/donna/api/system-stats',
      '/donna/api/conversations',
      '/donna/api/chatbot_settings'
    ]
    
    for (const endpoint of apiEndpoints) {
      console.log(`Testing caching for ${endpoint}`)
      
      // First request (uncached)
      const uncachedStart = Date.now()
      const uncachedResponse = await page.request.get(endpoint)
      const uncachedTime = Date.now() - uncachedStart
      
      expect(uncachedResponse.ok()).toBeTruthy()
      
      // Second request (should be cached)
      const cachedStart = Date.now()
      const cachedResponse = await page.request.get(endpoint)
      const cachedTime = Date.now() - cachedStart
      
      expect(cachedResponse.ok()).toBeTruthy()
      
      // Check for cache headers
      const cacheHeader = cachedResponse.headers()['x-cache']
      
      console.log(`${endpoint}: Uncached=${uncachedTime}ms, Cached=${cachedTime}ms, Cache-Header=${cacheHeader}`)
      
      // Cached response should be faster (allowing for some variance)
      if (cacheHeader === 'HIT') {
        expect(cachedTime).toBeLessThan(uncachedTime * THRESHOLDS.CACHE_SPEEDUP)
      }
    }
  })

  test('bundle loading performance', async ({ page }) => {
    // Monitor network requests during page load
    const requests: any[] = []
    
    page.on('request', request => {
      if (request.url().includes('/_next/static/')) {
        requests.push({
          url: request.url(),
          startTime: Date.now()
        })
      }
    })
    
    const responses: any[] = []
    page.on('response', response => {
      if (response.url().includes('/_next/static/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'],
          endTime: Date.now()
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log(`Loaded ${responses.length} static assets`)
    
    // Check for any failed asset loads
    const failedAssets = responses.filter(r => r.status >= 400)
    expect(failedAssets).toHaveLength(0)
    
    // Check for reasonable number of chunks (not too many)
    const jsChunks = responses.filter(r => r.url.endsWith('.js'))
    expect(jsChunks.length).toBeLessThan(20) // Reasonable chunk count
    
    console.log(`JavaScript chunks loaded: ${jsChunks.length}`)
  })

  test('memory usage during navigation', async ({ page }) => {
    await page.goto('/')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : null
    })
    
    if (!initialMemory) {
      console.log('Memory API not available, skipping memory test')
      return
    }
    
    console.log(`Initial memory: ${Math.round(initialMemory.used / 1024 / 1024)}MB`)
    
    // Navigate through several interfaces
    const gridItems = await page.locator('[data-testid="grid-item"]').count()
    
    for (let i = 0; i < Math.min(3, gridItems); i++) {
      await page.click(`[data-testid="grid-item"]:nth-child(${i + 1})`)
      await page.waitForTimeout(1000) // Let interface load
      await page.click('[data-testid="back-button"]')
      await page.waitForSelector('[data-testid="interactive-grid"]')
    }
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      }
    })
    
    const memoryIncrease = finalMemory.used - initialMemory.used
    const memoryIncreaseMB = Math.round(memoryIncrease / 1024 / 1024)
    
    console.log(`Final memory: ${Math.round(finalMemory.used / 1024 / 1024)}MB`)
    console.log(`Memory increase: ${memoryIncreaseMB}MB`)
    
    // Memory increase should be reasonable (less than 50MB for navigation)
    expect(memoryIncreaseMB).toBeLessThan(50)
  })
})
