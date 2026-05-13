'use client'

import React, { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Globe, 
  CheckCircle2,
  AlertCircle,
  Layout,
  Code,
  Zap,
  ArrowLeft,
  Settings,
  Trash2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { FallbackImage } from '@/components/public/fallback-image'
import { advtImageUrl } from '@/lib/image'

export default function EditAdvertisePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    advt_head: '',
    advt_body: '',
    permalink: '',
    active: 2,
    placement: 'sidebar_top'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [refreshKey, setRefreshKey] = useState(Date.now())

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`/api/admin/advertise/${id}`)
        if (res.ok) {
          const data = await res.json()
          setFormData({
            advt_head: data.advt_head || '',
            advt_body: data.advt_body || '',
            permalink: data.permalink || '',
            active: data.active || 2,
            placement: 'sidebar_top' // Default or extracted
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAd()
  }, [id])

  const [tempPreview, setTempPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file)
      setTempPreview(objectUrl)
      
      const success = await uploadAdImage(parseInt(id), file)
      if (success) {
        setRefreshKey(Date.now())
        router.refresh()
      }
    }
  }

  const uploadAdImage = async (advtCode: number, file: File) => {
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('filename', `full${advtCode}.jpg`)
      formDataUpload.append('folder', 'ads')
      formDataUpload.append('quality', '95')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })
      
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      
      // Image is automatically linked by advt_code convention (full[ID].jpg)
      
      toast.success('Banner uploaded successfully!')
      return data.publicUrl
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload image')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.advt_head.trim()) newErrors.advt_head = 'Campaign title is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/advertise/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success('Campaign updated successfully!')
        router.push('/admin/advertise')
        router.refresh()
      } else {
        const errorData = await res.json()
        toast.error(`Failed to update campaign: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('A network error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    try {
      const res = await fetch(`/api/admin/advertise/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/advertise')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-brand animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/advertise" 
            className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Edit Campaign</h2>
            <p className="text-slate-500 font-medium mt-1">Refine and update your promotional placement</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleDelete}
            className="px-6 py-4 rounded-2xl bg-white border border-rose-100 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="bg-brand text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Advertisement Title</label>
              <input 
                value={formData.advt_head}
                onChange={e => {
                  setFormData({ ...formData, advt_head: e.target.value })
                  if (errors.advt_head) setErrors(prev => {
                    const next = { ...prev }
                    delete next.advt_head
                    return next
                  })
                }}
                placeholder="Enter campaign name..."
                className={`w-full text-2xl font-black text-slate-900 placeholder:text-slate-200 outline-none border-none focus:ring-0 ${errors.advt_head ? 'placeholder:text-rose-200' : ''}`}
              />
              {errors.advt_head && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.advt_head}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Destination URL (On Click)</label>
              <div className={`flex items-center gap-3 bg-slate-50 rounded-2xl px-6 py-4 border shadow-inner transition-all ${errors.permalink ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
                <Globe className={`h-5 w-5 ${errors.permalink ? 'text-rose-400' : 'text-slate-400'}`} />
                <input 
                  value={formData.permalink}
                  onChange={e => {
                    setFormData({ ...formData, permalink: e.target.value })
                    if (errors.permalink) setErrors(prev => {
                      const next = { ...prev }
                      delete next.permalink
                      return next
                    })
                  }}
                  placeholder="https://example.com/promo"
                  className="bg-transparent text-sm font-bold text-slate-700 outline-none flex-1"
                />
              </div>
              {errors.permalink && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.permalink}</p>}
              <p className="text-[10px] text-slate-400 font-medium ml-1">Optional: Where should users go when they click the banner?</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
               <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                 <Layout className="h-5 w-5 text-blue-500" />
               </div>
               <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Placement Strategy</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Page</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <select 
                    value={formData.advt_body.split('|')[0] || 'homepage'}
                    onChange={e => {
                      const parts = formData.advt_body.split('|')
                      setFormData({ ...formData, advt_body: `${e.target.value}|${parts[1] || 'top'}` })
                    }}
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1 appearance-none cursor-pointer"
                  >
                    <option value="everywhere">Everywhere</option>
                    <option value="homepage">Homepage</option>
                    <option value="article">News Article</option>
                    <option value="category">Category Page</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Position</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner">
                  <Layout className="h-4 w-4 text-slate-400" />
                  <select 
                    value={formData.advt_body.split('|')[1] || 'top'}
                    onChange={e => {
                      const parts = formData.advt_body.split('|')
                      setFormData({ ...formData, advt_body: `${parts[0] || 'homepage'}|${e.target.value}` })
                    }}
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1 appearance-none cursor-pointer"
                  >
                    <option value="everywhere">Everywhere</option>
                    <option value="top">Top Banner</option>
                    <option value="bottom">Bottom Banner</option>
                    <option value="left">Left Sidebar</option>
                    <option value="right">Right Sidebar</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 sticky top-28 shadow-2xl border border-white/5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                <Settings className="h-5 w-5 text-brand" />
                <h3 className="font-black uppercase text-xs tracking-[0.2em]">Publishing</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Banner Preview</label>
                  <div className="relative aspect-[4/3] rounded-2xl bg-white/5 border border-white/10 overflow-hidden group/img">
                    <FallbackImage 
                      src={tempPreview || `${advtImageUrl(parseInt(id))}?v=${refreshKey}`} 
                      alt={formData.advt_head}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         disabled={uploading}
                         className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
                       >
                         {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                         Update Image
                       </button>
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="text-[9px] text-white/30 font-medium text-center italic">Supported formats: JPG, PNG, GIF</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Campaign Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, active: 2 })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.active === 2 ? 'bg-brand border-brand text-white shadow-lg shadow-brand/40' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Live
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, active: 1 })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.active === 1 ? 'bg-white/10 border-white/20 text-white shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      Paused
                    </button>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
