import type { Metadata } from 'next'
import { getArticlesBySegment, getArticleCountBySegment, getActiveAdvertisements } from '@/lib/queries'
import { StoryCard } from '@/components/public/story-card'
import { Pagination } from '@/components/public/pagination'
import { AdPlacement } from '@/components/public/ad-placement'

type Props = {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Top News | Latest Breaking Stories',
    description: 'Stay updated with the latest Top News, breaking headlines, and in-depth reporting from Punjab Newsline.',
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/top-news` },
    openGraph: {
      title: 'Top News | Latest Breaking Stories',
      description: 'Stay updated with the latest Top News, breaking headlines, and in-depth reporting from Punjab Newsline.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Top News | Latest Breaking Stories',
      description: 'Stay updated with the latest Top News, breaking headlines, and in-depth reporting from Punjab Newsline.',
    },
  }
}

export default async function TopNewsPage({ searchParams }: Props) {
  const { page } = await searchParams
  const currentPage = parseInt(page || '1')
  const limit = 24

  const [articles, totalCount, ads] = await Promise.all([
    getArticlesBySegment(16, currentPage, limit),
    getArticleCountBySegment(16),
    getActiveAdvertisements()
  ])

  const totalPages = Math.ceil(totalCount / limit)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'

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
        name: 'Top News',
        item: `${siteUrl}/top-news`,
      },
    ],
  }

  return (
    <div className="space-y-12 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="border-b border-slate-100 pb-12">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Top News</h1>
        <p className="text-slate-500 font-medium mt-4 max-w-2xl text-lg">
          Stay informed with the most crucial, breaking, and popular stories curated by our editorial team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {articles.map((article, i) => (
          <StoryCard 
            key={article.article_code} 
            article={article} 
            priority={i < 3}
          />
        ))}
      </div>

      <AdPlacement ads={ads} page="category" position="bottom" />

      {articles.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          baseUrl="/top-news" 
        />
      )}

      {articles.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold uppercase tracking-widest">No articles found in this segment yet.</p>
        </div>
      )}
    </div>
  )
}
