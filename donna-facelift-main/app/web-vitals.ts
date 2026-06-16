'use client'

import type { Metric } from 'web-vitals'

type WebVitalsModule = typeof import('web-vitals')
type Listener = (callback: Metric) => void

type WebVitalMetric = Metric

interface StoredMetric extends WebVitalMetric {
  timestamp: number
  url: string
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
}

const metrics: WebVitalMetric[] = []
let initialized = false
let webVitalsPromise: Promise<Partial<WebVitalsModule>> | null = null

function loadWebVitals(): Promise<Partial<WebVitalsModule>> {
  if (!webVitalsPromise) {
    webVitalsPromise = import('web-vitals')
      .then(module => (module.default ?? module) as Partial<WebVitalsModule>)
      .catch(error => {
        console.warn('web-vitals package not available:', error)
        return {}
      })
  }
  return webVitalsPromise
}

function asListener(fn: unknown): Listener | undefined {
  return typeof fn === 'function' ? (fn as Listener) : undefined
}

function registerMetric(module: Partial<WebVitalsModule>, primary: keyof WebVitalsModule, fallback: keyof WebVitalsModule) {
  const primaryListener = asListener(module[primary])
  if (primaryListener) {
    primaryListener(reportMetric)
    return
  }

  const fallbackListener = asListener(module[fallback])
  if (fallbackListener) {
    fallbackListener(reportMetric)
  }
}

function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function reportMetric(metric: WebVitalMetric) {
  metrics.push(metric)

  if (process.env.NODE_ENV === 'development') {
    const rating = getMetricRating(metric.name, metric.value)
    const label = rating === 'good' ? '[GOOD]' : rating === 'needs-improvement' ? '[WARN]' : '[POOR]'

    console.log(`${label} ${metric.name}: ${metric.value}ms (${rating})`)
  }

  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(metric)
  }

  storeMetricLocally(metric)
}

function sendToAnalytics(metric: WebVitalMetric) {
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      custom_parameter_1: metric.rating,
      custom_parameter_2: metric.navigationType
    })
  }

  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent
    })
  }).catch(error => {
    console.warn('Failed to send web vitals to analytics:', error)
  })
}

function readStoredMetrics(): StoredMetric[] {
  const stored = localStorage.getItem('donna-web-vitals')
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? (parsed as StoredMetric[]) : []
  } catch (error) {
    console.warn('Failed to parse stored web vitals:', error)
    return []
  }
}

function writeStoredMetrics(items: StoredMetric[]) {
  localStorage.setItem('donna-web-vitals', JSON.stringify(items))
}

function storeMetricLocally(metric: WebVitalMetric) {
  try {
    const vitals = readStoredMetrics()
    const entry: StoredMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.pathname
    }

    vitals.push(entry)

    if (vitals.length > 50) {
      vitals.splice(0, vitals.length - 50)
    }

    writeStoredMetrics(vitals)
  } catch (error) {
    console.warn('Failed to store web vitals locally:', error)
  }
}

export function initWebVitals() {
  if (initialized) {
    return
  }

  initialized = true

  loadWebVitals()
    .then(module => {
      try {
        registerMetric(module, 'onCLS', 'getCLS')
        registerMetric(module, 'onFID', 'getFID')
        registerMetric(module, 'onFCP', 'getFCP')
        registerMetric(module, 'onLCP', 'getLCP')
        registerMetric(module, 'onTTFB', 'getTTFB')
      } catch (error) {
        initialized = false
        console.warn('Failed to initialize web vitals:', error)
      }
    })
    .catch(error => {
      initialized = false
      console.warn('Failed to load web vitals module:', error)
    })
}

export function getWebVitalsMetrics() {
  return metrics
}

export function getPerformanceSummary() {
  if (metrics.length === 0) {
    return { status: 'no-data', message: 'No metrics collected yet' }
  }

  const summary = {
    total: metrics.length,
    good: metrics.filter(m => getMetricRating(m.name, m.value) === 'good').length,
    needsImprovement: metrics.filter(m => getMetricRating(m.name, m.value) === 'needs-improvement').length,
    poor: metrics.filter(m => getMetricRating(m.name, m.value) === 'poor').length,
    metrics: {} as Record<string, { value: number; rating: string }>
  }

  const latestMetrics = metrics.reduce<Record<string, WebVitalMetric>>((acc, metric) => {
    acc[metric.name] = metric
    return acc
  }, {})

  Object.entries(latestMetrics).forEach(([name, metric]) => {
    summary.metrics[name] = {
      value: metric.value,
      rating: getMetricRating(name, metric.value)
    }
  })

  const overallRating = summary.poor > 0 ? 'poor' :
                       summary.needsImprovement > 0 ? 'needs-improvement' : 'good'

  return {
    status: overallRating,
    summary,
    timestamp: Date.now()
  }
}

export function getWebVitalsForHealthCheck() {
  try {
    const vitals = readStoredMetrics()
    const recent = vitals.filter(entry => Date.now() - entry.timestamp < 5 * 60 * 1000)

    if (recent.length === 0) return null

    const averages = recent.reduce<Record<string, { total: number; count: number }>>((acc, vital) => {
      if (!acc[vital.name]) {
        acc[vital.name] = { total: 0, count: 0 }
      }
      acc[vital.name].total += vital.value
      acc[vital.name].count += 1
      return acc
    }, {})

    const result = Object.entries(averages).reduce<Record<string, { average: number; rating: string; samples: number }>>((acc, [name, data]) => {
      const average = data.total / data.count
      acc[name] = {
        average: Math.round(average),
        rating: getMetricRating(name, average),
        samples: data.count
      }
      return acc
    }, {})

    return result
  } catch (error) {
    console.warn('Failed to get web vitals for health check:', error)
    return null
  }
}

// Only run in browser environment, not during SSR
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const startTracking = () => {
    try {
      initWebVitals()
    } catch (error) {
      console.warn('Web vitals initialization failed:', error)
    }
  }

  if (document.readyState === 'complete') {
    startTracking()
  } else {
    window.addEventListener('load', startTracking, { once: true })
  }
}
