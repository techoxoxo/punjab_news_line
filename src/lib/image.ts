const R2_URL = process.env.NEXT_PUBLIC_R2_URL ?? ''
const LOGO_URL = '/images/basic/logo.png'

/**
 * Cut-off ID for legacy images stored in /public/images.
 * Articles with code <= this will serve from local, > will serve from R2 bucket.
 */
const LEGACY_ID_THRESHOLD = 104080

export function articleImageUrl(articleCode: number, index = 0, timestamp?: Date | string | null | number): string {
  const basePath = articleCode <= LEGACY_ID_THRESHOLD ? '/images' : '/r2-images'
  const url = `${basePath}/news/full${articleCode}-${index}.jpg`
  if (timestamp) {
    const t = timestamp instanceof Date ? timestamp.getTime() : timestamp
    return `${url}?t=${t}`
  }
  return url
}


export function videoThumbUrl(videoCode: number): string {
  const basePath = videoCode <= LEGACY_ID_THRESHOLD ? '/images' : '/r2-images'
  return `${basePath}/news/full${videoCode}-0.jpg`
}

export function galleryImageUrl(galleryCode: number, index = 0): string {
  const isLegacy = galleryCode <= LEGACY_ID_THRESHOLD
  const basePath = isLegacy ? '/images' : '/r2-images'
  const subFolder = isLegacy ? 'gallery' : 'news'
  // Legacy gallery images don't use the -0 suffix
  const suffix = isLegacy && index === 0 ? '' : `-${index}`
  return `${basePath}/${subFolder}/full${galleryCode}${suffix}.jpg`
}

export function logoUrl(): string {
  return LOGO_URL
}

export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null
  // If it's already a clean ID, return it
  if (url.length === 11 && !url.includes('/') && !url.includes('?')) return url
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : url
}

export function getYoutubeThumb(url: string | null | undefined): string | null {
  const id = getYoutubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export function advtImageUrl(advtCode: number, timestamp?: Date | string | null | number): string {
  const url = `/r2-images/ads/full${advtCode}.jpg`
  if (timestamp) {
    const t = timestamp instanceof Date ? timestamp.getTime() : timestamp
    return `${url}?v=${t}`
  }
  return url
}
