import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate the request body
    if (!body.metric || typeof body.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // In production, you might want to:
    // - Store metrics in a database
    // - Send to analytics service (e.g., Google Analytics, Sentry)
    // - Aggregate metrics for performance monitoring
    
    // For now, we'll just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital received:', {
        metric: body.metric,
        value: body.value,
        rating: body.rating,
        url: body.url,
        timestamp: new Date(body.timestamp).toISOString()
      })
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Web vital recorded',
        metric: body.metric,
        value: body.value
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing web vital:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

