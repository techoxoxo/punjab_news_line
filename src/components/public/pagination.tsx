import React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageUrl = (p: number | string) => {
    return `${baseUrl}?page=${p}`
  }

  // Generate page range
  const pages = []
  const delta = 2
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <Link
        href={getPageUrl(Math.max(1, currentPage - 1))}
        className={`p-3 rounded-2xl border border-slate-200 text-slate-400 transition-all ${
          currentPage === 1 ? 'pointer-events-none opacity-20' : 'hover:bg-slate-50 hover:text-brand'
        }`}
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>

      <div className="flex items-center gap-2">
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={`dots-${i}`} className="px-3 text-slate-300 font-black">...</span>
          ) : (
            <Link
              key={p}
              href={getPageUrl(p)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                p === currentPage
                  ? 'bg-brand text-white shadow-xl shadow-brand/20 scale-110'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-brand'
              }`}
            >
              {p}
            </Link>
          )
        ))}
      </div>

      <Link
        href={getPageUrl(Math.min(totalPages, currentPage + 1))}
        className={`p-3 rounded-2xl border border-slate-200 text-slate-400 transition-all ${
          currentPage === totalPages ? 'pointer-events-none opacity-20' : 'hover:bg-slate-50 hover:text-brand'
        }`}
      >
        <ChevronRight className="h-6 w-6" />
      </Link>
    </div>
  )
}
