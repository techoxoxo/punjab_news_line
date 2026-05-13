import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdvtByPermalink } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const advertisement = await getAdvtByPermalink(slug)
  if (!advertisement) return { title: 'Not Found' }

  const title = advertisement.advt_head ?? 'Advertisement'
  const description = advertisement.advt_body?.replace(/<[^>]+>/g, ' ').slice(0, 160) ?? ''
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/advertisement/${advertisement.permalink}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function AdvertisementPage({ params }: Props) {
  const { slug } = await params
  const advertisement = await getAdvtByPermalink(slug)
  if (!advertisement) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">Home</Link>
        {' › '}
        <Link href="/advertisement" className="hover:underline">Advertisement</Link>
        {' › '}
        <span>{advertisement.advt_head}</span>
      </nav>

      <article>
        <h1 className="text-3xl font-bold leading-tight mb-6">
          {advertisement.advt_head}
        </h1>
        {advertisement.advt_body && (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: advertisement.advt_body }} />
        )}
      </article>
    </main>
  )
}
