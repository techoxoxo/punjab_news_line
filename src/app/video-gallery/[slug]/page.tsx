import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVideoByPermalink } from '@/lib/queries'
import { logoUrl } from '@/lib/image'
import { LANG_CODE_MAP } from '@/lib/types'
import { decodeHtml } from '@/lib/format'

import { ViewTracker } from '@/components/public/view-tracker'

function getYoutubeId(url: string | null): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : url
}

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const video = await getVideoByPermalink(slug)
  if (!video) return { title: 'Not Found' }

  const title = video.meta_title ?? video.video_head ?? ''
  const description = video.meta_desc ?? video.video_desc?.substring(0, 160) ?? ''
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/video-gallery/${video.permalink}`
  const locale = LANG_CODE_MAP[video.lang_code ?? 1]

  const imageUrl = video.vlink ? `https://img.youtube.com/vi/${getYoutubeId(video.vlink)}/hqdefault.jpg` : logoUrl()

  return {
    title,
    description,
    robots: video.no_index ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical,
      languages: locale ? { [locale]: canonical } : undefined,
    },
    openGraph: { 
      title, 
      description, 
      type: 'video.other',
      images: [{ url: imageUrl, width: 1200, height: 630 }]
    },
    twitter: { 
      card: 'summary_large_image', 
      title, 
      description,
      images: [imageUrl]
    },
  }
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params
  const video = await getVideoByPermalink(slug)
  if (!video) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.video_head,
    description: video.video_desc,
    uploadDate: video.date?.toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'Punjab Newsline',
      logo: { '@type': 'ImageObject', url: logoUrl() },
    },
    url: `${siteUrl}/video-gallery/${video.permalink}`,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Video Gallery',
        item: `${siteUrl}/video-gallery`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: video.video_head,
        item: `${siteUrl}/video-gallery/${video.permalink}`,
      },
    ],
  }

  return (
    <>
      <ViewTracker code={video.video_code} type="video" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          {' › '}
          <Link href="/video-gallery" className="hover:underline">Video Gallery</Link>
          {' › '}
          <span>{video.video_head}</span>
        </nav>

        <h1 className="text-2xl font-bold mb-4">{decodeHtml(video.video_head)}</h1>

        {video.vlink && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <iframe
              src={`https://www.youtube.com/embed/${getYoutubeId(video.vlink)}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {video.video_desc && (
          <p className="text-gray-700">{video.video_desc}</p>
        )}
      </main>
    </>
  )
}
