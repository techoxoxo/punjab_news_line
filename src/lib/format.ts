type DateLike = Date | string | number | null | undefined

function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(
  value: DateLike,
  locale = 'en-IN',
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }
): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, options).format(date)
}

export function formatPublishedDate(value: DateLike): string {
  return formatDate(value, 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatCompactDate(value: DateLike): string {
  return formatDate(value, 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Decodes common HTML entities like &#39;, &quot;, &amp;, etc.
 * Useful for rendering titles and descriptions that come encoded from the DB.
 */
export function decodeHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&apos;': "'",
    '&#39;': "'",
    '&#x27;': "'",
    '&hellip;': '...',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&ndash;': '-',
    '&mdash;': '—',
  }

  let text = html
  // Handle decimal entities like &#39;
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(Number(dec)))
  // Handle hex entities like &#x27;
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
  // Handle named entities
  text = text.replace(/&[a-z0-9]+;/gi, (match) => entities[match] || match)

  return text
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  // Remove HTML tags
  const stripped = html.replace(/<[^>]*>?/gm, '')
  // Then decode any remaining entities
  return decodeHtml(stripped)
}