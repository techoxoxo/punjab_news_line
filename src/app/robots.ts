import type { MetadataRoute } from 'next'
import { getSiteSetting } from '@/lib/queries'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Allow DB override; fall back to sensible default
  const customRobots = await getSiteSetting('robots_txt').catch(() => null)

  if (customRobots) {
    // When admin has set custom robots.txt, serve it raw via a route handler
    // This function returns the structured object Next.js uses to build robots.txt
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
