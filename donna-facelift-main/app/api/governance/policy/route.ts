import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Read the governance policy JSON file
    const filePath = join(process.cwd(), 'governance', 'governance_policy.json')
    const fileContents = await readFile(filePath, 'utf-8')
    const policy = JSON.parse(fileContents)
    
    return NextResponse.json(policy, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error reading governance policy:', error)
    return NextResponse.json(
      { error: 'Governance policy not found' },
      { status: 404 }
    )
  }
}

