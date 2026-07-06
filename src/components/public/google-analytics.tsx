'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-35WP2WQDDD'

function AnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (GA_MEASUREMENT_ID && window.gtag) {
      const url = pathname + searchParams.toString()
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      })
    }
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
