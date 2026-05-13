import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { FallbackImage } from '@/components/public/fallback-image'
import { CalendarDays, Calendar, Clock3, ChevronRight, CircleUserRound, MessageSquare, Share2, Sparkles, Link as LinkIcon } from 'lucide-react'
import {
  getArticleByPermalink,
  getAllArticlePermalinks,
  getRelatedArticles,
  getArticleLanguageAlternates,
  getActiveAdvertisements,
} from '@/lib/queries'
import { articleImageUrl, galleryImageUrl, logoUrl, videoThumbUrl } from '@/lib/image'
import { LANG_CODE_LOCALE, type Article } from '@/lib/types'
import { formatDate, formatPublishedDate, formatCompactDate, decodeHtml, stripHtml } from '@/lib/format'
import { getPollByPermalink, getPollOptions, getLatestVideos, getLatestGalleries, getArticlesByCategory, getLatestArticles } from '@/lib/queries'
import { AdPlacement } from '@/components/public/ad-placement'
import { ViewTracker } from '@/components/public/view-tracker'
import { ArticleGallery } from '@/components/public/article-gallery'
import { ShareButton } from '@/components/public/share-button'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

function normalizeIncomingSlug(rawSlug: string): string {
  return decodeURIComponent(rawSlug)
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/[.\u200B\u200C\u200D\uFEFF\s]+$/g, '')
}

