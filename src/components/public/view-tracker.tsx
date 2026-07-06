'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  code: number
  type?: 'article' | 'video' | 'gallery'
}

export function ViewTracker({ code, type = 'article' }: ViewTrackerProps) {
  useEffect(() => {
    const payload = JSON.stringify({ 
      articleCode: code, // keep naming for backward compatibility if needed, but API now uses type
      type 
    })

    // Use sendBeacon if available (fires even if user navigates away immediately)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/articles/view', blob)
    } else {
      // Fallback: keepalive fetch so the request completes even after page unload
      fetch('/api/articles/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
    }
  }, [code, type])

  return null
}

