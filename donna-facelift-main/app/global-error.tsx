"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isProd = process.env.NODE_ENV === 'production'
  useEffect(() => {
    // Report client-side render errors to Sentry with context
    Sentry.withScope((scope) => {
      if (error?.digest) {
        scope.setTag('digest', error.digest)
        scope.setFingerprint(['global-error', error.digest])
      } else {
        scope.setFingerprint(['global-error'])
      }
      scope.setContext('component', { name: 'GlobalError' })
      scope.setLevel('error')
      Sentry.captureException(error)
    })
  }, [error])

  return (
    <html>
      <body className="min-h-screen grid place-items-center p-6 text-sm">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-lg font-medium">Something went wrong</h1>
                {!isProd && error?.message ? (
                  <p className="text-muted-foreground break-words">{error.message}</p>
                ) : error?.digest ? (
                  <p className="text-muted-foreground">Error ID: {error.digest}</p>
                ) : null}
                <button
                  type="button"
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs hover:bg-accent"
                  onClick={reset}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
