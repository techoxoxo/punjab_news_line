'use client'

import Image, { type ImageProps } from 'next/image'
import { useState, useEffect } from 'react'
import { logoUrl } from '@/lib/image'

type FallbackImageProps = Omit<ImageProps, 'src'> & {
  src: string
  fallbackSrc?: string
}

export function FallbackImage({ src, fallbackSrc, alt, onError, className, ...props }: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [errorCount, setErrorCount] = useState(0)

  // Use the provided fallbackSrc or a safe default logo path
  const logoFallback = logoUrl()

  // Reset state if src changes
  useEffect(() => {
    setCurrentSrc(src)
    setErrorCount(0)
  }, [src])

  const handleImageError = (event: any) => {
    if (errorCount === 0) {
      // First failure (usually from bucket) -> Try local path
      const localPath = src.replace('/r2-images/', '/images/')
      if (localPath !== src) {
        setErrorCount(1)
        setCurrentSrc(localPath)
      } else {
        setErrorCount(2)
        setCurrentSrc(fallbackSrc || logoFallback)
      }
    } else if (errorCount === 1) {
      // Second failure (local path failed) -> Try logo
      setErrorCount(2)
      setCurrentSrc(fallbackSrc || logoFallback)
    }
    // Else (count 2) -> stop to prevent infinite loops

    onError?.(event)
  }

  // Visual state for when we've hit the final fallback
  const isFinalFallback = errorCount >= 2
  const finalClassName = isFinalFallback 
    ? `${className?.replace('object-cover', 'object-contain') || ''} bg-slate-50 p-1.5 opacity-60`
    : className

  const isUnoptimized = true
  
  return (
    <Image
      {...props}
      className={finalClassName}
      src={currentSrc}
      alt={alt || 'News Image'}
      onError={handleImageError}
      unoptimized={isUnoptimized}
    />
  )
}