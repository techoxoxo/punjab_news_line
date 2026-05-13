import type { Metadata } from 'next'
import { readFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Magazine',
  description: 'Browse Sunday Magazine editions from Punjab Newsline.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/magazine` },
}

type MagazineEdition = {
  code: string
  name: string
}

type Props = {
  searchParams: Promise<{ dt?: string; p?: string }>
}

const HTTPDOCS_ROOT = path.join(process.cwd(), '..', 'httpdocs')
const MAGAZINE_ROOT = path.join(HTTPDOCS_ROOT, 'magazine')

async function loadMagazineEditions(): Promise<MagazineEdition[]> {
  const xmlPath = path.join(HTTPDOCS_ROOT, 'rssfeed', 'magazine.xml')

  try {
    const xml = await readFile(xmlPath, 'utf8')
    const editions: MagazineEdition[] = []
    const itemPattern = /<item[^>]*>[\s\S]*?<code>([^<]+)<\/code>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/item>/g

    for (const match of xml.matchAll(itemPattern)) {
      editions.push({
        code: match[1].trim(),
        name: match[2].trim(),
      })
    }

    return editions
  } catch {
    return []
  }
}

function normalizeDateSegment(input?: string): string {
  if (!input) return ''
  const parsed = input.trim().replace(/-/g, '/').replace(/\.+/g, '/')
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(parsed)) return ''
  return parsed
}

function formatDisplayDate(dateSegment: string): string {
  if (!dateSegment) return 'Latest Edition'
  const [year, month, day] = dateSegment.split('/').map((v) => Number(v))
  const dt = new Date(Date.UTC(year, month - 1, day))
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await access(absolutePath)
    return true
  } catch {
    return false
  }
}

export default async function MagazinePage({ searchParams }: Props) {
  const editions = await loadMagazineEditions()
  const { dt, p } = await searchParams
  const dateSegment = normalizeDateSegment(dt)
  const pageCode = editions.find((edition) => edition.code === p)?.code ?? editions[0]?.code ?? '1'

  const selectedTitle = editions.find((edition) => edition.code === pageCode)?.name ?? `Page ${pageCode}`
  const editionPathPrefix = dateSegment ? `/magazine/${dateSegment}` : '/magazine'
  const folderPath = dateSegment ? path.join(MAGAZINE_ROOT, dateSegment) : MAGAZINE_ROOT

  const smallFile = path.join(folderPath, `small${pageCode}.jpg`)
  const fullFile = path.join(folderPath, `full${pageCode}.jpg`)
  const pdfFile = path.join(folderPath, 'pages.pdf')

  const hasSmall = await fileExists(smallFile)
  const hasFull = await fileExists(fullFile)
  const hasPdf = await fileExists(pdfFile)

  const smallPageSrc = hasSmall ? `${editionPathPrefix}/small${pageCode}.jpg` : '/images/basic/small-default.jpg'
  const fullPageHref = hasFull ? `${editionPathPrefix}/full${pageCode}.jpg` : '/images/basic/full-default.jpg'
  const pdfHref = `${editionPathPrefix}/pages.pdf`

  const pageNumber = Math.max(1, parseInt(pageCode, 10))
  const maxPage = Math.max(1, editions.length || 1)
  const prevPage = pageNumber > 1 ? pageNumber - 1 : 1
  const nextPage = pageNumber < maxPage ? pageNumber + 1 : maxPage
  const queryDate = dateSegment ? `&dt=${encodeURIComponent(dateSegment)}` : ''

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Sunday Feature</p>
          <h1 className="text-3xl font-bold">Magazine</h1>
          <p className="text-sm text-gray-600 mt-2">
            {formatDisplayDate(dateSegment)} · {selectedTitle}
          </p>
        </div>
        <Link
          href="/epaper"
          className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
        >
          View E-Paper
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-stone-50 to-white p-6 mb-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={`/magazine?p=1${queryDate}`} className="px-3 py-1 rounded border hover:bg-white">
            First
          </Link>
          <Link href={`/magazine?p=${prevPage}${queryDate}`} className="px-3 py-1 rounded border hover:bg-white">
            Previous
          </Link>
          <span className="px-3 py-1 rounded bg-white border">Page {pageNumber}</span>
          <Link href={`/magazine?p=${nextPage}${queryDate}`} className="px-3 py-1 rounded border hover:bg-white">
            Next
          </Link>
          <Link href={`/magazine?p=${maxPage}${queryDate}`} className="px-3 py-1 rounded border hover:bg-white">
            Last
          </Link>
          {hasPdf && (
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
            >
              View PDF
            </a>
          )}
        </div>
      </section>

      <section className="mb-8">
        <a href={fullPageHref} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={smallPageSrc}
            alt={`Magazine ${selectedTitle}`}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 object-contain"
          />
        </a>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Available Editions</h2>
        {editions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editions.map((edition) => (
              <Link
                key={edition.code}
                href={`/magazine?p=${edition.code}${queryDate}`}
                className="rounded-xl border border-gray-200 p-4 hover:border-gray-400 hover:shadow-sm transition-all"
              >
                <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm mb-4">
                  {edition.name}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{edition.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Page {edition.code}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
            Magazine editions are temporarily unavailable. Check back after the feed is migrated.
          </div>
        )}
      </section>
    </main>
  )
}
