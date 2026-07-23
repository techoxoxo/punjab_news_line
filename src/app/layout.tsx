import type { Metadata, Viewport } from 'next'
import { Manrope, Noto_Sans_Gurmukhi } from 'next/font/google'
import './globals.css'
import { SiteChrome } from '@/components/public/site-chrome'
import { PerfMeasureGuard } from '@/components/public/perf-measure-guard'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'

const uiFont = Manrope({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})

const bodyFont = Noto_Sans_Gurmukhi({
  subsets: ['gurmukhi', 'latin'],
  variable: '--font-body',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Punjab Newsline | ਪੰਜਾਬ ਨਿਊਜ਼ਲਾਈਨ',
    template: '%s | Punjab Newsline',
  },
  description: 'Latest news from Punjab — politics, crime, sports, business in Punjabi, Hindi and English.',
  openGraph: {
    siteName: 'Punjab Newsline',
    locale: 'pa_IN',
    type: 'website',
    title: 'Punjab Newsline | ਪੰਜਾਬ ਨਿਊਜ਼ਲਾਈਨ',
    description: 'Latest news from Punjab — politics, crime, sports, business in Punjabi, Hindi and English.',
    images: [{ url: '/images/basic/logo.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Punjab Newsline',
    description: 'Latest news from Punjab — politics, crime, sports, business in Punjabi, Hindi and English.',
    site: '@punjabnewsline',
    images: ['/images/basic/logo.png'],
  },
  robots: { 
    index: true, 
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { 
    languages: {
      'en-IN': '/en',
      'hi-IN': '/hi',
      'pa-IN': '/pa',
    }
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/basic/icon.png',
  },
  other: {
    'google-adsense-account': 'ca-pub-8249733130908714',
  },
}

import { Providers } from '@/components/providers'
import { GoogleAnalytics } from '@/components/public/google-analytics'
import { GoogleAdSense } from '@/components/public/google-adsense'
import { Toaster } from 'sonner'
import { getActiveCategoryCodes } from '@/lib/queries'

import Script from 'next/script'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const activeCategoryCodes = await getActiveCategoryCodes()
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-35WP2WQDDD'
  
  return (
    <html lang="pa" className={`${uiFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <GoogleAnalytics />
        <GoogleAdSense />
        <Toaster position="top-right" richColors />
        <Providers>
          <PerfMeasureGuard />
          <SiteChrome activeCategoryCodes={activeCategoryCodes}>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  )
}
