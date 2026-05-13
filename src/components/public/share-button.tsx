'use client'

import React from 'react'
import { Share2, Link as LinkIcon, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface ShareButtonProps {
  title: string
  url: string
  className?: string
  iconClassName?: string
}

export function ShareButton({ title, url, className, iconClassName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Ensure we have a full URL
    const shareUrl = url.startsWith('http') ? url : window.location.href
    
    const shareData = {
      title: title,
      text: `${title} | Punjab Newsline`,
      url: shareUrl,
    }

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        throw new Error('Web Share not supported')
      }
    } catch (err) {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch (copyErr) {
        console.error('Failed to copy:', copyErr)
        toast.error('Sharing not available')
      }
    }
  }

  return (
    <button 
      onClick={handleShare}
      className={className || "h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all"}
      title="Share this story"
    >
      {copied ? (
        <Check className={iconClassName || "h-4 w-4 text-emerald-500"} />
      ) : (
        <Share2 className={iconClassName || "h-4 w-4"} />
      )}
    </button>
  )
}
