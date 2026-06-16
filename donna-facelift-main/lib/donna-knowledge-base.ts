import fs from 'fs'
import path from 'path'

/** Markdown sources for DONNA knowledge-backed chat (Path A: full context). */
export const DONNA_KNOWLEDGE_FILES = [
  'GTM 4.22.md',
  'ICP 4.22.md',
  'Investor Memo 4.22.md',
  'Product Overview.md',
] as const

const MAX_CHARS = 120_000

function knowledgeDir(): string {
  return path.join(process.cwd(), 'content', 'donna-knowledge')
}

/**
 * Load and concatenate all knowledge markdown files. Node-only (fs).
 * Truncates with a warning if the combined corpus exceeds MAX_CHARS.
 */
export function loadDonnaKnowledgeBase(): string {
  const dir = knowledgeDir()
  const parts: string[] = []

  for (const name of DONNA_KNOWLEDGE_FILES) {
    const filePath = path.join(dir, name)
    if (!fs.existsSync(filePath)) {
      console.warn(`[donna-knowledge-base] Missing file: ${filePath}`)
      continue
    }
    const raw = fs.readFileSync(filePath, 'utf8')
    parts.push(`\n\n---\n## Source: ${name}\n\n${raw}`)
  }

  let combined = parts.join('').trim()
  if (combined.length > MAX_CHARS) {
    console.warn(
      `[donna-knowledge-base] Corpus truncated from ${combined.length} to ${MAX_CHARS} characters`
    )
    combined = combined.slice(0, MAX_CHARS) + '\n\n[…truncated…]'
  }

  return combined
}

export function estimateKnowledgeBaseChars(): number {
  return loadDonnaKnowledgeBase().length
}
