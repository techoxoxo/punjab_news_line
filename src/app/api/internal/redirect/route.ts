import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import type { SeoRedirect } from '@/lib/types'

// Internal-only route called by proxy.ts to look up DB redirects.
// Protected by a shared secret to prevent external abuse.

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-internal-token')
  if (token !== (process.env.INTERNAL_API_TOKEN ?? 'dev')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const path = searchParams.get('path')
  const id = searchParams.get('id')
  const kind = searchParams.get('kind') // article, video, gallery, poll

  if (id) {
    const numericId = parseInt(id)
    if (!isNaN(numericId)) {
      let table = 'ox_article'
      let prefix = '/news/'
      let idCol = 'article_code'

      if (kind === 'video') {
        table = 'ox_video'
        prefix = '/video-gallery/'
        idCol = 'video_code'
      } else if (kind === 'gallery') {
        table = 'ox_gallery'
        prefix = '/photo-gallery/'
        idCol = 'gallery_code'
      } else if (kind === 'poll') {
        table = 'ox_poll'
        prefix = '/poll/'
        idCol = 'poll_code'
      }

      try {
        const row = await queryOne<{ permalink: string }>(
          `SELECT permalink FROM ${table} WHERE ${idCol} = $1 LIMIT 1`,
          [numericId]
        )

        if (row?.permalink) {
          return NextResponse.json({ destination: `${prefix}${row.permalink}`, type: 301 })
        }
      } catch (err) {
        console.error('Redirect ID lookup failed:', err)
      }
    }
  }

  if (!path) return new Response('Bad Request', { status: 400 })

  try {
    const redirect = await queryOne<SeoRedirect>(
      `SELECT destination, type FROM seo_redirects WHERE source = $1 AND active = TRUE LIMIT 1`,
      [path]
    )

    if (!redirect) return NextResponse.json(null)

    // Fire-and-forget: increment hit counter
    queryOne(
      `UPDATE seo_redirects SET hits = hits + 1 WHERE source = $1`,
      [path]
    ).catch(() => {})

    return NextResponse.json({ destination: redirect.destination, type: redirect.type })
  } catch (err) {
    console.error('Redirect path lookup failed:', err)
    return NextResponse.json(null)
  }
}
