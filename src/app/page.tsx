import { 
  getLatestArticles, 
  getArticlesByCategory, 
  getArticlesBySegment,
  getSpotlightArticles,
  getArticleCountByCategory,
  getActivePoll, 
  getLatestGalleries, 
  getLatestVideos, 
  getArticleCount,
  getActiveAdvertisements
} from '@/lib/queries'
import { StoryCard } from '@/components/public/story-card'
import { SectionHeader } from '@/components/public/section-header'
import Link from 'next/link'
import { FallbackImage } from '@/components/public/fallback-image'
import { articleImageUrl } from '@/lib/image'
import { formatCompactDate, decodeHtml } from '@/lib/format'
import { SpotlightSlider } from '@/components/public/spotlight-slider'
import { GallerySection } from '@/components/public/gallery-section'
import { Pagination } from '@/components/public/pagination'
import { AdPlacement } from '@/components/public/ad-placement'
import { Camera, PlayCircle } from 'lucide-react'
import { OpinionPoll } from '@/components/public/opinion-poll'

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { page } = await searchParams
  const currentPage = parseInt(page || '1')
  const limit = 24

  // Parallel data fetching for performance
  const [
    topMostArticles,
    topNewsArticles,
    latestStories,
    activePoll, 
    opinionArticles, 
    globalArticles, 
    filmArticles,
    galleries,
    videos,
    totalArticleCount,
    ads
  ] = await Promise.all([
    getSpotlightArticles(10), // Spotlight Logic: All today, min 10
    getArticlesBySegment(16, 1, 8),  // Top News: 16
    getLatestArticles(currentPage, limit, 17), // Main Feed: General: 17
    getActivePoll(),
    getArticlesByCategory(16, 1, 4), // Opinion: 16 (Category)
    getArticlesByCategory(11, 1, 4), // Global News: 11 (Category)
    getArticlesByCategory(25, 1, 4), // Films & TV: 25 (Category)
    getLatestGalleries(4),
    getLatestVideos(4),
    getArticleCount(),
    getActiveAdvertisements()
  ])
  
  // Data slicing for the complex grid (only if we're on page 1)
  const isFirstPage = currentPage === 1
  const leftHeadlines = topNewsArticles
  const punjabArticles = latestStories.filter(a => a.category_name?.toLowerCase().includes('punjab')).slice(0, 5)
  const totalPages = Math.ceil(totalArticleCount / limit)

  // Map PollX options to a displayable array
  const pollDisplayOptions = activePoll ? [
    { text: activePoll.poll1, count: activePoll.count1 },
    { text: activePoll.poll2, count: activePoll.count2 },
    { text: activePoll.poll3, count: activePoll.count3 },
    { text: activePoll.poll4, count: activePoll.count4 },
    { text: activePoll.poll5, count: activePoll.count5 },
    { text: activePoll.poll6, count: activePoll.count6 },
  ].filter(opt => opt.text && opt.text.trim() !== '' && opt.text !== '-') : []

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Punjab Newsline',
    alternateName: 'ਪੰਜਾਬ ਨਿਊਜ਼ਲਾਈਨ',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://www.facebook.com/punjabnewsline',
      'https://twitter.com/punjabnewsline',
      'https://www.youtube.com/@PunjabNewslinetv',
    ],
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Punjab Newsline',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="pb-24">

      {/* 1. Hero Section - Only show on first page to emphasize latest news */}
      {isFirstPage && (
        <section className="container mx-auto max-w-8xl px-2 sm:px-4 lg:px-8 pt-6">
          <div className="premium-card bg-white p-4 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr_300px]">
              
              {/* Left: Top News */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="h-6 w-1 rounded-full bg-brand" />
                  <h2 className="font-display text-base font-black uppercase tracking-[0.2em] text-slate-900">Top News</h2>
                </div>
                <div className="space-y-3">
                  {leftHeadlines.map((article, idx) => (
                    <Link 
                      key={article.article_code} 
                      href={`/news/${article.permalink}`}
                      className="group block p-4 rounded-2xl border border-slate-100 bg-white hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-brand/30 group-hover:text-brand transition-colors">0{idx + 1}</span>
                        <span className="h-px flex-1 bg-slate-100 group-hover:bg-brand/10 transition-all" />
                      </div>
                      <h3 className="font-display text-base font-bold leading-snug text-slate-800 group-hover:text-brand transition-colors line-clamp-3">
                        {decodeHtml(article.article_head)}
                      </h3>
                    </Link>
                  ))}
                </div>
                {/* Sidebar Ad Placement to fill space */}
                <div className="pt-8 border-t border-slate-50">
                  <AdPlacement ads={ads} page="home" position="left" />
                </div>
              </div>

              {/* Center: Featured Spotlight Slider */}
              <div className="lg:col-span-1">
                {topMostArticles.length > 0 && (
                  <SpotlightSlider articles={topMostArticles} />
                )}

                {/* Secondary Breaking Cards - Fills space and ensures no white gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {latestStories.slice(10, 12).map((article) => (
                      <Link 
                        key={article.article_code} 
                        href={`/news/${article.permalink}`}
                        className="group flex flex-col p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 transition-all duration-500"
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand mb-3">Breaking</span>
                        <h4 className="font-display text-base font-bold leading-snug text-slate-800 group-hover:text-brand transition-colors line-clamp-3">
                          {decodeHtml(article.article_head)}
                        </h4>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-black text-slate-300">
                          <span className="h-1 w-1 rounded-full bg-slate-200" />
                          {formatCompactDate(article.date)}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>

              {/* Right: Punjab Regional */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="h-6 w-1 rounded-full bg-brand-blue" />
                  <h2 className="font-display text-base font-black uppercase tracking-[0.2em] text-slate-900">Punjab Hub</h2>
                </div>
                <div className="space-y-3">
                  {punjabArticles.map((article) => (
                    <Link 
                      key={article.article_code} 
                      href={`/news/${article.permalink}`}
                      className="group block p-4 rounded-2xl border border-slate-100 bg-white hover:border-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/5 transition-all duration-300"
                    >
                      <h3 className="font-display text-base font-bold leading-snug text-slate-800 group-hover:text-brand-blue transition-colors line-clamp-3">
                        {decodeHtml(article.article_head)}
                      </h3>
                    </Link>
                  ))}
                  
                  <Link href="/category/punjab" className="mt-4 flex items-center justify-center gap-3 w-full py-5 rounded-2xl bg-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-white hover:bg-brand transition-all shadow-xl shadow-slate-900/10">
                    Region Archive
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>

                {/* Sidebar Ad - Showing top-positioned ad content */}
                <AdPlacement ads={ads} page="homepage" position="top" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Main Content Feed */}
      <section className="mx-auto max-w-8xl px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          
          {/* Main News Columns */}
          <div className="space-y-12">
            <SectionHeader 
              eyebrow={isFirstPage ? "The Latest Report" : `Page ${currentPage} of ${totalPages}`}
              title="Daily Headlines"
              description="A curated selection of the most impactful stories from across the globe."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestStories.map((article) => (
                <StoryCard key={article.article_code} article={article} />
              ))}
            </div>

            {/* Pagination at bottom of feed */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              baseUrl="/" 
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-10">
            {/* Editor's Choice */}
            <div className="premium-card p-8 border-slate-100 bg-white shadow-sm">
              <h3 className="font-display text-lg font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                <span className="h-4 w-1 bg-brand" />
                Editor&apos;s Choice
              </h3>
              <div className="space-y-6">
                {latestStories.slice(15, 19).map((article) => (
                  <Link key={article.article_code} href={`/news/${article.permalink}`} className="group flex gap-4 items-start">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                      <FallbackImage src={articleImageUrl(article.article_code, 0, article.date)} alt="Story" fill sizes="64px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h4 className="font-display text-sm font-bold leading-snug text-slate-800 group-hover:text-brand transition-colors line-clamp-2">
                      {decodeHtml(article.article_head)}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>

            {/* Opinion Section */}
            {opinionArticles.length > 0 && (
              <div className="premium-card p-8 border-brand/10 bg-slate-50/50">
                <h3 className="font-display text-lg font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                  <span className="h-4 w-1 bg-brand" />
                  Opinion & Analysis
                </h3>
                <div className="space-y-6">
                  {opinionArticles.map((article) => (
                    <Link key={article.article_code} href={`/news/${article.permalink}`} className="group flex gap-4 items-start">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                        <FallbackImage src={articleImageUrl(article.article_code, 0, article.date)} alt="Story" fill sizes="64px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h4 className="font-display text-sm font-bold leading-snug text-slate-800 group-hover:text-brand transition-colors line-clamp-2">
                        {decodeHtml(article.article_head)}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Opinion Poll */}
            {activePoll && (
              <OpinionPoll 
                activePoll={activePoll} 
                pollDisplayOptions={pollDisplayOptions} 
              />
            )}

            {/* Sidebar Advertisement */}
            <AdPlacement ads={ads} page="homepage" position="right" className="mb-10" />

            {/* Global News */}
            {globalArticles.length > 0 && (
              <div className="premium-card p-8">
                <h3 className="font-display text-lg font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                  <span className="h-4 w-1 bg-brand-blue" />
                  Global News
                </h3>
                <div className="space-y-6">
                  {globalArticles.map((article) => (
                    <Link key={article.article_code} href={`/news/${article.permalink}`} className="group block border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-display text-sm font-bold leading-snug text-slate-800 group-hover:text-brand-blue transition-colors">
                        {decodeHtml(article.article_head)}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Films & TV */}
            {filmArticles.length > 0 && (
              <div className="premium-card p-8 border-brand-blue/10 bg-slate-50/50">
                <h3 className="font-display text-lg font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                  <span className="h-4 w-1 bg-brand-blue" />
                  Films & TV
                </h3>
                <div className="space-y-6">
                  {filmArticles.map((article) => (
                    <Link key={article.article_code} href={`/news/${article.permalink}`} className="group flex gap-4 items-start">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                        <FallbackImage src={articleImageUrl(article.article_code, 0, article.date)} alt="Story" fill sizes="64px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h4 className="font-display text-sm font-bold leading-snug text-slate-800 group-hover:text-brand-blue transition-colors line-clamp-2">
                        {decodeHtml(article.article_head)}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Bottom Advertisement */}
      <div className="mx-auto max-w-8xl px-4 lg:px-8 py-12">
        <AdPlacement ads={ads} page="homepage" position="bottom" />
      </div>

      {/* 3. Multimedia Gallery Section - Recreating the classic look from the screenshot */}
      <section className="mx-auto max-w-8xl px-4 lg:px-8">
        <GallerySection galleries={galleries} videos={videos} />
        
        <div className="flex justify-center pb-20">
           <Link href="/video-gallery" className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-white hover:bg-brand transition-all shadow-2xl shadow-slate-900/10">
            Explore All Media
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
      </main>
    </>
  )
}
