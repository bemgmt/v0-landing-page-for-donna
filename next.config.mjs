/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/demo/:path*',
        destination: process.env.NEXT_PUBLIC_DEMO_URL || 'https://donna-facelift.vercel.app/:path*',
      },
    ]
  },
}

export default nextConfig
