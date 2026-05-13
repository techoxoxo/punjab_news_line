'use client'

import Link from 'next/link'
import { FallbackImage } from './fallback-image'
import { Camera, PlayCircle } from 'lucide-react'
import { type Gallery, type Video } from '@/lib/types'
import { videoThumbUrl, galleryImageUrl } from '@/lib/image'
import { decodeHtml } from '@/lib/format'

interface GallerySectionProps {
  galleries: Gallery[]
  videos: Video[]
}

function getYoutubeId(url: string | null): string | null {
  if (!url) return null
  // If it's already a clean ID, return it
  if (url.length === 11 && !url.includes('/') && !url.includes('?')) return url
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : url
}

export function GallerySection({ galleries, videos }: GallerySectionProps) {
  return (
    <section className="space-y-20 py-20">
      {/* Photo Gallery Section */}
      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-brand/20" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.3em] text-brand">Photo Gallery</h2>
          <div className="h-px flex-1 bg-brand/20" />
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {galleries.slice(0, 4).map((gal, idx) => (
            <Link 
              key={`${gal.gallery_code}-${idx}`} 
              href={`/photo-gallery/${gal.permalink}`}
              className="group block space-y-4 w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(25%-1.5rem)] max-w-[320px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-slate-50 shadow-lg border border-slate-100 transition-all duration-500 group-hover:shadow-brand/10 group-hover:border-brand/20">
                 {/* Main Image */}
                  <FallbackImage 
                    src={galleryImageUrl(gal.gallery_code)} 
                    alt={decodeHtml(gal.gallery_head)} 
                   fill 
                   className="object-cover transition-transform duration-700 group-hover:scale-105"
                   sizes="(max-width: 768px) 100vw, 25vw"
                 />
                 
                 <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute bottom-4 left-4 z-30 h-8 w-8 rounded-full bg-brand/90 flex items-center justify-center text-white translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <Camera className="h-4 w-4" />
                 </div>
              </div>
              <h3 className="font-display text-sm font-bold leading-snug text-slate-800 group-hover:text-brand transition-colors line-clamp-2 px-2 text-center">
                {decodeHtml(gal.gallery_head)}
              </h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Video Gallery Section */}
      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-brand/20" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.3em] text-brand">Video Gallery</h2>
          <div className="h-px flex-1 bg-brand/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Featured Video */}
          {videos[0] && (
            <Link 
              href={`/video-gallery/${videos[0].permalink}`}
              className="group relative lg:col-span-7 flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl transition-all duration-700 group-hover:shadow-brand/20">
                <FallbackImage 
                  src={getYoutubeId(videos[0].vlink) ? `https://img.youtube.com/vi/${getYoutubeId(videos[0].vlink)}/hqdefault.jpg` : videoThumbUrl(videos[0].video_code)}
                  alt={decodeHtml(videos[0].video_head)}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="h-20 w-20 rounded-full bg-brand/90 backdrop-blur-md flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-110">
                      <PlayCircle className="h-10 w-10 fill-current" />
                   </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                   <span className="mb-3 inline-block rounded-full bg-brand px-4 py-1 text-[9px] font-black uppercase tracking-widest text-white">Featured Video</span>
                   <h3 className="font-display text-2xl md:text-3xl font-black text-white group-hover:text-brand transition-colors line-clamp-2 leading-tight">
                     {decodeHtml(videos[0].video_head)}
                   </h3>
                </div>
              </div>
            </Link>
          )}

          {/* Side Videos Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {videos.slice(1, 5).map((vid, idx) => {
              const ytId = getYoutubeId(vid.vlink)
              const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : videoThumbUrl(vid.video_code)
              
              return (
                <Link 
                  key={`${vid.video_code}-${idx}`} 
                  href={`/video-gallery/${vid.permalink}`}
                  className="group flex flex-col gap-4"
                >
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-md border border-slate-100 transition-all duration-500 group-hover:shadow-brand/10 group-hover:border-brand/20">
                    {/* Main Image */}
                    <FallbackImage 
                      src={thumbUrl}
                      alt={decodeHtml(vid.video_head)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="h-10 w-10 rounded-full bg-brand/90 flex items-center justify-center text-white shadow-lg">
                          <PlayCircle className="h-5 w-5 fill-current" />
                       </div>
                    </div>
                  </div>
                  <h4 className="font-display text-xs font-bold leading-snug text-slate-800 group-hover:text-brand transition-colors line-clamp-2 px-1">
                    {decodeHtml(vid.video_head)}
                  </h4>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
