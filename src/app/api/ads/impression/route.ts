import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// ── Active regions cache (refresh every 5 min) ────────────────────────────
interface GeoRegion {
  slug: string
  lat_min: number | null
  lat_max: number | null
  lon_min: number | null
  lon_max: number | null
}

let regionCache: GeoRegion[] = []
let regionCacheAt = 0
const REGION_CACHE_TTL = 5 * 60 * 1000

async function getActiveRegions(): Promise<GeoRegion[]> {
  if (Date.now() - regionCacheAt < REGION_CACHE_TTL && regionCache.length > 0) {
    return regionCache
  }
  try {
    const rows = await query<GeoRegion>(
      `SELECT slug, lat_min, lat_max, lon_min, lon_max
       FROM geofence_regions
       WHERE is_active = TRUE
       ORDER BY sort_order`
    )
    regionCache = rows
    regionCacheAt = Date.now()
    return rows
  } catch {
    // Table may not exist yet on server — default to Punjab only
    return [{ slug: 'punjab', lat_min: 29.5, lat_max: 32.6, lon_min: 73.8, lon_max: 76.9 }]
  }
}

// ── Geo check ─────────────────────────────────────────────────────────────
function isInFence(
  regions: GeoRegion[],
  regionName: string,
  country: string,
  lat: number | null,
  lon: number | null
): boolean {
  if (regions.length === 0) return false
  const c = country.toLowerCase()
  if (c !== 'india' && c !== 'in') return false

  const r = regionName.toLowerCase().trim()

  for (const reg of regions) {
    if (r === reg.slug || r.includes(reg.slug) || reg.slug.includes(r)) return true
    if (
      lat !== null && lon !== null &&
      reg.lat_min !== null && reg.lat_max !== null &&
      reg.lon_min !== null && reg.lon_max !== null &&
      lat >= reg.lat_min && lat <= reg.lat_max &&
      lon >= reg.lon_min && lon <= reg.lon_max
    ) return true
  }
  return false
}

// ── IP Geo lookup ─────────────────────────────────────────────────────────
const isPrivateIP = (ip: string) =>
  ip === 'unknown' ||
  ip === '::1' ||
  ip.startsWith('127.') ||
  ip.startsWith('10.') ||
  ip.startsWith('172.16.') || ip.startsWith('172.17.') ||
  ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
  ip.startsWith('172.2') || ip.startsWith('172.30.') ||
  ip.startsWith('172.31.') ||
  ip.startsWith('192.168.')

async function lookupGeo(ip: string): Promise<{
  country: string; region: string; city: string
  lat: number | null; lon: number | null
} | null> {
  if (isPrivateIP(ip)) return null

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon`,
      { signal: AbortSignal.timeout(4000), cache: 'no-store' }
    )
    if (!res.ok) return null
    const d = await res.json()
    if (d.status !== 'success') return null
    return {
      country: d.country ?? '',
      region: d.regionName ?? '',
      city: d.city ?? '',
      lat: typeof d.lat === 'number' ? d.lat : null,
      lon: typeof d.lon === 'number' ? d.lon : null,
    }
  } catch (e) {
    console.error('[geo-lookup] failed for ip', ip, e)
    return null
  }
}

// ── Dedup: per IP+ad, 30-min window (5-min in dev) ───────────────────────
const recentImpressions = new Map<string, number>()
const DEDUP_MS = process.env.NODE_ENV === 'development'
  ? 2 * 60 * 1000   // 2 min in dev so you can test easily
  : 30 * 60 * 1000  // 30 min in prod

setInterval(() => {
  const now = Date.now()
  for (const [k, ts] of recentImpressions.entries()) {
    if (now - ts > DEDUP_MS) recentImpressions.delete(k)
  }
}, 5 * 60 * 1000)

// ── Handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const advtCode = Number(body?.advt_code)
    const pageUrl = String(body?.page_url ?? '').slice(0, 500)

    if (!advtCode || isNaN(advtCode) || advtCode <= 0) {
      return NextResponse.json({ error: 'Invalid ad code' }, { status: 400 })
    }

    // Bot detection
    const ua = req.headers.get('user-agent') ?? ''
    const isBot = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|twitterbot|linkedinbot/i.test(ua)
    if (isBot) return NextResponse.json({ counted: false, reason: 'bot' })

    // Get IP — use a unique per-device session-like key when IP is unavailable
    // Get IP — support body.ip override for testing/simulation
    const rawIp = body?.ip || (
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown'
    )

    // For dedup, use IP if real, else fall back to UA fingerprint so
    // different devices don't all share the same "unknown" slot
    const dedupKey = isPrivateIP(rawIp)
      ? `ua:${ua.slice(0, 60)}:${advtCode}`   // dev: differentiate by browser
      : `ip:${rawIp}:${advtCode}`

    const lastSeen = recentImpressions.get(dedupKey)
    if (lastSeen && Date.now() - lastSeen < DEDUP_MS) {
      return NextResponse.json({ counted: false, reason: 'dedup' })
    }
    recentImpressions.set(dedupKey, Date.now())

    // Load active regions
    const activeRegions = await getActiveRegions()

    // Geo lookup (simulated for private/local IPs if not overridden)
    let geo = null
    let inFence = false

    const isDev = process.env.NODE_ENV === 'development'
    if (isPrivateIP(rawIp) && !body?.ip && isDev) {
      // Simulate Punjab visitor on private network / localhost in dev only
      geo = {
        country: 'India',
        region: 'Punjab (Simulated)',
        city: 'Chandigarh',
        lat: 30.7333,
        lon: 76.7794
      }
      inFence = true
    } else {
      geo = await lookupGeo(rawIp)
      inFence = geo
        ? isInFence(activeRegions, geo.region, geo.country, geo.lat, geo.lon)
        : false
    }

    // Insert impression — always record, even without geo data
    await query(
      `INSERT INTO advt_impressions
        (advt_code, ip_address, country, region, city, latitude, longitude, is_in_fence, user_agent, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        advtCode,
        rawIp,
        geo?.country ?? null,
        geo?.region ?? null,
        geo?.city ?? null,
        geo?.lat ?? null,
        geo?.lon ?? null,
        inFence,
        ua.slice(0, 500),
        pageUrl,
      ]
    )

    return NextResponse.json({ counted: true, in_fence: inFence })
  } catch (err) {
    console.error('[ad-impression] error:', err)
    return NextResponse.json({ counted: false, reason: 'error' }, { status: 500 })
  }
}

// ── Debug GET (dev only) ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }
  const rows = await query(
    `SELECT advt_code, COUNT(*) as total,
            COUNT(*) FILTER(WHERE is_in_fence) as in_fence,
            MAX(recorded_at) as last_seen
     FROM advt_impressions
     GROUP BY advt_code
     ORDER BY total DESC`
  )
  const regionCount = await query(`SELECT COUNT(*) as n FROM geofence_regions WHERE is_active`)
  return NextResponse.json({ impressions: rows, active_regions: regionCount[0] })
}
