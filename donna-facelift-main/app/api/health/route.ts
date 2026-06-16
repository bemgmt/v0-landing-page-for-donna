import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime() * 100) / 100, // Round to 2 decimals
      version: process.env.npm_package_version || '0.1.0',
      // environment intentionally omitted in public output
      node_version: process.version,
      services: {
        database: 'not_configured', // Will be updated when DB is added
        websocket: process.env.NEXT_PUBLIC_WEBSOCKET_URL ? 'configured' : 'not_configured',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100, // MB
      }
    }

    return NextResponse.json(healthData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch {
    // Sample health errors to reduce noise
    if (Math.random() < 0.1) {
      Sentry.captureException(new Error('Health check failed'))
    }
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
