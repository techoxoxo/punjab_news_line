'use client'

import React, { useState, useEffect } from 'react'
import { FallbackImage } from './fallback-image'
import { advtImageUrl } from '@/lib/image'
import type { Advertisement } from '@/lib/types'
import { AdImpressionTracker } from './ad-impression-tracker'

interface AdPlacementProps {
  ads: Advertisement[]
  page: string
  position: string
  className?: string
  /**
   * Homepage balancing. All ads targeted at the page (any position) form one pool, newest first:
   *  - the first `maxPerSide * 2` ads alternate between the left and right columns
   *    (1st -> left, 2nd -> right, 3rd -> left ...), at most `maxPerSide` per column;
   *  - any further ads overflow into the top banner strip.
   * Render one AdPlacement per area ('left', 'right', 'overflow') with the same `page`.
   */
  balanceSide?: 'left' | 'right' | 'overflow'
  maxPerSide?: number
}

import { getClientIp } from '@/lib/geo-client'

interface Coords {
  lat: number
  lon: number
}

// Helper to retrieve browser coordinates (HTML5 Geolocation)
function getBrowserLocation(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      },
      () => {
        resolve(null)
      },
      { timeout: 3000, enableHighAccuracy: false }
    )
  })
}

// Global promise cache to avoid duplicate API calls for multiple placements on one page
let lastIpCheck: string | null = null
let lastCoordsCheck: string | null = null
let geoCheckPromise: Promise<{ in_fence: boolean }> | null = null

async function getGeoCheck(ip: string | null, coords: Coords | null) {
  const coordsKey = coords ? `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}` : 'none'
  if (ip !== lastIpCheck || coordsKey !== lastCoordsCheck || !geoCheckPromise) {
    lastIpCheck = ip
    lastCoordsCheck = coordsKey
    geoCheckPromise = (async () => {
      let url = '/api/ads/geo-check'
      const params = new URLSearchParams()
      
      if (ip) params.set('ip', ip)
      if (coords) {
        params.set('lat', coords.lat.toString())
        params.set('lon', coords.lon.toString())
      }
      
      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }
      
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error()
        return await res.json()
      } catch {
        return { in_fence: false }
      }
    })()
  }
  return geoCheckPromise
}

