'use client'

import { useEffect, useRef } from 'react'
import { getClientIp } from '@/lib/geo-client'

interface AdImpressionTrackerProps {
  advtCode: number
  pageUrl?: string
}

export function AdImpressionTracker({ advtCode, pageUrl }: AdImpressionTrackerProps) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !advtCode) return
    fired.current = true

    const url = pageUrl ?? window.location.pathname

    // Fire-and-forget – resolve client IP first
    ;(async () => {
      let clientIp = null
      try {
        clientIp = await getClientIp()
      } catch {
        // Fallback to backend headers
      }

      try {
        await fetch('/api/ads/impression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            advt_code: advtCode, 
            page_url: url,
            ip: clientIp || undefined
          }),
          keepalive: true,
        })
      } catch {
        // Silent catch
      }
    })()
  }, [advtCode, pageUrl])

  return null
}
