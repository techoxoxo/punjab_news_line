'use client'

/**
 * Retrieves the visitor's public IP address client-side.
 * Caches the result in sessionStorage to avoid duplicate requests.
 */
export async function getClientIp(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  // 1. Prioritize manual query parameter override (for QA/testing)
  const params = new URLSearchParams(window.location.search)
  const testIp = params.get('ip')
  if (testIp) return testIp

  // 2. Check cache to avoid hitting the public API on every route change
  try {
    const cachedIp = sessionStorage.getItem('pnl_client_ip')
    if (cachedIp) return cachedIp
  } catch {
    // Session storage disabled or unavailable
  }

  // 3. Resolve using a fast public IP lookup service with fallbacks
  // Try Primary: ipify.org
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    const res = await fetch('https://api64.ipify.org?format=json', {
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data?.ip) {
        const ip = data.ip.trim()
        try {
          sessionStorage.setItem('pnl_client_ip', ip)
        } catch {}
        return ip
      }
    }
  } catch (e) {
    // Fall back to next provider
  }

  // Try Fallback 1: icanhazip.com (returns plain text IP)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    const res = await fetch('https://icanhazip.com', {
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const ip = (await res.text()).trim()
      if (ip) {
        try {
          sessionStorage.setItem('pnl_client_ip', ip)
        } catch {}
        return ip
      }
    }
  } catch (e) {
    // Fall back to next provider
  }

  // Try Fallback 2: ipapi.co/ip/ (returns plain text IP)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    const res = await fetch('https://ipapi.co/ip/', {
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const ip = (await res.text()).trim()
      if (ip) {
        try {
          sessionStorage.setItem('pnl_client_ip', ip)
        } catch {}
        return ip
      }
    }
  } catch (e) {
    console.warn('All public IP client-side resolution providers failed.')
  }

  return null
}
