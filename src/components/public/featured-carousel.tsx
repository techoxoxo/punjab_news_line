'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FallbackImage } from './fallback-image'
import { articleImageUrl } from '@/lib/image'
import type { Article } from '@/lib/types'

interface FeaturedCarouselProps {
  articles: Article[]
}

export function FeaturedCarousel({ articles }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [articles.length])

  if (!articles.length) return null

  const current = articles[currentIndex]

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl transition-all duration-700 hover:shadow-brand/20">
      <div className="relative aspect-[16/9] md:aspect-[21/9]">
        {articles.map((article, idx) => (
          <div
            key={article.article_code}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              idx === currentIndex ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-110 translate-x-8 pointer-events-none'
            }`}
          >
            <FallbackImage
              src={articleImageUrl(article.article_code)}
              alt={article.article_head ?? 'Featured story'}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority={idx === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-12 lg:p-16">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="inline-flex rounded-full bg-brand px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-brand/20">
                Featured Story
              </span>
              <span className="h-px w-12 bg-white/20" />
            </div>
            
            <Link href={`/news/${current.permalink}`} className="block group/link animate-slide-up">
              <h2 className="font-display text-2xl font-black leading-[1.1] text-white md:text-5xl lg:text-6xl tracking-tight transition-transform duration-500 group-hover/link:translate-x-2">
                {current.article_head}
              </h2>
            </Link>
            
            <p className="hidden max-w-2xl text-lg font-medium text-white/70 md:block leading-relaxed line-clamp-2 animate-slide-up [animation-delay:200ms]">
              {current.article_desc ?? current.subhead ?? 'Stay informed with the latest updates from Punjab Newsline.'}
            </p>

            <div className="flex items-center gap-8 pt-6 animate-slide-up [animation-delay:400ms]">
              <Link 
                href={`/news/${current.permalink}`}
                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-xl transition-all hover:scale-105 hover:bg-brand hover:text-white"
              >
                Read Full Story
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden flex-col gap-3 md:flex">
          {articles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex ? 'w-12 bg-brand shadow-lg shadow-brand/40' : 'w-4 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
