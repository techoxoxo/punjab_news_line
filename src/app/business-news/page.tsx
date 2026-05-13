import type { Metadata } from 'next'
import { getArticlesByCategory, getCategoryByUrl } from '@/lib/queries'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Business News',
  description: 'Latest business and economic news from Punjab.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/business-news` },
}

export default async function BusinessNewsPage() {
  let category: Awaited<ReturnType<typeof getCategoryByUrl>> = null
  let articles:  Awaited<ReturnType<typeof getArticlesByCategory>> = []
  try {
    category = await getCategoryByUrl('business-news')
    articles = category ? await getArticlesByCategory(category.cgry_code, 1, 24) : []
  } catch { /* DB not ready */ }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {category?.seo_h1 ?? category?.cgry_name ?? 'Business News'}
      </h1>
      {category?.seo_intro && (
        <p className="text-gray-600 mb-6">{category.seo_intro}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <a key={article.article_code} href={`/news/${article.permalink}`}
             className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="font-semibold line-clamp-3">{article.article_head}</h2>
            {article.date && (
              <p className="text-xs text-gray-400 mt-2">
                {new Date(article.date).toLocaleDateString('pa-IN')}
              </p>
            )}
          </a>
        ))}
      </div>
    </main>
  )
}
