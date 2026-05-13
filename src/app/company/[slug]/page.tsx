import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCompanyByPermalink } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompanyByPermalink(slug)
  if (!company) return { title: 'Not Found' }

  const title = company.company_name ?? 'Company'
  const description = company.classified_desc?.replace(/<[^>]+>/g, ' ').slice(0, 160) ?? ''
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/company/${company.permalink}`

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

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params
  const company = await getCompanyByPermalink(slug)
  if (!company) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">Home</Link>
        {' › '}
        <Link href="/company" className="hover:underline">Company</Link>
        {' › '}
        <span>{company.company_name}</span>
      </nav>

      <article>
        <h1 className="text-3xl font-bold leading-tight mb-6">
          {company.company_name}
        </h1>
        {company.classified_desc && (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: company.classified_desc }} />
        )}
      </article>
    </main>
  )
}
