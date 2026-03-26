/**
 * Generates public/brand/full/*, public/brand/icon/*, and public/favicon.ico
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const publicDir = path.join(root, "public")

const FULL_SRC = path.join(publicDir, "DONNA-logo.png")
const BRAIN_SRC = path.join(publicDir, "DONNA-logo-brain.png")
const BRAND = path.join(publicDir, "brand")
const OUT_FULL = path.join(BRAND, "full")
const OUT_ICON = path.join(BRAND, "icon")

const ICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512]
const FULL_WIDTHS = [512, 1024]

function pngBufferToIco(png) {
  const w = png.readUInt32BE(16)
  const h = png.readUInt32BE(20)
  const entryW = w >= 256 ? 0 : w
  const entryH = h >= 256 ? 0 : h
  const header = 6 + 16
  const offset = header
  const out = Buffer.alloc(header + png.length)
  out.writeUInt16LE(0, 0)
  out.writeUInt16LE(1, 2)
  out.writeUInt16LE(1, 4)
  out.writeUInt8(entryW, 6)
  out.writeUInt8(entryH, 7)
  out.writeUInt8(0, 8)
  out.writeUInt8(0, 9)
  out.writeUInt16LE(1, 10)
  out.writeUInt16LE(32, 12)
  out.writeUInt32LE(png.length, 14)
  out.writeUInt32LE(offset, 18)
  png.copy(out, offset)
  return out
}

async function ensureDirs() {
  await fs.mkdir(OUT_FULL, { recursive: true })
  await fs.mkdir(OUT_ICON, { recursive: true })
}

async function writeBrainIcon(size) {
  const buf = await sharp(BRAIN_SRC)
    .resize(size, size, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  const out = path.join(OUT_ICON, `donna-icon-${size}.png`)
  await fs.writeFile(out, buf)
}

async function writeFullWidths() {
  for (const w of FULL_WIDTHS) {
    const buf = await sharp(FULL_SRC)
      .resize({ width: w, withoutEnlargement: true })
      .png()
      .toBuffer()
    await fs.writeFile(path.join(OUT_FULL, `donna-logo-${w}.png`), buf)
  }
}

async function writeFaviconIco() {
  const png = await sharp(BRAIN_SRC)
    .resize(32, 32, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  await fs.writeFile(path.join(publicDir, "favicon.ico"), pngBufferToIco(png))
}

async function main() {
  await ensureDirs()
  for (const p of [FULL_SRC, BRAIN_SRC]) {
    try {
      await fs.access(p)
    } catch {
      console.error("Missing required file: " + p)
      process.exit(1)
    }
  }
  await writeFullWidths()
  for (const s of ICON_SIZES) await writeBrainIcon(s)
  await writeFaviconIco()
  console.log("Brand assets written to public/brand/ and public/favicon.ico")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
