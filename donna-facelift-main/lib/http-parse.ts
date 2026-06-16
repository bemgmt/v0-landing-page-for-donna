import { type NextRequest } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export class BadRequestError extends Error {
  status: number
  details?: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'BadRequestError'
    this.status = 400
    this.details = details
  }
}

export function isBadRequestError(err: unknown): err is BadRequestError {
  return err instanceof BadRequestError
}

export async function parseJson<T>(
  req: NextRequest | Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new BadRequestError('Invalid JSON body')
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const details = (result.error instanceof ZodError) ? result.error.flatten() : undefined
    throw new BadRequestError('Invalid request body', details)
  }
  return result.data
}

export async function parseJsonSafe<T>(
  req: NextRequest | Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; status: number; message: string; details?: unknown }> {
  try {
    const data = await parseJson(req, schema)
    return { success: true, data }
  } catch (e) {
    if (isBadRequestError(e)) {
      return { success: false, status: e.status, message: e.message, details: e.details }
    }
    return { success: false, status: 400, message: 'Invalid request body' }
  }
}