export async function generateStaticParams() {
  // Pre-generate top articles at build time — falls back to empty (full ISR) if DB not ready
  try {
    const permalinks = await getAllArticlePermalinks()
    return permalinks.slice(0, 1000).map((a) => ({ slug: a.permalink }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = normalizeIncomingSlug(rawSlug)
  const article = await getArticleByPermalink(slug)
  if (!article) return { title: 'Not Found' }

  const title = article.og_title ?? article.meta_title ?? article.article_head ?? ''
  const description = article.meta_desc ?? article.article_desc?.substring(0, 160) ?? ''
  const imageUrl = article.og_image ?? articleImageUrl(article.article_code, 0, article.date)

  const canonical = article.canonical_url
    ?? `${process.env.NEXT_PUBLIC_SITE_URL}/news/${article.permalink}`
  const locale = LANG_CODE_LOCALE[article.lang_code ?? 1] ?? 'pa_IN'
  const languages = await getArticleLanguageAlternates(article.article_code, article.permalink)

  return {
    title,
    description,
    keywords: article.meta_keys ?? undefined,
    authors: article.reporter ? [{ name: article.reporter }] : undefined,
    robots: article.no_index ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical,
      languages: Object.keys(languages).length > 0 ? languages : undefined,
    },
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: article.date?.toISOString(),
      locale,
      tags: [article.tag1, article.tag2, article.tag3].filter(Boolean) as string[],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug: rawSlug } = await params
  const decodedSlug = decodeURIComponent(rawSlug)
  const slug = normalizeIncomingSlug(rawSlug)
  const article = await getArticleByPermalink(slug)
  if (!article) notFound()

  if (decodedSlug !== article.permalink) {
    redirect(`/news/${encodeURIComponent(article.permalink)}`)
  }

  const related = article.cgry_code
    ? await getRelatedArticles(article.cgry_code, article.article_code, 5)
    : []

  const imageUrl = article.og_image ?? articleImageUrl(article.article_code, 0, article.date)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'
  const title = decodeHtml(article.og_title ?? article.meta_title ?? article.article_head ?? 'Punjab Newsline')
  const summary = decodeHtml(article.meta_desc ?? article.article_desc ?? article.subhead ?? article.article_sub ?? '')
  const eyebrow = article.category_name ?? article.tag1 ?? article.tag2 ?? article.tag3 ?? 'News'
  let poll = null as Awaited<ReturnType<typeof getPollByPermalink>>
  let pollOptions: Awaited<ReturnType<typeof getPollOptions>> = []
  let videos: Awaited<ReturnType<typeof getLatestVideos>> = []
  let galleries: Awaited<ReturnType<typeof getLatestGalleries>> = []

  let ads: Awaited<ReturnType<typeof getActiveAdvertisements>> = []
  
  let moreArticles: Article[] = []
  
  try {
    ;[poll, videos, galleries, ads, moreArticles] = await Promise.all([
      getPollByPermalink(article.permalink),
      getLatestVideos(3),
      getLatestGalleries(3),
      getActiveAdvertisements(),
      article.cgry_code ? getArticlesByCategory(article.cgry_code, 1, 8) : getLatestArticles(1, 8)
    ])
    // Filter out current article
    moreArticles = moreArticles.filter(a => a.article_code !== article.article_code).slice(0, 4)
    
    if (poll) {
      pollOptions = await getPollOptions(poll.poll_code)
    }
  } catch {
    // Non-blocking sidebar data
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': article.schema_type ?? 'NewsArticle',
    headline: article.article_head,
    description: article.article_desc,
    image: imageUrl,
    datePublished: article.date?.toISOString(),
    dateModified: article.date?.toISOString(),
    author: {
      '@type': 'Person',
      name: article.reporter ?? 'Punjab Newsline',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Punjab Newsline',
      logo: { '@type': 'ImageObject', url: logoUrl() },
    },
    mainEntityOfPage: `${siteUrl}/news/${article.permalink}`,
    keywords: [article.tag1, article.tag2, article.tag3].filter(Boolean).join(', '),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: eyebrow,
        item: article.cgry_code ? `${siteUrl}/category/${article.category_url}` : `${siteUrl}/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${siteUrl}/news/${article.permalink}`,
      },
    ],
  }

  return (
    <>
      <ViewTracker code={article.article_code} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="pb-24">
        {/* Article Header */}
        <section className="bg-white pt-6 pb-6 text-slate-900">
          <div className="container mx-auto max-w-7xl px-2 sm:px-4">
            <nav className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <Link href="/" className="hover:text-brand transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-brand">{eyebrow}</span>
            </nav>
            
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-3xl lg:text-4xl max-w-5xl">
              {title}
            </h1>
            
            {summary && (
              <p className="mt-4 max-w-4xl text-base font-medium leading-relaxed text-slate-500 md:text-lg">
                {summary}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Updated on: {formatDate(article.date)}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <ShareButton 
                  title={title} 
                  url={`${siteUrl}/news/${article.permalink}`} 
                  className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all"
                  iconClassName="h-4 w-4"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto max-w-7xl px-2 sm:px-4 py-8 pb-20">
          {/* Featured Image - Full Width Above Content */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl shadow-premium bg-white mb-2 border border-slate-100">
            {/* Main Foreground Image (Uncropped) */}
            <FallbackImage
              src={imageUrl}
              alt={title}
              fill
              className="relative z-10 object-contain"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
          </div>
          {article.photo_caption && (
            <div className="article-caption mb-6 text-center max-w-3xl mx-auto">
              {article.photo_caption}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <article className="space-y-8">

              {article.article_desc && (
                <div className="bg-slate-800 text-white p-8 md:p-10 rounded-3xl mb-12 relative overflow-hidden group shadow-2xl shadow-slate-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <span className="h-px w-8 bg-brand" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Quick Summary</span>
                  </div>
                  <p className="font-display text-xl md:text-2xl font-semibold leading-relaxed text-slate-100 tracking-tight relative z-10">
                    {decodeHtml(stripHtml(article.article_desc))}
                  </p>
                </div>
              )}

              {article.article_body && (
                <>
                  <div
                    className="article-body prose prose-lg md:prose-xl max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-brand"
                    dangerouslySetInnerHTML={{ 
                      __html: article.article_body.replace(
                        /<div data-type="custom-embed" data-code="([^"]*?)">.*?<\/div>/g,
                        (match, code) => {
                          // Decode the escaped HTML from the data-code attribute
                          const decoded = code
                            .replace(/&quot;/g, '"')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                          return `<div class="custom-embed-wrapper my-10">${decoded}</div>`
                        }
                      ) 
                    }}
                  />
                  
                  <style dangerouslySetInnerHTML={{ __html: `
                    .article-body .article-figure {
                      margin: 3rem auto !important;
                      max-width: 60% !important;
                      display: flex !important;
                      flex-direction: column !important;
                      align-items: center !important;
                      text-align: center !important;
                    }
                    .article-body .article-figure img {
                      margin-bottom: 0 !important;
                      margin-top: 0 !important;
                      display: block !important;
                    }
                    .article-body .article-figure figcaption {
                      margin-top: 0.125rem !important;
                      font-size: 0.8125rem !important;
                      font-weight: 600 !important;
                      color: #64748b !important;
                      font-style: italic !important;
                      padding: 0 1rem !important;
                      line-height: 1.4 !important;
                      opacity: 0.8 !important;
                      text-align: center !important;
                      width: 100% !important;
                    }
                     .article-caption {
                       font-size: 0.8125rem;
                       font-weight: 600;
                       color: #64748b;
                       font-style: italic;
                       padding: 0 1rem;
                       line-height: 1.4;
                       opacity: 0.8;
                       text-align: center;
                     }
                    /* Global Social Embed Reset - Ensures no borders/backgrounds on Twitter/Instagram */
                    .article-body .twitter-tweet, 
                    .article-body .instagram-media, 
                    .article-body [data-instgrm-version],
                    .article-body .custom-embed-wrapper {
                      border: none !important;
                      background: transparent !important;
                      padding: 0 !important;
                      margin-left: auto !important;
                      margin-right: auto !important;
                      box-shadow: none !important;
                      max-width: 400px !important; /* Even smaller embeds as requested */
                    }
                    .article-body .custom-embed-wrapper blockquote {
                      border: none !important;
                      padding: 0 !important;
                      background: transparent !important;
                      margin: 0 !important;
                    }
                    .article-body .twitter-tweet::before, 
                    .article-body .instagram-media::before, 
                    .article-body [data-instgrm-version]::before,
                    .article-body .custom-embed-wrapper blockquote::before {
                      display: none !important;
                    }
                    
                    /* Standard News Quote (Only for plain text quotes) */
                    .article-body blockquote:not(.twitter-tweet):not(.instagram-media):not([data-instgrm-version]) {
                      padding: 2rem 1.5rem;
                      margin: 3rem 0;
                      font-style: italic;
                      color: #1e293b;
                      border-radius: 0 1.5rem 1.5rem 0;
                      position: relative;
                    }
                    .article-body iframe {
                      width: 100% !important;
                      border-radius: 1.5rem;
                      margin: 2.5rem 0;
                      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    }
                    /* Twitter/Instagram rich card centering */
                    .article-body .twitter-tweet, 
                    .article-body .instagram-media {
                      margin-left: auto !important;
                      margin-right: auto !important;
                    }
                    .article-body .custom-embed-wrapper {
                      display: flex;
                      justify-content: center;
                      width: 100%;
                      margin: 3rem 0;
                    }
                    /* Aggressive reset for social media blockquotes */
                    .article-body blockquote.twitter-tweet, 
                    .article-body blockquote.instagram-media,
                    .article-body .custom-embed-wrapper blockquote {
                      border: none !important;
                      padding: 0 !important;
                      background: transparent !important;
                      box-shadow: none !important;
                    }
                    .article-body blockquote.twitter-tweet::before, 
                    .article-body blockquote.instagram-media::before,
                    .article-body .custom-embed-wrapper blockquote::before {
                      display: none !important;
                    }
                    /* Twitter/Instagram Link hydration style */
                    .article-body a[href*="twitter.com"], 
                    .article-body a[href*="x.com"],
                    .article-body a[href*="instagram.com"] {
                      display: block;
                      margin: 2rem auto;
                      text-align: center;
                    }
                  `}} />
                  
                  {/* Additional Images Gallery */}
                  <ArticleGallery articleCode={article.article_code} />

                  {/* Further Link / Source */}
                  {article.reflink && (
                    <div className="mt-6 p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-brand">
                          <LinkIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Further Information</h4>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">Explore more about this story at the external source</p>
                        </div>
                      </div>
                      <a 
                        href={article.reflink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand transition-all shadow-lg hover:shadow-brand/20 active:scale-95"
                      >
                        Visit Source
                      </a>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-6 border-y border-border py-8">
                <div className="flex flex-wrap gap-2">
                  {[article.tag1, article.tag2, article.tag3].filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-muted px-4 py-2 text-sm font-bold uppercase tracking-widest text-brand">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <ShareButton 
                    title={title} 
                    url={`${siteUrl}/news/${article.permalink}`} 
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-110"
                    iconClassName="h-5 w-5"
                  />
                </div>
              </div>

              {poll && (
                <div className="rounded-2xl bg-white p-8 text-slate-900 shadow-premium border border-slate-100 mt-20">
                  <h3 className="mb-6 font-display text-xl font-bold uppercase tracking-widest text-brand">Opinion Poll</h3>
                  <div className="space-y-4">
                    {pollOptions.map((option) => {
                      const totalVotes = pollOptions.reduce((sum, item) => sum + item.votes, 0)
                      const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
                      return (
                        <div key={option.option_code} className="group cursor-pointer">
                          <div className="mb-2 flex items-center justify-between text-sm font-bold">
                            <span>{option.option_text}</span>
                            <span className="text-brand">{pct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full bg-brand transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <button className="mt-8 w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white transition-transform hover:scale-105 shadow-lg shadow-slate-900/10">
                    Cast Your Vote
                  </button>
                </div>
              )}

              <div className="premium-card p-6 mt-20">
                <h3 className="mb-6 flex items-center gap-3 font-display text-xl font-bold uppercase tracking-widest text-foreground">
                  <span className="h-4 w-1.5 rounded-full bg-brand" />
                  Multimedia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.slice(0, 4).map((video) => (
                    <a key={video.video_code} href={`/video-gallery/${video.permalink}`} className="group block overflow-hidden rounded-xl border border-border bg-white">
                      <div className="relative aspect-video">
                        <FallbackImage
                          src={videoThumbUrl(video.video_code)}
                          alt={video.video_head ?? ''}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="line-clamp-2 font-display text-sm font-bold group-hover:text-brand transition-colors">
                          {video.video_head}
                        </h4>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </article>

            <aside className="space-y-8 sticky top-24 self-start">
              <AdPlacement ads={ads} page="article" position="right" className="mb-8" />
              <AdPlacement ads={ads} page="article" position="top" className="mb-8" />
              <div className="premium-card p-6">
                <h3 className="mb-6 flex items-center gap-3 font-display text-xl font-bold uppercase tracking-widest text-foreground">
                  <span className="h-4 w-1.5 rounded-full bg-brand" />
                  Related Stories
                </h3>
                <div className="space-y-6">
                  {related.map((relatedArticle) => (
                    <a key={relatedArticle.article_code} href={`/news/${relatedArticle.permalink}`} className="group block border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                          <FallbackImage
                            src={articleImageUrl(relatedArticle.article_code, 0, relatedArticle.date)}
                            alt={relatedArticle.article_head ?? 'Related'}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="line-clamp-2 font-display text-sm font-bold leading-tight group-hover:text-brand transition-colors">
                            {relatedArticle.article_head}
                          </h4>
                          {relatedArticle.date && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-light">
                              {formatCompactDate(relatedArticle.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* More Stories Section to Fill Space */}
        {moreArticles.length > 0 && (
          <section className="bg-slate-50 border-y border-slate-200 pt-16 pb-0">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-display text-2xl font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                  <span className="h-8 w-2 rounded-full bg-brand" />
                  More from {article.category_name || 'News'}
                </h3>
                <Link 
                  href={`/category/${article.category_url || ''}`}
                  className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand transition-colors"
                >
                  View All
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {moreArticles.map((item) => (
                  <a 
                    key={item.article_code} 
                    href={`/news/${item.permalink}`}
                    className="group flex flex-col space-y-4"
                  >
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                      <FallbackImage
                        src={articleImageUrl(item.article_code, 0, item.date)}
                        alt={item.article_head ?? ''}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand">
                        <Sparkles className="h-3 w-3" />
                        {item.category_name || 'News'}
                      </div>
                      <h4 className="font-display text-base font-bold leading-tight text-slate-900 group-hover:text-brand transition-colors line-clamp-2">
                        {item.article_head}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatCompactDate(item.date)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom Advertisement */}
        <div className="mx-auto max-w-8xl px-4 lg:px-8 pt-6 pb-0">
          <AdPlacement ads={ads} page="article" position="bottom" />
        </div>

        {/* Social Embed Hydration */}
        <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8" />
        <script async src="https://www.instagram.com/embed.js" />
        <script dangerouslySetInnerHTML={{ __html: `
          function hydrateSocialEmbeds() {
            if (window.twttr && window.twttr.widgets) {
              window.twttr.widgets.load();
            }
            if (window.instgrm && window.instgrm.Embeds) {
              window.instgrm.Embeds.process();
            }
          }

          // Use MutationObserver to detect when the article content is rendered or changed
          const observer = new MutationObserver((mutations) => {
            hydrateSocialEmbeds();
          });

          // Start observing the article body
          const articleBody = document.querySelector('.article-body');
          if (articleBody) {
            observer.observe(articleBody, { childList: true, subtree: true });
          }

          // Initial check
          hydrateSocialEmbeds();
          
          // Fallback interval for late-loading scripts
          const hydrationInterval = setInterval(hydrateSocialEmbeds, 1000);
          setTimeout(() => {
            clearInterval(hydrationInterval);
            // observer.disconnect(); // Keep observing for potential dynamic changes
          }, 10000);
        `}} />
      </main>
    </>
  )
}
