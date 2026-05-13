'use client'

import React from 'react'
import { FallbackImage } from './fallback-image'
import { advtImageUrl } from '@/lib/image'
import type { Advertisement } from '@/lib/types'

interface AdPlacementProps {
  ads: Advertisement[]
  page: string
  position: string
  className?: string
}

export function AdPlacement({ ads, page, position, className = '' }: AdPlacementProps) {
  // Filter ads for this specific placement
  const filteredAds = ads.filter(ad => {
    if (!ad.advt_body) return false
    const parts = ad.advt_body.split('|').map(s => s.trim())
    if (parts.length < 2) return false
    
    const adPage = parts[0].toLowerCase()
    const adPos = parts[1].toLowerCase()
    
    const matchesPage = adPage === 'everywhere' || adPage === page.toLowerCase()
    const matchesPos = adPos === 'everywhere' || adPos === position.toLowerCase()
    return matchesPage && matchesPos
  })

  if (filteredAds.length === 0) return null

  return (
    <div className={`space-y-4 ${className}`}>
      {filteredAds.map(ad => {
        const hasLink = ad.permalink && ad.permalink.trim() !== ''
        const href = hasLink 
          ? (ad.permalink.startsWith('http') ? ad.permalink : `https://${ad.permalink}`)
          : null

        const parts = ad.advt_body?.split('|').map(s => s.trim()) || []
        const isTopOrBottom = position === 'top' || position === 'bottom'
        
        // If there's content after the second pipe, it might be HTML or custom content
        const hasHtml = parts.length > 2 && (parts[2].includes('<') || parts[2].includes('http'))
        const htmlContent = parts.slice(2).join('|')
        
        const content = (
          <div className={`relative ${isTopOrBottom ? 'min-h-[100px]' : 'aspect-square min-h-[250px]'} bg-white flex items-center justify-center overflow-hidden rounded-lg`}>
             {hasHtml ? (
               <div className="w-full h-full p-2 overflow-hidden flex items-center justify-center" dangerouslySetInnerHTML={{ __html: htmlContent }} />
             ) : (
               <FallbackImage
                 src={ad.advt_image || advtImageUrl(ad.advt_code)}
                 alt={ad.advt_head || 'Advertisement'}
                 width={isTopOrBottom ? 970 : 400}
                 height={isTopOrBottom ? 250 : 400}
                 unoptimized
                 className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-700"
               />
             )}
          </div>
        )

        if (hasLink) {
          return (
            <a 
              key={ad.advt_code}
              href={href!}
              target="_blank"
              rel="noopener noreferrer"
              className="block group overflow-hidden rounded-lg border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all duration-500"
            >
              {content}
            </a>
          )
        }

        return (
          <div 
            key={ad.advt_code}
            className="block group overflow-hidden rounded-lg border border-slate-100 shadow-sm transition-all duration-500"
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
