'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NotFound() {
  const pathname = usePathname()

  useEffect(() => {
    // Log 404 asynchronously — non-blocking
    fetch('/api/internal/log-404', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [pathname])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-8 text-center">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link href="/" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Go Home
        </Link>
        <Link href="/search" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Search
        </Link>
      </div>
    </main>
  )
}
