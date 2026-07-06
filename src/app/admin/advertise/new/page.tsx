'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Globe, 
  Search,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Layout,
  Code,
  Zap,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewAdvertisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    advt_head: '',
    advt_body: 'everywhere|top',
    permalink: '',
    active: 2,
    placement: 'sidebar_top',
    geo_enabled: false,
    start_date: '',
    end_date: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isManualPermalink, setIsManualPermalink] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Autogenerate permalink from heading
  useEffect(() => {
    if (!isManualPermalink && formData.advt_head) {
      const slug = formData.advt_head
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, permalink: slug }))
    }
  }, [formData.advt_head, isManualPermalink])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
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
      return data.publicUrl
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.advt_head.trim()) newErrors.advt_head = 'Campaign title is required'
    // permalink is now optional
    if (!selectedFile && !previewUrl) newErrors.image = 'Banner image is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      // 1. Create the campaign record
      const res = await fetch('/api/admin/advertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const result = await res.json()
        const advtCode = result.code

        if (selectedFile && advtCode) {
          try {
            // 2. Upload the image and get the URL
            const publicUrl = await uploadAdImage(advtCode, selectedFile)
            
            // 3. Update the campaign record if needed (currently not needed for image since it follows ID convention)
            // But we keep the call if we want to update other fields, though POST already did that.
            // Actually, we can skip the PUT if only the image changed and it's already on R2 via the ID.
          } catch (uploadError) {
            console.error('Upload failed but campaign created:', uploadError)
            toast.warning('Campaign created but banner upload failed. Please try editing to upload again.')
          }
        }

        toast.success('Campaign launched successfully!')
        router.push('/admin/advertise')
        router.refresh()
      } else {
        const errorData = await res.json()
        toast.error(`Failed to create campaign: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Campaign</h2>
            <p className="text-slate-500 font-medium mt-1">Design and launch your new promotional placement</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-brand text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="h-4 w-4" />}
            Launch Campaign
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
                placeholder="Enter campaign name (e.g. Summer Promo)..."
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

          {/* Geo-Fencing Compliance */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Geo-Fencing Compliance</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Restrict visibility to compliant regions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, geo_enabled: !formData.geo_enabled })}
                className={`h-7 w-12 rounded-full flex items-center transition-all duration-300 ${
                  formData.geo_enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
                } p-1`}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow flex items-center justify-center">
                  {formData.geo_enabled && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                </div>
              </button>
            </div>

            {formData.geo_enabled && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-blue-700 text-xs font-medium leading-relaxed">
                    This campaign will only be visible to users inside the active regions (Punjab state/districts) toggled in the <strong>Region Settings</strong>. Users outside these regions will not see the ad.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}
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
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative aspect-[4/3] rounded-2xl bg-white/5 border border-white/10 overflow-hidden group/img cursor-pointer ${errors.image ? 'border-rose-500/50' : ''}`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} className="absolute inset-0 w-full h-full object-contain" alt="Preview" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white/20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Upload Banner</p>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                       <div className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                         <ImageIcon className="h-3 w-3" />
                         {previewUrl ? 'Change Image' : 'Select Image'}
                       </div>
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  {errors.image && <p className="text-rose-500 text-[9px] font-bold uppercase tracking-widest text-center mt-2">{errors.image}</p>}
                  <p className="text-[9px] text-white/30 font-medium text-center italic mt-2">Supported formats: JPG, PNG, GIF</p>
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

                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-brand/20 flex items-center justify-center text-brand">
                        <Zap className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Image Quality</p>
                   </div>
                   <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                     Banners are now uploaded with ultra-high quality (95%) for maximum visual impact.
                   </p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
