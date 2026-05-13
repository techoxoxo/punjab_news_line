import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// proxy.ts — Next.js 16 Standard
// Handles: Admin Auth + DB-driven Redirects

export default withAuth(
  async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip static assets and internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        /\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/.test(pathname)
    ) {
        return NextResponse.next()
    }

    // 2. Protect Admin Routes (handled by withAuth wrap)
    if (pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    // 3. DB-driven Redirects Logic
    const redirectCheckUrl = new URL('/api/internal/redirect', request.url)
    redirectCheckUrl.searchParams.set('path', pathname)

    const searchParams = request.nextUrl.searchParams
    if (pathname.endsWith('.aspx')) {
        const legacyId = searchParams.get('id') || searchParams.get('ID')
        if (legacyId) {
            redirectCheckUrl.searchParams.set('id', legacyId)
            if (pathname.includes('video')) redirectCheckUrl.searchParams.set('kind', 'video')
            else if (pathname.includes('photo')) redirectCheckUrl.searchParams.set('kind', 'gallery')
            else if (pathname.includes('poll')) redirectCheckUrl.searchParams.set('kind', 'poll')
            else redirectCheckUrl.searchParams.set('kind', 'article')
        }
    }

    try {
        const res = await fetch(redirectCheckUrl, {
            headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN ?? 'dev' },
            signal: AbortSignal.timeout(2000),
        })

        if (res.ok) {
            const data = await res.json() as { destination: string; type: number } | null
            if (data?.destination) {
                const status = data.type === 302 ? 307 : 308
                return NextResponse.redirect(new URL(data.destination, request.url), { status })
            }
        }
    } catch {
        // Fallback to normal flow
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
          return !!token
        }
        return true
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
