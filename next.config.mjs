/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const demoBase = process.env.NEXT_PUBLIC_DEMO_URL || 'https://donna-facelift.vercel.app/demo'
    return [
      {
        // Bare /demo must not gain a trailing slash from the wildcard rule:
        // the facelift answers /demo/ with a 308 to /demo, which loops here.
        source: '/demo',
        destination: demoBase,
      },
      {
        source: '/demo/:path+',
        destination: `${demoBase}/:path+`,
      },
    ]
  },
}

export default nextConfig
