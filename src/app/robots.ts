import { env } from '@/env'

export const BASE_URL = env.NEXT_PUBLIC_VERCEL_URL
  ? `${env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
