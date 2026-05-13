import { FallbackImage } from './fallback-image'
import Link from 'next/link'
import type { Article } from '@/lib/types'
import { articleImageUrl } from '@/lib/image'
import { formatCompactDate, decodeHtml } from '@/lib/format'
import { ShareButton } from './share-button'

type StoryCardProps = {
  article: Article
  featured?: boolean
  compact?: boolean
  priority?: boolean
}

export function StoryCard({ article, featured = false, compact = false, priority = false }: StoryCardProps) {
  const title = decodeHtml(article.article_head ?? 'Untitled story')
  const tag = article.category_name ?? article.tag1 ?? article.tag2 ?? article.tag3 ?? 'Latest'
  const imageUrl = article.og_image ?? articleImageUrl(article.article_code, 0, article.date)

  const getCategoryColor = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('punjab')) return 'text-emerald-600 border-emerald-100 bg-emerald-50'
    if (lower.includes('business')) return 'text-sky-600 border-sky-100 bg-sky-50'
    if (lower.includes('film') || lower.includes('tv')) return 'text-purple-600 border-purple-100 bg-purple-50'
    if (lower.includes('sports')) return 'text-orange-600 border-orange-100 bg-orange-50'
    if (lower.includes('national') || lower.includes('india')) return 'text-brand border-brand/10 bg-brand/5'
    if (lower.includes('haryana')) return 'text-indigo-600 border-indigo-100 bg-indigo-50'
    if (lower.includes('himachal')) return 'text-amber-600 border-amber-100 bg-amber-50'
    if (lower.includes('delhi')) return 'text-blue-600 border-blue-100 bg-blue-50'
    if (lower.includes('uttar pradesh')) return 'text-rose-600 border-rose-100 bg-rose-50'
    if (lower.includes('jammu') || lower.includes('kashmir')) return 'text-cyan-600 border-cyan-100 bg-cyan-50'
    if (lower.includes('uttarakhand')) return 'text-teal-600 border-teal-100 bg-teal-50'
    return 'text-slate-500 border-slate-100 bg-slate-50'
  }

  const categoryStyle = getCategoryColor(tag)

  return (
    <Link
      href={`/news/${article.permalink}`}
      className={`group block bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-brand/10 hover:-translate-y-1 ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      {/* 1. Image Area - Premium Contain technique to prevent cropping */}
      <div className={`relative overflow-hidden bg-white ${featured ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {/* Main Image */}
        <FallbackImage
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes={featured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
          priority={priority}
        />
        
        {/* Category Overlay - Small & Premium */}
        <div className="absolute top-3 left-3 z-20">
           <span className={`inline-flex px-2.5 py-1 rounded-lg border backdrop-blur-md text-[10px] font-black uppercase tracking-wider shadow-sm ${categoryStyle}`}>
             {tag}
           </span>
        </div>
      </div>
      
      {/* 2. Content Area - Reduced Padding & Optimized Typography */}
      <div className="p-5">
        <h3 className={`font-display font-bold leading-tight text-slate-900 group-hover:text-brand-hover transition-colors line-clamp-3 ${
          featured ? 'text-xl md:text-2xl' : 'text-base'
        }`}>
          {title}
        </h3>
        
        <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-t border-slate-50 pt-3">
           <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-brand/30 group-hover:bg-brand transition-colors" />
             <span>{article.reporter || 'Editorial'}</span>
           </div>
           <div className="flex items-center gap-4">
             <span>{formatCompactDate(article.date)}</span>
             <ShareButton 
               title={title} 
               url={`/news/${article.permalink}`} 
               className="h-6 w-6 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-brand hover:border-brand/20 transition-all"
               iconClassName="h-3 w-3"
             />
           </div>
        </div>
      </div>
    </Link>
  )
}