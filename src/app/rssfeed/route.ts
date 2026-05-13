import { NextResponse } from 'next/server'
import { getLatestArticles } from '@/lib/queries'
import { articleImageUrl } from '@/lib/image'

export async function GET() {
  const articles = await getLatestArticles(50)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://punjabnewsline.com'

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
  xmlns:media="http://search.yahoo.com/mrss/"
>
<channel>
  <title>Punjab Newsline | Latest News</title>
  <link>${siteUrl}</link>
  <description>Latest news from Punjab — politics, crime, sports, business in Punjabi, Hindi and English.</description>
  <language>en-in</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${siteUrl}/rssfeed" rel="self" type="application/rss+xml" />
  ${articles
    .map(
      (article) => {
        const imgUrl = article.og_image ?? articleImageUrl(article.article_code, 0, article.date);
        const fullImgUrl = imgUrl.startsWith('http') ? imgUrl : `${siteUrl}${imgUrl}`;
        
        return `
  <item>
    <title><![CDATA[${article.article_head}]]></title>
    <link>${siteUrl}/news/${article.permalink}</link>
    <guid isPermaLink="true">${siteUrl}/news/${article.permalink}</guid>
    <pubDate>${new Date(article.date ?? new Date()).toUTCString()}</pubDate>
    <category><![CDATA[${article.category_name || 'News'}]]></category>
    <description><![CDATA[${article.article_desc || article.subhead || ''}]]></description>
    <media:content url="${fullImgUrl}" medium="image" width="1200" height="630" />
  </item>`
      }
    )
    .join('')}
</channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
