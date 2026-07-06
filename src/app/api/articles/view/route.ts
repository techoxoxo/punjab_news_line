import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// In-memory dedup: key = `${ip}:${articleCode}`, value = timestamp
// Prevents counting the same IP viewing the same article more than once per 30 min.
// This map lives per-instance (per-pod), which is fine — minor double-counts across
// pods are acceptable. A Redis-based solution can be added later for strict accuracy.
const recentViews = new Map<string, number>()
const COOLDOWN_MS = 60 * 1000 // Reduced to 1 minute for better accuracy

// Periodically clean up old entries to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of recentViews.entries()) {
    if (now - ts > COOLDOWN_MS) {
      recentViews.delete(key)
    }
  }
}, 60 * 1000) // clean up every minute

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const articleCode = Number(body?.articleCode)
    const type = body?.type || 'article'

    if (!articleCode || isNaN(articleCode) || articleCode <= 0) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Get real visitor IP
    const ip =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown'


    // Skip bots / crawlers based on User-Agent
    const ua = req.headers.get('user-agent') ?? ''
    
    // Refined bot detection: 
    // - Common crawlers/bots
    // - Social media PREVIEW bots (usually missing Mozilla/5.0)
    // - We want to COUNT real users in WhatsApp/FB in-app browsers
    const isCommonBot = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|google.*preview|preview.*google|headless|lighthouse/i.test(ua)
    const isSocialPreview = (ua.includes('WhatsApp') || ua.includes('Telegram')) && !ua.includes('Mozilla/')
    
    if (isCommonBot || isSocialPreview || ip === 'unknown') {
      return NextResponse.json({ counted: false, reason: ip === 'unknown' ? 'no-ip' : 'bot' })
    }

    // Dedup check
    const dedupKey = `${type}:${ip}:${articleCode}`
    const lastSeen = recentViews.get(dedupKey)
    if (process.env.NODE_ENV !== 'development' && lastSeen && Date.now() - lastSeen < COOLDOWN_MS) {
      return NextResponse.json({ counted: false, reason: 'dedup' })
    }


    // Record view
    recentViews.set(dedupKey, Date.now())
    
    if (type === 'video') {
      await query(
        `UPDATE ox_video SET hits = COALESCE(hits, 0) + 1 WHERE video_code = $1`,
        [articleCode]
      )
    } else if (type === 'gallery') {
      await query(
        `UPDATE ox_gallery SET hits = COALESCE(hits, 0) + 1 WHERE gallery_code = $1`,
        [articleCode]
      )
    } else {
      await query(
        `UPDATE ox_article SET hits = COALESCE(hits, 0) + 1 WHERE article_code = $1`,
        [articleCode]
      )
    }

    return NextResponse.json({ counted: true })
  } catch (err) {
    console.error('[view-track] error:', err)
    return NextResponse.json({ counted: false, reason: 'error' })
  }
}

