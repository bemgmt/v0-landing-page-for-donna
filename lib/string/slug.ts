export function slugifySegment(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
  const suffix = crypto.randomUUID().slice(0, 8)
  return `${base || "post"}-${suffix}`
}
