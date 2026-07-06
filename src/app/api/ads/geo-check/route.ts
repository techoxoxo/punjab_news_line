import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
       WHERE is_active = TRUE`
    )
    regionCache = rows
    regionCacheAt = Date.now()
    return rows
  } catch {
    return [{ slug: 'punjab', lat_min: 29.5, lat_max: 32.6, lon_min: 73.8, lon_max: 76.9 }]
  }
}

function isInFence(
  regions: GeoRegion[],
  regionName: string,
  country: string
): boolean {
  if (regions.length === 0) return false
  const c = country.toLowerCase()
  if (c !== 'india' && c !== 'in') return false

  const r = regionName.toLowerCase().trim()

  for (const reg of regions) {
    if (r && (r === reg.slug || r.includes(reg.slug) || reg.slug.includes(r))) return true
  }
  return false
}

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

const mapCfRegion = (code: string): string => {
  const c = code.toUpperCase().trim()
  const mapping: Record<string, string> = {
    'PB': 'punjab',
    'CH': 'chandigarh',
    'HR': 'haryana',
    'HP': 'himachal pradesh',
    'JK': 'jammu and kashmir',
    'DL': 'delhi',
    'RJ': 'rajasthan',
    'UP': 'uttar pradesh',
    'UT': 'uttarakhand',
    'UK': 'uttarakhand',
    'MP': 'madhya pradesh',
    'MH': 'maharashtra',
    'GJ': 'gujarat',
    'KA': 'karnataka',
    'TN': 'tamil nadu',
    'WB': 'west bengal',
    'BR': 'bihar',
    'TG': 'telangana',
    'TS': 'telangana',
    'AP': 'andhra pradesh',
    'KL': 'kerala',
    'OR': 'odisha',
    'OD': 'odisha',
    'AS': 'assam',
    'JH': 'jharkhand',
    'CT': 'chhattisgarh',
    'CG': 'chhattisgarh',
    'GA': 'goa',
    'MN': 'manipur',
    'ML': 'meghalaya',
    'TR': 'tripura',
    'NL': 'nagaland',
    'AR': 'arunachal pradesh',
    'MZ': 'mizoram',
    'SK': 'sikkim',
    'LA': 'ladakh',
    'PY': 'puducherry',
    'AN': 'andaman and nicobar islands',
    'LD': 'lakshadweep'
  }
  return mapping[c] ?? code.toLowerCase()
}

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
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const queryIp = searchParams.get('ip')

    const rawIp = queryIp || (
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown'
    )

    // Only simulate if it's a private IP AND the user didn't explicitly override it via query
    if (isPrivateIP(rawIp) && !queryIp && !searchParams.has('lat')) {
      const isDev = process.env.NODE_ENV === 'development'
      return NextResponse.json({
        in_fence: isDev,
        region: isDev ? 'Punjab (Simulated)' : 'Private IP',
        country: isDev ? 'India' : 'Local Network',
        ip: rawIp
      })
    }

    const activeRegions = await getActiveRegions()

    // 1. Check if user-supplied coordinates (HTML5 GPS) are provided
    const queryLat = searchParams.get('lat')
    const queryLon = searchParams.get('lon')
    const userLat = queryLat ? parseFloat(queryLat) : null
    const userLon = queryLon ? parseFloat(queryLon) : null

    if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
      let inFenceByCoords = false
      let matchedRegion = 'Outside Active Regions'
      
      for (const reg of activeRegions) {
        if (
          reg.lat_min !== null && reg.lat_max !== null &&
          reg.lon_min !== null && reg.lon_max !== null &&
          userLat >= reg.lat_min && userLat <= reg.lat_max &&
          userLon >= reg.lon_min && userLon <= reg.lon_max
        ) {
          inFenceByCoords = true
          matchedRegion = reg.slug
          break
        }
      }

      return NextResponse.json({
        in_fence: inFenceByCoords,
        region: matchedRegion,
        country: 'India',
        ip: rawIp,
        source: 'gps'
      })
    }

    // 2. Try Cloudflare geolocation headers (super-fast, reliable, no external APIs/rate-limiting)
    const cfCountry = req.headers.get('cf-ipcountry')
    const cfRegion = req.headers.get('cf-region')

    if (cfCountry && cfRegion && !queryIp) {
      const country = cfCountry.toLowerCase() === 'in' ? 'India' : cfCountry
      const region = mapCfRegion(cfRegion)

      const inFence = isInFence(activeRegions, region, country)

      return NextResponse.json({
        in_fence: inFence,
        region: region,
        country: country,
        ip: rawIp,
        source: 'cloudflare'
      })
    }

    // 3. Fall back to ip-api lookup
    const geo = await lookupGeo(rawIp)
    const inFence = geo
      ? isInFence(activeRegions, geo.region, geo.country)
      : false

    return NextResponse.json({
      in_fence: inFence,
      region: geo?.region ?? 'Unknown',
      country: geo?.country ?? 'Unknown',
      ip: rawIp,
      source: 'ip-api'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
