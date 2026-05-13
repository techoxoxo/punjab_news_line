import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { path, referrer } = await request.json() as { path: string; referrer?: string }
    if (!path || typeof path !== 'string') {
      return new Response('Bad Request', { status: 400 })
    }

    const userAgent = request.headers.get('user-agent')

    // Upsert: increment hits if path already logged, insert if new
    await query(
      `INSERT INTO error_log_404 (path, referrer, user_agent, hits, first_seen, last_seen)
       VALUES ($1, $2, $3, 1, NOW(), NOW())
       ON CONFLICT (path) DO UPDATE SET
         hits     = error_log_404.hits + 1,
         last_seen = NOW(),
         referrer  = COALESCE(EXCLUDED.referrer, error_log_404.referrer)`,
      [path.substring(0, 500), referrer?.substring(0, 500) ?? null, userAgent?.substring(0, 500) ?? null]
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
