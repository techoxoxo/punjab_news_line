import type { Metadata } from 'next'
import { searchArticles, getSearchCount, getActiveAdvertisements } from '@/lib/queries'
import { formatCompactDate } from '@/lib/format'
import { Pagination } from '@/components/public/pagination'
import { SectionHeader } from '@/components/public/section-header'
import { StoryCard } from '@/components/public/story-card'
import { AdPlacement } from '@/components/public/ad-placement'

export const metadata: Metadata = {
  title: 'Search Results | Punjab Newsline',
  description: 'Search articles on Punjab Newsline',
  robots: { index: false, follow: true },
}

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 24

  const [results, totalCount, ads] = q.trim().length >= 2
    ? await Promise.all([
        searchArticles(q.trim(), pageNum, limit),
        getSearchCount(q.trim()),
        getActiveAdvertisements()
      ])
    : [[], 0, await getActiveAdvertisements()]

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-12">
      <div className="border-b border-slate-100 pb-12">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Search</h1>
        
        <form method="GET" action="/search" className="mt-8 max-w-2xl relative group">
          <div className="relative flex items-center gap-3 rounded-full border border-slate-200 bg-white px-8 py-4 shadow-sm ring-brand/10 transition-all duration-300 focus-within:border-brand focus-within:ring-4 focus-within:shadow-xl">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search stories, topics, and archives..."
              className="w-full bg-transparent text-lg outline-none placeholder:text-slate-400 font-bold text-slate-800"
              autoFocus
            />
            <button
              type="submit"
              className="bg-brand text-white px-8 py-2 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20"
            >
              Search
            </button>
          </div>
        </form>
      </div>


      {q && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
            {totalCount > 0
              ? `Found ${totalCount.toLocaleString()} results for "${q}"`
              : `No results found for "${q}"`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {results.map((article, i) => (
          <StoryCard 
            key={article.article_code} 
            article={article} 
            priority={i < 3}
          />
        ))}
      </div>

      <AdPlacement ads={ads} page="search" position="bottom" />

      {results.length > 0 && (
        <Pagination 
          currentPage={pageNum} 
          totalPages={totalPages} 
          baseUrl="/search" 
        />
      )}

      {q && results.length === 0 && (
        <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">We couldn't find any matches for your query.</p>
        </div>
      )}
    </div>
  )
}
