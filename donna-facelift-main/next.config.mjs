import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  sentry: {
    hideSourceMaps: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Enable standalone output for easier deployment
  output: 'standalone',

  // Environment variables


  // Configure base path if needed (disabled for Vercel deployment)
  // basePath: process.env.NODE_ENV === 'production' ? '/donna/grid' : '',

  // Configure asset prefix for production (disabled for Vercel deployment)
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/donna/grid' : '',

  // Configure rewrites for PHP backend in development only.
  // IMPORTANT (WS2): Do not shadow Next API routes like /api/realtime/* or /api/voice/*.
  // --- GEMINI PROPOSED CHANGE START ---
  async rewrites() {
    const siteGroundBackend = process.env.NEXT_PUBLIC_API_BASE || 'https://bemdonna.com/donna';

    // In production, only rewrite specific PHP endpoints to SiteGround.
    // This avoids shadowing Next.js API routes like /api/gmail or /api/voice.
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/marketing.php',
          destination: `${siteGroundBackend}/api/marketing.php`,
        },
        {
          source: '/api/inbox.php',
          destination: `${siteGroundBackend}/api/inbox.php`,
        },
      ];
    }

    // In development, use a more flexible rewrite to the local PHP server.
    const devPhpBase = process.env.DEV_PHP_BASE || 'http://127.0.0.1:8000';
    return [
      // Explicitly rewrite the two main endpoints to the dev server
      {
        source: '/api/marketing.php',
        destination: `${devPhpBase}/api/marketing.php`,
      },
      {
        source: '/api/inbox.php',
        destination: `${devPhpBase}/api/inbox.php`,
      },
      // Chatbot settings endpoint
      {
        source: '/api/chatbot_settings.php',
        destination: `${devPhpBase}/api/chatbot_settings.php`,
      },
      // A broader rule for other potential PHP endpoints during development
      {
        source: '/php/:path*',
        destination: `${devPhpBase}/api/:path*`,
      },
    ];
  },
  // --- GEMINI PROPOSED CHANGE END ---

  // --- OLD CODE TO BE DELETED START ---
  // async rewrites() {
  //   if (process.env.NODE_ENV === 'production') return []
  //   const devPhpBase = process.env.DEV_PHP_BASE || 'http://127.0.0.1:8000'
  //   return [
  //     // Explicit PHP prefix; avoids capturing /api/* owned by Next app
  //     { source: '/donna/api/:path*', destination: `${devPhpBase}/api/:path*` },
  //     // Development convenience:
  //     { source: '/php/:path*', destination: `${devPhpBase}/api/:path*` },
  //     // Optional fallback if needed for legacy calls
  //     // { source: '/api/:path*', destination: `${devPhpBase}/api/:path*` },
  //   ]
  // },
  // --- OLD CODE TO BE DELETED END ---

  // CORS for API routes is handled dynamically in middleware.ts (allowlist-based)
  // Avoid setting wildcard headers here to prevent overexposure
  // Legacy CORS headers preserved for compatibility but can be removed once middleware is fully tested
  async headers() {
    // CORS defaults for dev; production enforced via middleware.ts
    const allowOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*'
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Trace-ID' },
        ]
      }
    ]
  },

  // Bundle optimization
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}'
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}'
    }
  },

  // Experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
    // Optimize package imports
    optimizePackageImports: ['framer-motion', 'lucide-react', '@radix-ui/react-icons']
  },

  // Transpile floating-ui packages to fix ESM re-export issues
  transpilePackages: ['@floating-ui/core', '@floating-ui/dom', '@floating-ui/utils'],
}

export default withBundleAnalyzer(withSentryConfig(nextConfig, { silent: true }))


// (wrapped by withSentryConfig)
