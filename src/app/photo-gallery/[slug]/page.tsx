import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FallbackImage } from '@/components/public/fallback-image'
import { getGalleryByPermalink } from '@/lib/queries'
import { galleryImageUrl, logoUrl } from '@/lib/image'
import { LANG_CODE_MAP } from '@/lib/types'
import { ViewTracker } from '@/components/public/view-tracker'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const gallery = await getGalleryByPermalink(slug)
  if (!gallery) return { title: 'Not Found' }

  const title = gallery.meta_title ?? gallery.gallery_head ?? ''
  const description = gallery.meta_desc ?? gallery.gallery_desc?.substring(0, 160) ?? ''
  const imageUrl = galleryImageUrl(gallery.gallery_code)
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/photo-gallery/${gallery.permalink}`
  const locale = LANG_CODE_MAP[gallery.lang_code ?? 1]

  return {
    title,
    description,
    robots: gallery.no_index ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical,
      languages: locale ? { [locale]: canonical } : undefined,
    },
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  }
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params
  const gallery = await getGalleryByPermalink(slug)
  if (!gallery) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: gallery.gallery_head,
    description: gallery.gallery_desc,
    datePublished: gallery.date?.toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'Punjab Newsline',
      logo: { '@type': 'ImageObject', url: logoUrl() },
    },
    url: `${siteUrl}/photo-gallery/${gallery.permalink}`,
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
        name: 'Photo Gallery',
        item: `${siteUrl}/photo-gallery`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: gallery.gallery_head,
        item: `${siteUrl}/photo-gallery/${gallery.permalink}`,
      },
    ],
  }

  return (
    <>
      <ViewTracker code={gallery.gallery_code} type="gallery" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          {' › '}
          <Link href="/photo-gallery" className="hover:underline">Photo Gallery</Link>
          {' › '}
          <span>{gallery.gallery_head}</span>
        </nav>

        <h1 className="text-2xl font-bold mb-2">{gallery.gallery_head}</h1>

        {gallery.gallery_desc && (
          <p className="text-gray-600 mb-6">{gallery.gallery_desc}</p>
        )}

        {/* Photo Grid - Centered flex wrap for better balance */}
        <div className="flex flex-wrap justify-center gap-6">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="relative w-full sm:w-[calc(50%-1.5rem)] md:w-[calc(33.33%-1.5rem)] lg:w-[calc(25%-1.5rem)] max-w-[280px] aspect-[3/2] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                {/* Background Blur */}
                <div className="absolute inset-0 z-0">
                  <FallbackImage
                    src={galleryImageUrl(gallery.gallery_code, i)}
                    alt=""
                    fill
                    className="object-cover blur-2xl opacity-10 scale-110"
                    sizes="100px"
                  />
                </div>
                {/* Main Image */}
                <FallbackImage
                  src={galleryImageUrl(gallery.gallery_code, i)}
                  alt={`${gallery.gallery_head} - photo ${i + 1}`}
                  fill
                  className="relative z-10 object-contain transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading={i > 1 ? 'lazy' : undefined}
                />
              </div>
            ))}
        </div>
      </main>
    </>
  )
}
