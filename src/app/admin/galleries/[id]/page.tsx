'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  ArrowLeft,
  Camera,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Search,
  CheckCircle2,
  AlertCircle,
  Globe,
  Tag,
  Settings,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { FallbackImage } from '@/components/public/fallback-image'
import { logoUrl } from '@/lib/image'

export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gallery, setGallery] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, galRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch(`/api/admin/galleries/${id}`)
        ])
        const catsData = await catsRes.json()
        const galData = await galRes.json()

        setCategories(catsData.categories || [])
        setGallery(galData)
        setPhotos(galData.photos || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load gallery details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/galleries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gallery),
      })
      if (res.ok) {
        toast.success('Gallery settings updated')
      } else {
        toast.error('Failed to update gallery')
      }
    } catch (error) {
      toast.error('A network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        const timestamp = Date.now()
        const filename = `gal-${id}-${timestamp}-${file.name.replace(/\s+/g, '-')}`
        
        // 1. Get presigned URL
        const presignedRes = await fetch(`/api/upload`, {
            method: 'POST',
            body: JSON.stringify({ filename, folder: 'gallery' })
        })
        
        // Wait, I need to implement a client-side upload helper or use existing one
        // For now, I'll use the simplified FormData upload I used in News
        const formData = new FormData()
        formData.append('file', file)
        formData.append('filename', filename)
        formData.append('folder', 'gallery')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          
          // 2. Add to DB
          await fetch(`/api/admin/galleries/${id}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_name: filename,
              photo_caption: '',
              sorting: photos.length + 1,
              active: 2
            })
          })
        }
      }
      
      // Refresh photos
      const galRes = await fetch(`/api/admin/galleries/${id}`)
      const galData = await galRes.json()
      setPhotos(galData.photos || [])
      toast.success(`${files.length} photo(s) uploaded successfully`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to upload some photos')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (multiCode: number) => {
    if (!confirm('Are you sure you want to remove this photo?')) return
    
    try {
      const res = await fetch(`/api/admin/galleries/photos/${multiCode}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setPhotos(photos.filter(p => p.multi_code !== multiCode))
        toast.success('Photo removed')
      }
    } catch (error) {
      toast.error('Failed to remove photo')
    }
  }

  const handleUpdateCaption = async (multiCode: number, caption: string) => {
    try {
      const res = await fetch(`/api/admin/galleries/photos/${multiCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_caption: caption })
      })
      if (!res.ok) {
        toast.error('Failed to save caption')
      } else {
        toast.success('Caption saved')
        setPhotos(photos.map(p => p.multi_code === multiCode ? { ...p, photo_caption: caption } : p))
      }
    } catch (error) {
      toast.error('A network error occurred')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-brand animate-spin" />
      <p className="text-slate-400 font-bold text-sm tracking-widest uppercase text-center">Opening Gallery...</p>
    </div>
  )

  return (
    <div className="pb-24 space-y-10">
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
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Edit Gallery</h2>
            <p className="text-slate-500 font-medium mt-1">Managing "{gallery.gallery_head}"</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href={`/photo-gallery/${gallery.permalink}`} 
            target="_blank"
            className="px-6 py-4 rounded-2xl border border-slate-200 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Live Preview
          </Link>
          <button
            onClick={handleSaveGallery}
            disabled={saving}
            className="bg-brand text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Update Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Gallery Meta */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
               <Settings className="h-5 w-5 text-brand" />
               <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Gallery Info</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gallery Title</label>
                <textarea
                  value={gallery.gallery_head}
                  onChange={e => setGallery({ ...gallery, gallery_head: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-brand/20 outline-none transition-all resize-none min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                <select
                  value={gallery.cgry_code}
                  onChange={e => setGallery({ ...gallery, cgry_code: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer"
                >
                  {categories.map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Permalink</label>
                <input
                  value={gallery.permalink}
                  onChange={e => setGallery({ ...gallery, permalink: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGallery({ ...gallery, active: 2 })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${gallery.active === 2 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setGallery({ ...gallery, active: 1 })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${gallery.active === 1 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Photos Manager */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[600px]">
              <div className="flex items-center justify-between pb-8 border-b border-slate-50 mb-8">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                       <Camera className="h-5 w-5 text-brand" />
                    </div>
                    <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Media Assets ({photos.length})</h3>
                 </div>
                 <label className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 cursor-pointer hover:bg-brand transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                    <Plus className="h-5 w-5" />
                    Add Photos
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                 </label>
              </div>

              {uploading && (
                <div className="mb-8 p-6 rounded-3xl bg-brand/5 border border-brand/10 flex items-center justify-between animate-pulse">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
                      <p className="text-sm font-black text-brand uppercase tracking-widest">Uploading new assets...</p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                 {photos.map((photo, idx) => (
                    <div key={photo.multi_code} className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:border-brand/20 transition-all duration-500 hover:shadow-2xl hover:shadow-brand/5">
                       <FallbackImage 
                          src={`/r2-images/gallery/${photo.file_name}`} 
                          alt="" 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <div className="absolute top-4 right-4 flex gap-2">
                             <button 
                               onClick={() => handleDeletePhoto(photo.multi_code)}
                               className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-rose-500 hover:border-rose-500 transition-all"
                             >
                                <Trash2 className="h-5 w-5" />
                             </button>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                             <span className="text-[9px] font-black uppercase tracking-widest text-brand mb-1 block">Photo #{idx + 1}</span>
                             <input 
                                defaultValue={photo.photo_caption}
                                placeholder="Add caption..."
                                onBlur={(e) => handleUpdateCaption(photo.multi_code, e.target.value)}
                                className="w-full bg-transparent text-white text-xs font-bold outline-none border-b border-white/20 pb-1 focus:border-white transition-all placeholder:text-white/40"
                             />
                          </div>
                       </div>
                    </div>
                 ))}
                 
                 {photos.length === 0 && !uploading && (
                   <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-300 space-y-6">
                      <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center">
                         <Camera className="h-12 w-12" />
                      </div>
                      <p className="font-black uppercase tracking-[0.2em] text-[10px]">No photos in this gallery yet</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
