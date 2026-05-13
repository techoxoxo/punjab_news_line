import { NextResponse } from 'next/server'
import { getSpotlightArticles, getArticlesBySegment } from '@/lib/queries'

export async function GET() {
  try {
    const [breaking, topMost, topNews] = await Promise.all([
      getArticlesBySegment(17, 1, 5), // Breaking News (General/Latest: 17)
      getSpotlightArticles(5),        // Top Most (Spotlight: 15)
      getArticlesBySegment(16, 1, 5), // Top News (Segment 16)
    ])

    const trending = [
      ...breaking.map(a => ({ title: a.article_head, type: 'Breaking News', permalink: a.permalink })),
      ...topMost.map(a => ({ title: a.article_head, type: 'Top Most', permalink: a.permalink })),
      ...topNews.map(a => ({ title: a.article_head, type: 'Top News', permalink: a.permalink })),
    ]

    return NextResponse.json(trending)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending news' }, { status: 500 })
  }
}
