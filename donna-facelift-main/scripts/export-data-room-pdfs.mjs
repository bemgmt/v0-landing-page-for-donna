/**
 * Renders root-level investor Markdown files to PDFs in public/data-room/pdfs/.
 * Usage: npm run data-room:pdf
 */
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const { mdToPdf } = require("md-to-pdf")

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "public", "data-room", "pdfs")

/** [source markdown relative to ROOT, output pdf basename] */
const FILES = [
  ["Investor Memo 4.22.md", "investor-memo-4-22.pdf"],
  ["GTM 4.22.md", "gtm-4-22.pdf"],
  ["ICP 4.22.md", "icp-4-22.pdf"],
  ["Product Overview.md", "product-overview.pdf"],
  ["DONNA Doctrine.md", "donna-doctrine.pdf"],
  ["DONNA Operating System (Core Principles).md", "donna-operating-system-core-principles.pdf"],
  ["DONNA Product & Ethics Framework.md", "donna-product-ethics-framework.pdf"],
  ["Founder\u2019s Note.md", "founders-note.pdf"],
]

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const pdfOptions = {
    format: "Letter",
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    printBackground: true,
  }

  for (const [srcName, pdfName] of FILES) {
    const srcPath = path.join(ROOT, srcName)
    const destPath = path.join(OUT_DIR, pdfName)

    if (!fs.existsSync(srcPath)) {
      console.warn(`[skip] missing source: ${srcPath}`)
      continue
    }

    console.log(`→ ${srcName} → ${pdfName}`)
    await mdToPdf({ path: srcPath }, { dest: destPath, pdf_options: pdfOptions })
  }

  console.log(`Done. PDFs in ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
