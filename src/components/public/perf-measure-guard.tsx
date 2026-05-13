'use client'

import { useEffect } from 'react'

export function PerfMeasureGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance?.measure) {
      return
    }

    const perf = window.performance as Performance & {
      __pnlOriginalMeasure?: Performance['measure']
      __pnlMeasurePatched?: boolean
    }

    if (perf.__pnlMeasurePatched) {
      return
    }

    const originalMeasure = perf.measure.bind(perf)
    perf.__pnlOriginalMeasure = originalMeasure
    perf.__pnlMeasurePatched = true

    perf.measure = ((...args: Parameters<Performance['measure']>) => {
      try {
        return originalMeasure(...args)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('cannot have a negative time stamp')) {
          return undefined as any
        }
        throw error
      }
    }) as Performance['measure']
  }, [])

  return null
}