export default function NotFound() {
  return (
    <div className="min-h-screen text-white flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">🧠</div>
        <h2 className="text-xl font-light mb-2">Page not found</h2>
        <p className="text-white/60 mb-6">The page you are looking for does not exist.</p>
        <a href="/" className="px-4 py-2 bg-white text-black rounded">Back to grid</a>
      </div>
    </div>
  )
}

