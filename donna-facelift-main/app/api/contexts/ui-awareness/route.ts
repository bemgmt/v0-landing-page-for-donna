import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Read the UI awareness JSON file
    const filePath = join(process.cwd(), 'contexts', 'ui_awareness.json')
    const fileContents = await readFile(filePath, 'utf-8')
    const uiAwareness = JSON.parse(fileContents)
    
    return NextResponse.json(uiAwareness, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error reading UI awareness:', error)
    return NextResponse.json(
      { error: 'UI awareness context not found' },
      { status: 404 }
    )
  }
}

