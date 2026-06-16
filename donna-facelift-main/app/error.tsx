"use client"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-xl font-light mb-2">Something went wrong</h2>
          <p className="text-white/60 mb-6">{error.message || 'An unexpected error occurred.'}</p>
          <div className="flex gap-3 justify-center">
            <a href="/" className="px-4 py-2 bg-white text-black rounded">Back to grid</a>
            <button onClick={() => reset()} className="px-4 py-2 bg-white/10 rounded">Try again</button>
          </div>
        </div>
      </body>
    </html>
  )
}

