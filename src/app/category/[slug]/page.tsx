import type { Metadata } from 'next'
import { getCategoryByUrl, getArticlesByCategory, getArticleCountByCategory, getActiveAdvertisements } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { StoryCard } from '@/components/public/story-card'
import { Pagination } from '@/components/public/pagination'
import { AdPlacement } from '@/components/public/ad-placement'
import { decodeHtml } from '@/lib/format'

type Props = { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryByUrl(slug)
  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.cgry_name} | Latest News`,
    description: `Stay updated with the latest ${category.cgry_name} news, headlines, and in-depth reporting from Punjab Newsline.`,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${slug}` },
    openGraph: {
      title: `${category.cgry_name} | Latest News`,
      description: `Stay updated with the latest ${category.cgry_name} news, headlines, and in-depth reporting from Punjab Newsline.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.cgry_name} | Latest News`,
      description: `Stay updated with the latest ${category.cgry_name} news, headlines, and in-depth reporting from Punjab Newsline.`,
    },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page } = await searchParams
  const currentPage = parseInt(page || '1')
  const limit = 24

  const category = await getCategoryByUrl(slug)
  if (!category) notFound()

  const [articles, totalCount, ads] = await Promise.all([
    getArticlesByCategory(category.cgry_code, currentPage, limit),
    getArticleCountByCategory(category.cgry_code),
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
        name: category.cgry_name,
        item: `${siteUrl}/category/${slug}`,
      },
    ],
  }

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="border-b border-slate-100 pb-12">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">{decodeHtml(category.cgry_name)}</h1>
        <p className="text-slate-500 font-medium mt-4 max-w-2xl text-lg">
          Latest updates, news stories, and deep dives into {decodeHtml(category.cgry_name)} from Punjab Newsline.
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
          baseUrl={`/category/${slug}`} 
        />
      )}

      {articles.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold uppercase tracking-widest">No articles found in this category yet.</p>
        </div>
      )}
    </div>
  )
}
