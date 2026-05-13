'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { decodeHtml } from '@/lib/format'

interface TrendingItem {
  title: string
  type: string
  permalink: string
}

export function NewsTicker() {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/trending')
        const data = await res.json()
        if (Array.isArray(data)) {
          setItems(data)
        }
      } catch (error) {
        console.error('Failed to fetch trending news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="h-4 w-full bg-slate-200 rounded-full" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="ticker-wrap flex-1 overflow-hidden">
      <div className="ticker-content flex whitespace-nowrap gap-12">
        {/* We repeat the items twice for seamless scrolling */}
        {[...items, ...items].map((item, idx) => (
          <Link 
            key={`${item.permalink}-${idx}`}
            href={`/news/${item.permalink}`}
            className="flex items-center gap-3 group transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-brand px-2 py-0.5 bg-brand/5 rounded-md">
              {item.type}
            </span>
            <span className="text-sm font-bold text-slate-600 group-hover:text-brand transition-colors">
              {decodeHtml(item.title)}
            </span>
            <span className="text-slate-300 mx-2">•</span>
          </Link>
        ))}
      </div>
      <style jsx>{`
        .ticker-wrap {
          width: 100%;
          position: relative;
        }
        .ticker-content {
          animation: ticker 60s linear infinite;
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}