export function AdPlacement({ ads, page, position, className = '', balanceSide, maxPerSide = 4 }: AdPlacementProps) {
  const [isInGeoFence, setIsInGeoFence] = useState<boolean | null>(null)

  // 1. Initial check if any active ad in this placement actually needs geo-fencing check
  const hasGeoAds = ads.some(ad => ad.geo_enabled)

  useEffect(() => {
    if (!hasGeoAds) {
      setIsInGeoFence(true) // No need to perform geo lookup if no ads are geofenced
      return
    }

    getBrowserLocation().then(coords => {
      getClientIp().then(ip => {
        getGeoCheck(ip, coords).then(data => {
          setIsInGeoFence(data.in_fence)
        })
      })
    })
  }, [hasGeoAds])

  // If we haven't loaded the geo-fence status yet, don't render anything to avoid layout flashing
  if (hasGeoAds && isInGeoFence === null) {
    return null
  }

  // Filter ads for this specific placement & check compliance/dates
  const filteredAds = ads.filter(ad => {
    if (!ad.advt_body) return false

    // ── Date constraint check ───────────────────────────────────────────────
    const now = new Date()
    if (ad.start_date) {
      const start = new Date(ad.start_date)
      if (now < start) return false
    }
    if (ad.end_date) {
      const end = new Date(ad.end_date)
      // Set end date to end of day (23:59:59)
      end.setHours(23, 59, 59, 999)
      if (now > end) return false
    }

    // ── Geo-Fencing enforcement ──────────────────────────────────────────────
    if (ad.geo_enabled && !isInGeoFence) {
      return false // Block/hide the ad since user is outside the active fence
    }

    // ── Target Placement matching ────────────────────────────────────────────
    const parts = ad.advt_body.split('|').map(s => s.trim())
    if (parts.length < 2) return false
    
    let adPage = parts[0].toLowerCase()
    let adPos = parts[1].toLowerCase()
    let targetPage = page.toLowerCase()

    if (adPage === 'homepage') adPage = 'home'
    if (targetPage === 'homepage') targetPage = 'home'
    
    const matchesPage = adPage === 'everywhere' || adPage === targetPage
    const matchesPos = balanceSide ? true : adPos === 'everywhere' || adPos === position.toLowerCase()
    return matchesPage && matchesPos
  })

  // Split the shared pool: first maxPerSide*2 ads alternate left/right, the rest overflow to the top strip.
  // Sorted by code so every placement derives the same order independently.
  const sidebarCapacity = maxPerSide * 2
  const visibleAds = balanceSide
    ? [...filteredAds]
        .sort((a, b) => b.advt_code - a.advt_code)
        .filter((_, i) =>
          balanceSide === 'overflow'
            ? i >= sidebarCapacity
            : i < sidebarCapacity && (i % 2 === 0) === (balanceSide === 'left')
        )
    : filteredAds

  if (visibleAds.length === 0) return null

  // Banners: 1 ad = full width, 2+ ads = equal-width 2-column grid (an odd last ad spans the full row).
  // Sidebar columns: stacked, one ad per row.
  const isBannerSlot = balanceSide === 'overflow' || (!balanceSide && (position === 'top' || position === 'bottom'))
  const wrapperClass = isBannerSlot
    ? `grid grid-cols-1 gap-4 ${visibleAds.length > 1 ? 'md:grid-cols-2' : ''} ${className}`
    : `space-y-4 ${className}`

  return (
    <div className={wrapperClass}>
      {visibleAds.map((ad, adIndex) => {
        const spansFullRow = isBannerSlot && visibleAds.length > 1 && visibleAds.length % 2 === 1 && adIndex === visibleAds.length - 1
        const hasLink = ad.permalink && ad.permalink.trim() !== ''
        const href = hasLink 
          ? (ad.permalink.startsWith('http') ? ad.permalink : `https://${ad.permalink}`)
          : null

        const parts = ad.advt_body?.split('|').map(s => s.trim()) || []
        const isTopOrBottom = isBannerSlot
        
        // If there's content after the second pipe, it might be HTML or custom content
        const hasHtml = parts.length > 2 && (parts[2].includes('<') || parts[2].includes('http'))
        const htmlContent = parts.slice(2).join('|')
        
        const content = (
          <div className={`relative ${isTopOrBottom ? 'aspect-[97/25] min-h-[80px]' : 'aspect-square min-h-[250px]'} bg-white flex items-center justify-center overflow-hidden rounded-lg`}>
             {hasHtml ? (
                <div className="w-full h-full p-2 overflow-hidden flex items-center justify-center" dangerouslySetInnerHTML={{ __html: htmlContent }} />
             ) : (
                <FallbackImage
                  src={ad.advt_image || advtImageUrl(ad.advt_code, ad.updated_at)}
                  alt={ad.advt_head || 'Advertisement'}
                  width={isTopOrBottom ? 970 : 400}
                  height={isTopOrBottom ? 250 : 400}
                  unoptimized
                  className="w-full h-full object-contain group-hover:scale-[1.01] transition-transform duration-700"
                />
             )}
          </div>
        )

        if (hasLink) {
          return (
            <React.Fragment key={ad.advt_code}>
              <AdImpressionTracker advtCode={ad.advt_code} />
              <a 
                href={href!}
                target="_blank"
                rel="noopener noreferrer"
                className={`block group overflow-hidden rounded-lg border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all duration-500 ${spansFullRow ? 'md:col-span-2' : ''}`}
              >
                {content}
              </a>
            </React.Fragment>
          )
        }

        return (
          <React.Fragment key={ad.advt_code}>
            <AdImpressionTracker advtCode={ad.advt_code} />
            <div 
              className={`block group overflow-hidden rounded-lg border border-slate-100 shadow-sm transition-all duration-500 ${spansFullRow ? 'md:col-span-2' : ''}`}
            >
              {content}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
