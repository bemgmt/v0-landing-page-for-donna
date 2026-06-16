import { NextResponse } from 'next/server'

export type SuccessBody<T = Record<string, unknown>> = { success: true } & T
export type ErrorBody<T = Record<string, unknown>> = { success: false; error: string } & T

export function jsonSuccess<T = Record<string, unknown>>(body?: T, init?: ResponseInit) {
  const res = NextResponse.json({ success: true, ...(body || {}) } as SuccessBody<T>, init)
  addCommonHeaders(res)
  return res
}

export function jsonError(message: string, status: number = 400, extra?: Record<string, unknown>) {
  const res = NextResponse.json({ success: false, error: message, ...(extra || {}) } as ErrorBody, { status })
  addCommonHeaders(res)
  return res
}

function addCommonHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
}
