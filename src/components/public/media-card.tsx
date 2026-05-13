import Link from 'next/link'
import type { ReactNode } from 'react'
import { decodeHtml, stripHtml } from '@/lib/format'
import { FallbackImage } from './fallback-image'

type MediaCardProps = {
  href: string
  title: string
  kind: 'Video' | 'Gallery'
  description?: string | null
  dateLabel?: string
  icon: ReactNode
  image?: string | null
  accent?: 'green' | 'gold' | 'forest'
}

const accentMap = {
  green: 'from-emerald-50 via-white to-emerald-50 text-emerald-900',
  gold: 'from-amber-50 via-white to-amber-50 text-amber-900',
  forest: 'from-sky-50 via-white to-sky-50 text-slate-900',
}

export function MediaCard({ href, title, kind, description, dateLabel, icon, image, accent = 'green' }: MediaCardProps) {
  return (
    <Link
      href={href}
      className="group premium-card flex flex-col h-full overflow-hidden bg-white border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-brand/10"
    >
      <div className="relative flex flex-col flex-grow bg-white p-8">
        {/* Background Patterns & Overlays */}
        {image ? (
          <>
            <div className="absolute inset-0 z-0">
              <FallbackImage src={image} alt="" fill className="object-cover blur-3xl opacity-20 scale-125" sizes="100px" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/95 via-white/80 to-white/40" />
            </div>
            {/* Visible Thumbnail Overlay */}
            <div className="absolute top-8 right-8 z-20 h-24 w-32 overflow-hidden rounded-xl border border-white/50 shadow-2xl rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700">
               <FallbackImage src={image} alt="" fill className="object-cover" sizes="128px" />
               <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5" />
          </>
        )}
        
        <div className="relative z-10 flex h-full flex-col justify-between gap-8 flex-grow">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-black/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 backdrop-blur-xl border border-black/5 shadow-sm">
              {kind}
            </span>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-brand backdrop-blur-2xl border border-black/5 transition-all duration-700 group-hover:rotate-[360deg] group-hover:bg-brand group-hover:text-white group-hover:border-brand group-hover:shadow-[0_0_30px_rgba(230,46,52,0.4)]">
              {icon}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-display text-xl font-black leading-tight tracking-tight text-slate-900 md:text-2xl group-hover:text-brand-hover transition-colors line-clamp-3">
              {decodeHtml(title)}
            </h3>
            {description && (
              <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500 group-hover:text-slate-700 transition-colors">
                {stripHtml(description)}
              </p>
            )}
          </div>

          <div className="mt-auto pt-6 flex items-center justify-between border-t border-black/5">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_10px_rgba(230,46,52,0.4)]" />
              {dateLabel ?? 'Updated recently'}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 opacity-0 transition-all duration-500 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 shadow-xl">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}