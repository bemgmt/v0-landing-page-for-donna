import { test, expect } from '@playwright/test'

test('@smoke api health responds 200', async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/api/health`)
  expect(res.status()).toBe(200)
})

test('@smoke homepage renders', async ({ page, baseURL }) => {
  const res = await page.goto(`${baseURL}/`)
  expect(res?.ok()).toBeTruthy()
})
