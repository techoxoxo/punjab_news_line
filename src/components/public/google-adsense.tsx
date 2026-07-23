'use client'

import Script from 'next/script'

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-8249733130908714'

export function GoogleAdSense() {
  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
      crossOrigin="anonymous"
    />
  )
}
