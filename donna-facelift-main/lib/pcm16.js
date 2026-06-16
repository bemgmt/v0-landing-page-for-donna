// Simple PCM16 helpers for realtime audio (browser + node compatible)

function b64ToUint8(b64) {
  if (typeof atob === 'function') {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } else {
    // node
    // eslint-disable-next-line no-undef
    return new Uint8Array(Buffer.from(b64, 'base64'))
  }
}

function uint8ToB64(u8) {
  if (typeof btoa === 'function') {
    let bin = ''
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
    return btoa(bin)
  } else {
    // node
    // eslint-disable-next-line no-undef
    return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('base64')
  }
}

/**
 * Decode a base64 PCM16 (little-endian) chunk to Float32Array [-1, 1].
 * @param {string} b64
 * @returns {Float32Array}
 */
export function decodeBase64PCM16ToFloat32(b64) {
  const buf = b64ToUint8(b64)
  const len = Math.floor(buf.byteLength / 2)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const lo = buf[i * 2]
    const hi = buf[i * 2 + 1]
    let sample = (hi << 8) | lo
    if (sample & 0x8000) sample = sample - 0x10000
    out[i] = Math.max(-1, Math.min(1, sample / 32768))
  }
  return out
}

/**
 * Encode Float32Array [-1,1] to base64 PCM16 (little-endian).
 * @param {Float32Array} floats
 */
export function encodeFloat32ToBase64PCM16(floats) {
  const i16 = new Int16Array(floats.length)
  for (let i = 0; i < floats.length; i++) {
    const x = Math.max(-1, Math.min(1, floats[i]))
    i16[i] = x < 0 ? Math.round(x * 32768) : Math.round(x * 32767)
  }
  return uint8ToB64(new Uint8Array(i16.buffer))
}
