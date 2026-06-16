// Minimal tests for PCM16 helpers (no browser APIs required)
// Run: node scripts/ws2-audio-helpers-test.mjs

import { decodeBase64PCM16ToFloat32, encodeFloat32ToBase64PCM16 } from '../lib/pcm16.js'

function approx(a, b, eps = 1e-3) { return Math.abs(a - b) <= eps }

// Roundtrip simple waveform
const samples = new Float32Array([0, 0.5, -0.5, 1.0, -1.0])
const b64 = encodeFloat32ToBase64PCM16(samples)
const out = decodeBase64PCM16ToFloat32(b64)

if (out.length !== samples.length) {
  console.error('Length mismatch:', out.length, '!=', samples.length)
  process.exit(1)
}

let ok = true
for (let i = 0; i < samples.length; i++) {
  if (!approx(out[i], samples[i], 1e-2)) { // allow small quantization error
    console.error(`Mismatch at ${i}: got ${out[i]}, want ${samples[i]}`)
    ok = false
  }
}

if (!ok) process.exit(1)
console.log('PCM16 helpers test passed')

