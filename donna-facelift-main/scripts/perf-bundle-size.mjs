#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Bundle size thresholds
const THRESHOLDS = {
  mainChunk: 500 * 1024, // 500KB
  totalJS: 2 * 1024 * 1024, // 2MB
  individualChunk: 200 * 1024 // 200KB
}

console.log('🔍 Running bundle size analysis...')

try {
  // Run Next.js build
  console.log('📦 Building Next.js application...')
  execSync('npm run build', { 
    cwd: projectRoot, 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: process.env.ANALYZE || 'false' }
  })

  // Parse build output and analyze bundle sizes
  const nextDir = join(projectRoot, '.next')
  const staticDir = join(nextDir, 'static', 'chunks')
  
  if (!existsSync(staticDir)) {
    throw new Error('Build output not found. Make sure the build completed successfully.')
  }

  console.log('\n📊 Analyzing bundle sizes...')
  
  const chunks = []
  let totalSize = 0
  let mainChunkSize = 0

  // Read all chunk files
  const files = readdirSync(staticDir, { recursive: true })
  
  for (const file of files) {
    if (typeof file === 'string' && file.endsWith('.js')) {
      const filePath = join(staticDir, file)
      const stats = statSync(filePath)
      const size = stats.size
      
      chunks.push({ name: file, size })
      totalSize += size
      
      // Identify main chunk (usually contains 'main' or is the largest)
      if (file.includes('main') || size > mainChunkSize) {
        mainChunkSize = size
      }
    }
  }

  // Sort chunks by size (largest first)
  chunks.sort((a, b) => b.size - a.size)

  // Display results
  console.log('\n📈 Bundle Analysis Results:')
  console.log('=' .repeat(50))
  
  console.log(`Total JavaScript: ${formatBytes(totalSize)}`)
  console.log(`Main chunk: ${formatBytes(mainChunkSize)}`)
  console.log(`Number of chunks: ${chunks.length}`)
  
  console.log('\n🔝 Largest chunks:')
  chunks.slice(0, 10).forEach((chunk, i) => {
    const status = chunk.size > THRESHOLDS.individualChunk ? '❌' : '✅'
    console.log(`${i + 1}. ${status} ${chunk.name}: ${formatBytes(chunk.size)}`)
  })

  // Check thresholds
  let failed = false
  const results = []

  if (totalSize > THRESHOLDS.totalJS) {
    failed = true
    results.push(`❌ Total JS size (${formatBytes(totalSize)}) exceeds threshold (${formatBytes(THRESHOLDS.totalJS)})`)
  } else {
    results.push(`✅ Total JS size (${formatBytes(totalSize)}) within threshold`)
  }

  if (mainChunkSize > THRESHOLDS.mainChunk) {
    failed = true
    results.push(`❌ Main chunk size (${formatBytes(mainChunkSize)}) exceeds threshold (${formatBytes(THRESHOLDS.mainChunk)})`)
  } else {
    results.push(`✅ Main chunk size (${formatBytes(mainChunkSize)}) within threshold`)
  }

  const oversizedChunks = chunks.filter(chunk => chunk.size > THRESHOLDS.individualChunk)
  if (oversizedChunks.length > 0) {
    failed = true
    results.push(`❌ ${oversizedChunks.length} chunks exceed individual threshold (${formatBytes(THRESHOLDS.individualChunk)})`)
  } else {
    results.push(`✅ All chunks within individual size threshold`)
  }

  console.log('\n🎯 Threshold Check Results:')
  console.log('=' .repeat(50))
  results.forEach(result => console.log(result))

  // Bundle analyzer stats (if available)
  if (process.env.ANALYZE === 'true') {
    console.log('\n📊 Bundle analyzer enabled - check the generated report')
  }

  // Performance recommendations
  if (failed) {
    console.log('\n💡 Performance Recommendations:')
    console.log('- Consider code splitting with dynamic imports')
    console.log('- Review and optimize large dependencies')
    console.log('- Enable tree shaking for unused code')
    console.log('- Use Next.js bundle analyzer: npm run analyze')
  }

  if (failed) {
    console.log('\n❌ Bundle size check failed!')
    process.exit(1)
  } else {
    console.log('\n✅ Bundle size check passed!')
    process.exit(0)
  }

} catch (error) {
  console.error('❌ Bundle size analysis failed:', error.message)
  process.exit(1)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
