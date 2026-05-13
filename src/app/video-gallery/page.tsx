import type { Metadata } from 'next'
import { Play } from 'lucide-react'
import { getLatestVideos, getActiveAdvertisements } from '@/lib/queries'
import { SectionHeader } from '@/components/public/section-header'
import { MediaCard } from '@/components/public/media-card'
import { formatCompactDate } from '@/lib/format'
import { getYoutubeThumb, videoThumbUrl } from '@/lib/image'
import { AdPlacement } from '@/components/public/ad-placement'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Video Gallery',
  description: 'Watch the latest video news from Punjab Newsline.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/video-gallery` },
}

export default async function VideoGalleryPage() {
  let videos: Awaited<ReturnType<typeof getLatestVideos>> = []
  let ads: Awaited<ReturnType<typeof getActiveAdvertisements>> = []
  
  try { 
    [videos, ads] = await Promise.all([
      getLatestVideos(24),
      getActiveAdvertisements()
    ])
  } catch { /* DB not ready */ }
  
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[18rem] bg-[radial-gradient(circle_at_top_left,rgba(237,50,55,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0))]" />
      <section className="mx-auto max-w-8xl px-4 lg:px-8 pb-10 pt-6 md:pt-10">
        <div className="glass-panel rounded-[36px] p-6 md:p-8">
          <SectionHeader
            eyebrow="Video Gallery"
            title="A more cinematic way to browse video stories"
            description="The gallery now mirrors the same premium story surfaces used on the homepage and article pages."
          />

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video, index) => {
              const thumbnail = getYoutubeThumb(video.vlink) || videoThumbUrl(video.video_code)
              
              return (
                <MediaCard
                  key={video.video_code}
                  href={`/video-gallery/${video.permalink}`}
                  title={video.video_head ?? 'Video story'}
                  kind="Video"
                  description={video.video_desc}
                  image={thumbnail}
                  dateLabel={formatCompactDate(video.date)}
                  icon={<Play className="h-4 w-4" />}
                  accent={index % 3 === 0 ? 'green' : index % 3 === 1 ? 'forest' : 'gold'}
                />
              )
            })}
          </div>

          <AdPlacement ads={ads} page="video-gallery" position="bottom" className="mt-12" />
        </div>
      </section>
    </main>
  )
}
