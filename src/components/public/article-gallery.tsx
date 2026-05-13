'use client'

import { useState } from 'react'
import { FallbackImage } from './fallback-image'
import { articleImageUrl } from '@/lib/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Image as ImageIcon, Sparkles } from 'lucide-react'

interface ArticleGalleryProps {
  articleCode: number
}

export function ArticleGallery({ articleCode }: ArticleGalleryProps) {
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleImageError = (idx: number) => {
    setFailedImages(prev => new Set([...prev, idx]))
  }

  // We check for up to 4 extra images (fullX-1.jpg to fullX-4.jpg)
  const imageIndices = [1, 2, 3, 4]
  const visibleIndices = imageIndices.filter(i => !failedImages.has(i))

  if (visibleIndices.length === 0) return null

  return (
    <div className="mt-16 group/gallery">
      {/* Premium Header */}
      <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/gallery:opacity-10 transition-opacity duration-1000">
          <ImageIcon size={120} className="rotate-12" />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-brand/5 border border-brand/10 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Exclusive Gallery</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Photo Coverage</h3>
              <p className="text-slate-500 font-medium mt-2">Extended visual insights from this story</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-black uppercase tracking-widest shadow-sm">
            <ImageIcon className="h-4 w-4 text-brand" />
            <span className="text-slate-900">{visibleIndices.length}</span>
            Visual Assets
          </div>
        </div>
        
        {/* Collage Grid */}
        <div className={`grid gap-6 ${
          visibleIndices.length === 1 ? 'grid-cols-1' :
          visibleIndices.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {visibleIndices.map((i, index) => {
            const imgUrl = articleImageUrl(articleCode).replace('-0.jpg', `-${i}.jpg`)
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`relative group cursor-zoom-in rounded-[2rem] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-brand/5 hover:border-brand/20 transition-all duration-500 ${
                  visibleIndices.length >= 3 && index === 0 ? 'md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-square'
                }`}
                onClick={() => setSelectedImage(imgUrl)}
              >
                <FallbackImage 
                  src={imgUrl}
                  alt={`Story visual ${i}`}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  onError={() => handleImageError(i)}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
                  <div className="flex items-center justify-between w-full">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                      <Maximize2 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">View Fullscreen</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-8 right-8 h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 z-[110]"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-8 w-8" />
            </motion.button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full max-w-7xl h-[80vh] rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl">
                <FallbackImage 
                  src={selectedImage}
                  alt="Gallery focus"
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
