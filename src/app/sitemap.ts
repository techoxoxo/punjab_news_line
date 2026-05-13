import type { MetadataRoute } from 'next'
import { query, queryOne } from '@/lib/db'

export const revalidate = 3600
const CHUNK_SIZE = 5000

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'

const staticPages: MetadataRoute.Sitemap = [
  { url: `${SITE}/`,              changeFrequency: 'hourly',  priority: 1.0 },
  { url: `${SITE}/business-news`, changeFrequency: 'daily',   priority: 0.8 },
  { url: `${SITE}/epaper`,        changeFrequency: 'daily',   priority: 0.7 },
  { url: `${SITE}/magazine`,      changeFrequency: 'weekly',  priority: 0.6 },
  { url: `${SITE}/video-gallery`, changeFrequency: 'daily',   priority: 0.7 },
  { url: `${SITE}/photo-gallery`, changeFrequency: 'daily',   priority: 0.7 },
  { url: `${SITE}/poll`,          changeFrequency: 'weekly',  priority: 0.5 },
  { url: `${SITE}/search`,        changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE}/archive`,       changeFrequency: 'monthly', priority: 0.4 },
]

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  return sitemapChunk(id)
}

export async function generateSitemaps() {
  try {
    const row = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM (
         SELECT permalink FROM ox_article WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
         UNION ALL
         SELECT permalink FROM ox_video WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
         UNION ALL
         SELECT permalink FROM ox_gallery WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
         UNION ALL
         SELECT permalink FROM ox_poll WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
         UNION ALL
         SELECT permalink FROM ox_advt WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
         UNION ALL
         SELECT permalink FROM ox_classified WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
         UNION ALL
         SELECT cgry_url AS permalink FROM ox_code
         UNION ALL
         SELECT url AS permalink FROM sitemap_overrides WHERE exclude = FALSE
       ) urls`
    )
    const total = parseInt(row?.total ?? '0', 10)
    const chunkCount = Math.max(1, Math.ceil(total / CHUNK_SIZE))
    return Array.from({ length: chunkCount }, (_, id) => ({ id }))
  } catch {
    return [{ id: 0 }]
  }
}

export async function sitemapChunk(id = 0): Promise<MetadataRoute.Sitemap> {
  const offset = id * CHUNK_SIZE
  try {
    const dynamic = await query<{
      path: string
      last_modified: Date | null
      change_frequency: string
      priority: number
    }>(
      `SELECT path, last_modified, change_frequency, priority
       FROM (
          SELECT ('/news/' || permalink) AS path, date AS last_modified, 'monthly'::text AS change_frequency, 0.8::numeric AS priority
          FROM ox_article
          WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
          UNION ALL
          SELECT ('/video-gallery/' || permalink) AS path, date AS last_modified, 'monthly'::text AS change_frequency, 0.7::numeric AS priority
          FROM ox_video
          WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
          UNION ALL
          SELECT ('/photo-gallery/' || permalink) AS path, date AS last_modified, 'monthly'::text AS change_frequency, 0.7::numeric AS priority
          FROM ox_gallery
          WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
          UNION ALL
          SELECT ('/poll/' || permalink) AS path, date AS last_modified, 'weekly'::text AS change_frequency, 0.4::numeric AS priority
          FROM ox_poll
          WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
          UNION ALL
          SELECT ('/advertisement/' || permalink) AS path, NULL::timestamptz AS last_modified, 'monthly'::text AS change_frequency, 0.3::numeric AS priority
          FROM ox_advt
          WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
          UNION ALL
          SELECT ('/company/' || permalink) AS path, NULL::timestamptz AS last_modified, 'monthly'::text AS change_frequency, 0.3::numeric AS priority
          FROM ox_classified
          WHERE active = 2 AND permalink IS NOT NULL AND permalink != ''
          UNION ALL
          SELECT ('/category/' || cgry_url) AS path, NULL::timestamptz AS last_modified, 'daily'::text AS change_frequency, 0.9::numeric AS priority
          FROM ox_code
         UNION ALL
         SELECT url AS path, last_modified, COALESCE(change_freq, 'monthly')::text AS change_frequency, COALESCE(priority, 0.5)::numeric AS priority
         FROM sitemap_overrides
         WHERE exclude = FALSE
       ) q
       ORDER BY last_modified DESC NULLS LAST, path ASC
       LIMIT $1 OFFSET $2`,
      [CHUNK_SIZE, offset]
    )

    const toUrl = (rawPath: string) => {
      if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath
      const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
      return `${SITE}${normalized}`
    }

    const entries: MetadataRoute.Sitemap = dynamic.map((row) => {
      const changeFrequency = (
        row.change_frequency === 'always' ||
        row.change_frequency === 'hourly' ||
        row.change_frequency === 'daily' ||
        row.change_frequency === 'weekly' ||
        row.change_frequency === 'monthly' ||
        row.change_frequency === 'yearly' ||
        row.change_frequency === 'never'
      ) ? row.change_frequency : 'monthly'
      return {
        url: toUrl(row.path),
        lastModified: row.last_modified ?? undefined,
        changeFrequency,
        priority: Number(row.priority),
      }
    })

    if (id === 0) {
      return [...staticPages, ...entries]
    }

    return entries
  } catch {
    return id === 0 ? staticPages : []
  }
}
