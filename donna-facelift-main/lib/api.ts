export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || ''
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase()
  const url = path.startsWith('http') ? path : `${base}${path}`
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

