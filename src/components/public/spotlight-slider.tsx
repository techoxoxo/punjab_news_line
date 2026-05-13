'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FallbackImage } from '@/components/public/fallback-image'
import { articleImageUrl } from '@/lib/image'
import { type Article } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { decodeHtml } from '@/lib/format'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

interface SpotlightSliderProps {
  articles: Article[]
}

export function SpotlightSlider({ articles }: SpotlightSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const slideToIndex = useCallback((newIndex: number) => {
    setDirection(newIndex > currentIndex ? 1 : -1)
    setCurrentIndex(newIndex)
  }, [currentIndex])

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length)
  }, [articles.length])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + articles.length) % articles.length)
  }, [articles.length])

  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [nextSlide, isHovered])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50
    if (info.offset.x < -swipeThreshold) {
      nextSlide()
    } else if (info.offset.x > swipeThreshold) {
      prevSlide()
    }
  }

  if (!articles.length) return null

  const currentStory = articles[currentIndex]

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '20%' : '-20%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '20%' : '-20%',
      opacity: 0,
      scale: 0.95
    })
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white">
        <div className="relative aspect-[4/5] md:aspect-auto md:h-[720px]">
          {articles.map((article, index) => {
            const isActive = index === currentIndex
            
            return (
              <motion.div
                key={article.article_code}
                initial={false}
                animate={{
                  x: `${(index - currentIndex) * 100}%`,
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 0.95,
                  zIndex: isActive ? 10 : 0
                }}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 35 },
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.4 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing p-4 md:p-10 flex flex-col"
              >
                <Link href={`/news/${article.permalink}`} className="block h-full flex flex-col">
                  {/* Header Info */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex rounded-full bg-brand px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-brand/20">
                        Spotlight Story
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                          Auto-Swiping...
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl lg:text-5xl font-black leading-tight text-slate-900 group-hover:text-brand-hover transition-colors tracking-tight line-clamp-2">
                      {decodeHtml(article.article_head)}
                    </h2>
                  </div>

                  {/* Image Container */}
                  <div className="relative flex-1 min-h-[300px] md:min-h-[400px] overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-slate-50 shadow-premium border border-slate-100">
                    <FallbackImage 
                      src={articleImageUrl(article.article_code, 0, article.date)}
                      alt={article.article_head ?? 'Featured'}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      priority={index === 0}
                    />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Navigation Arrows - Positioned relative to the whole container */}
      <div className="absolute bottom-[20%] inset-x-4 flex justify-between z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={(e) => { e.preventDefault(); prevSlide(); }}
          className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand hover:text-white hover:border-brand transition-all pointer-events-auto shadow-xl"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); nextSlide(); }}
          className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand hover:text-white hover:border-brand transition-all pointer-events-auto shadow-xl"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {articles.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.preventDefault(); slideToIndex(idx); }}
            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-brand' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
          />
        ))}
      </div>
      {/* Preload next images to prevent loading delay during swipe */}
      <div className="hidden">
        {articles.map((art) => (
          <img 
            key={art.article_code} 
            src={articleImageUrl(art.article_code, 0, art.date)} 
            alt="" 
            aria-hidden="true" 
          />
        ))}
      </div>
    </div>
  )
}
