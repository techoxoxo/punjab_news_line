'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  ArrowLeft,
  Video,
  Globe,
  Settings,
  Type,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [video, setVideo] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, videoRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch(`/api/admin/videos/${id}`)
        ])
        const catsData = await catsRes.json()
        const videoData = await videoRes.json()

        setCategories(catsData.categories || [])
        setVideo(videoData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load video details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      })
      if (res.ok) {
        toast.success('Video updated successfully')
        router.refresh()
      } else {
        toast.error('Failed to update video')
      }
    } catch (error) {
      toast.error('A network error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-brand animate-spin" />
      <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Opening Video...</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="pb-24 space-y-10">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Edit Video</h2>
            <p className="text-slate-500 font-medium mt-1">Refining "#{video.video_head}"</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href={`/video-gallery/${video.permalink}`} 
            target="_blank"
            className="px-6 py-4 rounded-2xl border border-slate-200 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Watch Live
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Update Video'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                 <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-brand" />
                 </div>
                 <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Video Content</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Video Headline</label>
                  <textarea
                    value={video.video_head}
                    onChange={e => setVideo({ ...video, video_head: e.target.value })}
                    className="w-full text-2xl font-black text-slate-900 placeholder:text-slate-200 outline-none border-none resize-none min-h-[60px] leading-tight"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">YouTube Video ID / Link</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 shadow-inner">
                    <LinkIcon className="h-4 w-4 text-rose-500" />
                    <input
                      value={video.vlink}
                      onChange={e => setVideo({ ...video, vlink: e.target.value })}
                      placeholder="YouTube ID (e.g. dQw4w9WgXcQ)"
                      className="w-full bg-transparent text-sm font-bold text-slate-600 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1 italic">Note: Only the Video ID is stored, but you can paste a full YouTube URL.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Short Description</label>
                  <textarea
                    value={video.video_desc}
                    onChange={e => setVideo({ ...video, video_desc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-brand/20 min-h-[120px] transition-all shadow-inner"
                  />
                </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                 <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Type className="h-5 w-5 text-blue-500" />
                 </div>
                 <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">SEO Optimization</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Permalink</label>
                  <input
                    value={video.permalink}
                    onChange={e => setVideo({ ...video, permalink: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Keywords</label>
                  <input
                    value={video.meta_keys}
                    onChange={e => setVideo({ ...video, meta_keys: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Description</label>
                <textarea
                  value={video.meta_desc}
                  onChange={e => setVideo({ ...video, meta_desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-600 outline-none min-h-[100px] shadow-inner"
                />
              </div>
           </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 sticky top-10 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                <Settings className="h-5 w-5 text-brand" />
                <h3 className="font-black uppercase text-xs tracking-[0.2em]">Video Controls</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Publication Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVideo({ ...video, active: 2 })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${video.active === 2 ? 'bg-brand border-brand text-white shadow-lg shadow-brand/40' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Published
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideo({ ...video, active: 1 })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${video.active === 1 ? 'bg-white/10 border-white/20 text-white shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      Draft
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Video Category</label>
                  <select
                    value={video.cgry_code}
                    onChange={e => setVideo({ ...video, cgry_code: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-brand transition-all"
                  >
                    {categories.map((c: any) => (
                      <option key={c.code} value={c.code} className="bg-slate-800">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Language</label>
                  <select
                    value={video.lang_code}
                    onChange={e => setVideo({ ...video, lang_code: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-brand transition-all"
                  >
                    <option value={1} className="bg-slate-800">English</option>
                    <option value={2} className="bg-slate-800">Punjabi</option>
                    <option value={3} className="bg-slate-800">Hindi</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/40 hover:scale-105 active:scale-95 transition-all"
                >
                  {saving ? 'Saving...' : 'Update Video'}
                </button>
              </div>
           </div>
        </div>
      </div>
    </form>
  )
}
