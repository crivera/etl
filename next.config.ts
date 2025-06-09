import type { NextConfig } from 'next'

import { env } from './src/env'

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // headers: async () => [
  //   {
  //     source: '/(.*)',
  //     headers: [
  //       {
  //         key: 'X-Frame-Options',
  //         value: 'DENY',
  //       },
  //       {
  //         key: 'X-XSS-Protection',
  //         value: '1; mode=block',
  //       },
  //       {
  //         key: 'X-Content-Type-Options',
  //         value: 'nosniff',
  //       },
  //       {
  //         key: 'Referrer-Policy',
  //         value: 'strict-origin-when-cross-origin',
  //       },
  //       {
  //         key: 'Content-Security-Policy',
  //         value: [
  //           "default-src 'self'",
  //           // Next.js needs these
  //           "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  //           // Needed for Tailwind/Shadcn
  //           "style-src 'self' 'unsafe-inline' https:",
  //           // Add this line to allow data: fonts
  //           "font-src 'self' data: https:",
  //           // For images including avatars
  //           "img-src 'self' data: https: blob:",
  //           // If you use web workers or service workers
  //           "worker-src 'self' blob:",
  //           // For API calls, SWR, external services
  //           "connect-src 'self' https: wss:",
  //           // iframes
  //           "frame-src 'self' https:",
  //           // Prevent embedding in iframes
  //           "frame-ancestors 'none'",
  //         ].join('; '),
  //       },
  //       {
  //         key: 'Strict-Transport-Security',
  //         value: 'max-age=31536000',
  //       },
  //       {
  //         key: 'Access-Control-Allow-Origin',
  //         value: env.NEXT_PUBLIC_VERCEL_URL ?? '',
  //       },
  //       {
  //         key: 'Access-Control-Allow-Methods',
  //         value: 'GET, POST, PUT, DELETE, OPTIONS',
  //       },
  //     ],
  //   },
  // ],
}

export default nextConfig
