import type { Metadata } from 'next'
import { Camera } from 'lucide-react'
import { getLatestGalleries, getActiveAdvertisements } from '@/lib/queries'
import { SectionHeader } from '@/components/public/section-header'
import { MediaCard } from '@/components/public/media-card'
import { formatCompactDate } from '@/lib/format'
import { AdPlacement } from '@/components/public/ad-placement'
import { galleryImageUrl } from '@/lib/image'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: 'Browse photo galleries from Punjab Newsline.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/photo-gallery` },
}

export default async function PhotoGalleryPage() {
  let galleries: Awaited<ReturnType<typeof getLatestGalleries>> = []
  let ads: Awaited<ReturnType<typeof getActiveAdvertisements>> = []

  try { 
    [galleries, ads] = await Promise.all([
      getLatestGalleries(24),
      getActiveAdvertisements()
    ])
  } catch { /* DB not ready */ }

  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[18rem] bg-[radial-gradient(circle_at_top_right,rgba(205,3,33,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0))]" />
      <section className="mx-auto max-w-8xl px-4 lg:px-8 pb-10 pt-6 md:pt-10">
        <div className="glass-panel rounded-[36px] p-6 md:p-8">
          <SectionHeader
            eyebrow="Photo Gallery"
            title="Editorial photo sets with a richer visual frame"
            description="The gallery cards now feel closer to magazine covers than plain thumbnails."
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galleries.map((gallery, index) => (
              <MediaCard
                key={gallery.gallery_code}
                href={`/photo-gallery/${gallery.permalink}`}
                title={gallery.gallery_head ?? 'Photo gallery'}
                kind="Gallery"
                description={gallery.gallery_desc}
                image={galleryImageUrl(gallery.gallery_code)}
                dateLabel={formatCompactDate(gallery.date)}
                icon={<Camera className="h-4 w-4" />}
                accent={index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'forest' : 'green'}
              />
            ))}
          </div>

          <AdPlacement ads={ads} page="photo-gallery" position="bottom" className="mt-12" />
        </div>
      </section>
    </main>
  )
}
