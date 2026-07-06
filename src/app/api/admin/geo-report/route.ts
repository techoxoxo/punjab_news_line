import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const advtCode = searchParams.get('advt_code') ? Number(searchParams.get('advt_code')) : null
    const from = searchParams.get('from') // ISO date string
    const to = searchParams.get('to')

    // Build WHERE conditions
    const conditions: string[] = []
    const params: unknown[] = []
    let pIdx = 1

    if (advtCode) {
      conditions.push(`i.advt_code = $${pIdx++}`)
      params.push(advtCode)
    }
    if (from) {
      conditions.push(`i.recorded_at >= $${pIdx++}`)
      params.push(from)
    }
    if (to) {
      conditions.push(`i.recorded_at <= $${pIdx++}`)
      params.push(to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 1. Summary per campaign
    const summary = await query(
      `SELECT
         a.advt_code,
         a.advt_head AS campaign_name,
         COUNT(i.id)                                      AS total_impressions,
         COUNT(i.id) FILTER (WHERE i.is_in_fence = TRUE)  AS punjab_impressions,
         COUNT(i.id) FILTER (WHERE i.is_in_fence = FALSE) AS outside_impressions,
         ROUND(
           100.0 * COUNT(i.id) FILTER (WHERE i.is_in_fence = TRUE) / NULLIF(COUNT(i.id), 0), 2
         )                                                AS punjab_pct,
         MIN(i.recorded_at)                               AS first_impression,
         MAX(i.recorded_at)                               AS last_impression
       FROM ox_advt a
       LEFT JOIN advt_impressions i ON a.advt_code = i.advt_code
       ${where}
       GROUP BY a.advt_code, a.advt_head
       ORDER BY total_impressions DESC`,
      params
    )

    // 2. Daily breakdown (for chart)
    const daily = await query(
      `SELECT
         DATE_TRUNC('day', i.recorded_at AT TIME ZONE 'Asia/Kolkata') AS day,
         i.advt_code,
         COUNT(*)                                         AS impressions,
         COUNT(*) FILTER (WHERE i.is_in_fence = TRUE)    AS punjab_impressions
       FROM advt_impressions i
       ${where}
       GROUP BY day, i.advt_code
       ORDER BY day DESC`,
      params
    )

    // 3. City breakdown (Punjab cities only)
    const cities = await query(
      `SELECT
         i.city,
         i.advt_code,
         COUNT(*)                                         AS impressions
       FROM advt_impressions i
       ${where ? where + ' AND i.is_in_fence = TRUE' : 'WHERE i.is_in_fence = TRUE'}
       GROUP BY i.city, i.advt_code
       ORDER BY impressions DESC
       LIMIT 30`,
      params
    )

    // 4. Overall geo compliance totals
    const totals = await query(
      `SELECT
         COUNT(*)                                          AS total_impressions,
         COUNT(*) FILTER (WHERE is_in_fence = TRUE)       AS punjab_impressions,
         COUNT(*) FILTER (WHERE is_in_fence = FALSE)      AS outside_impressions,
         COUNT(DISTINCT ip_address)                       AS unique_visitors,
         COUNT(DISTINCT ip_address) FILTER (WHERE is_in_fence = TRUE) AS unique_punjab_visitors
       FROM advt_impressions i
       ${where}`,
      params
    )

    return NextResponse.json({
      summary,
      daily,
      cities,
      totals: totals[0] ?? {},
      generated_at: new Date().toISOString(),
      filters: { advtCode, from, to },
    })
  } catch (err: any) {
    console.error('[geo-report] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
