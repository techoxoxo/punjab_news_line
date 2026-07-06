'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Globe, 
  Search,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Settings,
  User,
  Link as LinkIcon,
  Video,
  Tag,
  FileText,
  Layers,
  Zap,
  Plus,
  Check,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
const Editor = dynamic(() => import('@/components/admin/Editor'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-slate-50 animate-pulse rounded-[1.5rem] border border-slate-100" />
})

export default function NewStoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [editorData, setEditorData] = useState<any>({
    categories: [],
    segments: [],
    modes: [],
    languages: [],
    teams: [],
    groups: []
  })
  
  const [formData, setFormData] = useState({
    article_head: '',
    article_desc: '',
    article_body: '',
    cgry_code: 21, 
    cgry_list: [] as number[],
    group_list: [] as number[],
    sgmt_list: [] as number[],
    permalink: '',
    meta_title: '',
    meta_desc: '',
    meta_keys: '',
    active: 2, 
    vlink: '',
    reporter: '',
    reflink: '',
    photo_caption: '',
    lang_code: 1,
    team_code: 2,
    sgmt_code: 17,
    mode_code: 27
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isManualPermalink, setIsManualPermalink] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [extraFiles, setExtraFiles] = useState<(File | null)[]>([null, null, null, null])
  const [extraPreviews, setExtraPreviews] = useState<(string | null)[]>([null, null, null, null])
  const extraInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Autogenerate permalink from heading
  useEffect(() => {
    if (!isManualPermalink && formData.article_head) {
      const slug = formData.article_head
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/-+/g, '-')         // Remove double --
        .replace(/^-+|-+$/g, '')    // Trim hyphens
      setFormData(prev => ({ ...prev, permalink: slug }))
    }
  }, [formData.article_head, isManualPermalink])

  // Refs for scroll-to-section
  const detailsRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const pictureRef = useRef<HTMLDivElement>(null)
  const morePicsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => setEditorData(data))
  }, [])

  // Auto-generate permalink on headline change
  useEffect(() => {
    if (formData.article_head && !formData.permalink) {
      const slug = formData.article_head
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setFormData(prev => ({ ...prev, permalink: slug }))
    }
  }, [formData.article_head])

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, tab: string) => {
    setActiveTab(tab)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCategoryToggle = (code: number) => {
    setFormData(prev => {
      const list = prev.cgry_list.includes(code)
        ? prev.cgry_list.filter(c => c !== code)
        : [...prev.cgry_list, code]
      return { ...prev, cgry_list: list }
    })
  }

  const handleGroupToggle = (code: number) => {
    setFormData(prev => {
      const list = prev.group_list.includes(code)
        ? prev.group_list.filter(c => c !== code)
        : [...prev.group_list, code]
      return { ...prev, group_list: list }
    })
  }

  const handleSegmentToggle = (code: number) => {
    setFormData(prev => {
      const list = prev.sgmt_list.includes(code)
        ? prev.sgmt_list.filter(s => s !== code)
        : [...prev.sgmt_list, code]
      return { ...prev, sgmt_list: list }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removePrimaryImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExtraFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const newFiles = [...extraFiles]
      newFiles[index] = file
      setExtraFiles(newFiles)

      const url = URL.createObjectURL(file)
      const newPreviews = [...extraPreviews]
      newPreviews[index] = url
      setExtraPreviews(newPreviews)
    }
  }

  const removeExtraFile = (index: number) => {
    const newFiles = [...extraFiles]
    newFiles[index] = null
    setExtraFiles(newFiles)

    const newPreviews = [...extraPreviews]
    newPreviews[index] = null
    setExtraPreviews(newPreviews)
  }

  const uploadArticleImage = async (articleCode: number, file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', `full${articleCode}-0.jpg`)
      formData.append('folder', 'news')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      return await res.json()
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.article_head.trim()) newErrors.article_head = 'News heading is required'
    if (!formData.permalink.trim()) newErrors.permalink = 'Permalink is required'
    if (!selectedFile && !previewUrl) newErrors.image = 'Primary image is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first error
      if (newErrors.article_head) scrollToSection(detailsRef, 'details')
      else if (newErrors.image) scrollToSection(pictureRef, 'picture')
      else if (newErrors.permalink) scrollToSection(metaRef, 'meta')
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cgry_list: formData.cgry_list.join(','),
          group_list: formData.group_list.join(','),
          sgmt_list: formData.sgmt_list.join(',')
        }),
      })
      if (res.ok) {
        const result = await res.json()
        const articleCode = result.code

        if (selectedFile && articleCode) {
          try {
            await uploadArticleImage(articleCode, selectedFile)
          } catch (uploadError) {
            console.error('Upload failed:', uploadError)
            toast.warning('Story posted but image upload failed. Please try again from edit page.')
          }
        }

        // Upload extra images
        for (let i = 0; i < extraFiles.length; i++) {
          const file = extraFiles[i]
          if (file) {
            try {
              const extraFormData = new FormData()
              extraFormData.append('file', file)
              extraFormData.append('filename', `full${articleCode}-${i + 1}.jpg`)
              extraFormData.append('folder', 'news')
              await fetch('/api/upload', {
                method: 'POST',
                body: extraFormData
              })
            } catch (e) {
              console.error(`Failed to upload extra image ${i+1}:`, e)
            }
          }
        }

        toast.success('Story posted successfully!')
        router.push('/admin/news')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(`Error: ${data.error || 'Failed to save'}`)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Post New Article</h2>
          <p className="text-slate-500 font-medium mt-1">Rich Content Editor with Sticky Controls</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="bg-brand text-white px-10 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Posting...' : 'Post Article'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-slate-200 sticky top-0 z-50 shadow-xl shadow-slate-900/5">
        {[
          { id: 'details', label: "Article's Details", ref: detailsRef, icon: FileText },
          { id: 'meta', label: "Meta Tags", ref: metaRef, icon: Search },
          { id: 'picture', label: "Picture", ref: pictureRef, icon: ImageIcon },
          { id: 'more', label: "More Pics", ref: morePicsRef, icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => scrollToSection(tab.ref as any, tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-brand hover:bg-brand/5'}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Section 1: Article's Details */}
          <div ref={detailsRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-brand" />
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Article's Details</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">News Heading</label>
                <textarea 
                  value={formData.article_head}
                  onChange={e => {
                    setFormData({ ...formData, article_head: e.target.value })
                    if (errors.article_head) setErrors(prev => {
                      const next = { ...prev }
                      delete next.article_head
                      return next
                    })
                  }}
                  placeholder="Enter news heading..."
                  className={`w-full text-3xl font-black text-slate-900 placeholder:text-slate-200 outline-none border-none resize-none min-h-[80px] leading-tight ${errors.article_head ? 'placeholder:text-rose-200' : ''}`}
                />
                {errors.article_head && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.article_head}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Summary</label>
                <textarea 
                  value={formData.article_desc}
                  onChange={e => setFormData({ ...formData, article_desc: e.target.value })}
                  placeholder="Provide a brief summary..."
                  className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-medium text-slate-600 outline-none border border-slate-100 focus:bg-white focus:border-brand/20 min-h-[80px] resize-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detailed News (HTML Editor)</label>
                <Editor 
                  value={formData.article_body}
                  onChange={content => setFormData({ ...formData, article_body: content })}
                  placeholder="Start writing your news story..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Youtube Link</label>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner">
                    <Video className="h-4 w-4 text-rose-600" />
                    <input 
                      value={formData.vlink}
                      onChange={e => setFormData({ ...formData, vlink: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Meta Tags */}
          <div ref={metaRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Meta Tags</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Permalink</label>
                <div className={`flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border shadow-inner transition-all ${errors.permalink ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
                  <Globe className={`h-4 w-4 ${errors.permalink ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span className="text-slate-400 text-xs font-bold">/news/</span>
                  <input 
                    value={formData.permalink}
                    onChange={e => {
                      setIsManualPermalink(true)
                      setFormData({ ...formData, permalink: e.target.value })
                      if (errors.permalink) setErrors(prev => {
                        const next = { ...prev }
                        delete next.permalink
                        return next
                      })
                    }}
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1"
                  />
                </div>
                {errors.permalink && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.permalink}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Keywords</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <input 
                    value={formData.meta_keys}
                    onChange={e => setFormData({ ...formData, meta_keys: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Page Title</label>
                <input 
                  value={formData.meta_title}
                  onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Custom page title for search results..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-brand/20 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Description</label>
                <textarea 
                  value={formData.meta_desc}
                  onChange={e => setFormData({ ...formData, meta_desc: e.target.value })}
                  placeholder="Short description for Google search results..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-600 outline-none resize-none h-24 focus:bg-white focus:border-brand/20 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Further Link (External Source)</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner">
                  <LinkIcon className="h-4 w-4 text-slate-400" />
                  <input 
                    value={formData.reflink}
                    onChange={e => setFormData({ ...formData, reflink: e.target.value })}
                    placeholder="https://external-link.com/..."
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Picture */}
          <div ref={pictureRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-rose-500" />
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Picture</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center space-y-3 transition-all cursor-pointer group relative overflow-hidden ${errors.image ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100 hover:border-brand/20 hover:bg-brand/[0.02]'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all w-48"
                        >
                          Change Image
                        </button>
                        <button 
                          type="button" 
                          onClick={removePrimaryImage}
                          className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all w-48"
                        >
                          Remove Image
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">Upload Primary Image</p>
                    </>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-brand animate-bounce" />
                    </div>
                  )}
                </div>
                {errors.image && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.image}</p>}
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Featured Image Caption</label>
                  <input 
                    value={formData.photo_caption}
                    onChange={e => setFormData({ ...formData, photo_caption: e.target.value })}
                    placeholder="Enter caption for the main featured image..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-medium text-slate-600 outline-none shadow-inner focus:bg-white focus:border-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6 bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Picture Formatting</h4>
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500">Image Size</label>
                     <select 
                       defaultValue="770"
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                     >
                       <option value="100">Portrait - 100px</option>
                       <option value="250">Medium - 250px</option>
                       <option value="390">Half - 390px</option>
                       <option value="520">Semi Full - 720px</option>
                       <option value="770">Full - 770px</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500">Alignment</label>
                     <select 
                       defaultValue="1"
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                     >
                       <option value="0">Center</option>
                       <option value="1">Left</option>
                       <option value="2">Right</option>
                     </select>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Section 4: More Pics */}
          <div ref={morePicsRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Layers className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">More Pics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {extraFiles.map((_, i) => (
                 <div 
                   key={i} 
                   onClick={() => extraInputsRef.current[i]?.click()}
                   className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 hover:bg-white hover:border-brand/20 transition-all cursor-pointer group shadow-inner relative overflow-hidden"
                 >
                    <input 
                      type="file"
                      ref={el => { extraInputsRef.current[i] = el }}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleExtraFileChange(i, e)}
                    />
                    
                    {extraPreviews[i] ? (
                      <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md">
                        <img src={extraPreviews[i]!} className="h-full w-full object-cover" alt={`Preview ${i+1}`} />
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeExtraFile(i); }}
                          className="absolute top-1 right-1 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <ImageIcon className="h-6 w-6 text-slate-200" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Image #{i + 1}</p>
                      <p className="text-[10px] text-slate-300 font-bold">
                        {extraFiles[i] ? extraFiles[i]?.name : 'Attach additional photo'}
                      </p>
                    </div>
                    
                    {!extraFiles[i] && (
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-5 w-5 text-brand" />
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 sticky top-28 shadow-2xl shadow-slate-900/20 border border-white/5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-6">
              <Settings className="h-5 w-5 text-brand" />
              <h3 className="font-black uppercase text-xs tracking-[0.2em]">Publishing Controls</h3>
            </div>

            <div className="space-y-8">
              {/* Status */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, active: 2 })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.active === 2 ? 'bg-brand border-brand text-white shadow-lg shadow-brand/40' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, active: 1 })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.active === 1 ? 'bg-white/10 border-white/20 text-white shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Draft
                  </button>
                </div>
              </div>

              {/* Main Category */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Main Category</label>
                <select 
                  value={formData.cgry_code}
                  onChange={e => setFormData({ ...formData, cgry_code: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-brand transition-all"
                >
                  {(editorData.categories || []).map((c: any) => (
                    <option key={c.code} value={c.code} className="bg-slate-800">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Multi-Category Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Multi-Category Selection</label>
                <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5 space-y-1">
                  {(editorData.categories || []).map((c: any) => (
                    <label key={c.code} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-all">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${formData.cgry_list.includes(c.code) ? 'bg-brand border-brand' : 'border-white/20 bg-transparent'}`}>
                        {formData.cgry_list.includes(c.code) && <Check className="h-3 w-3 text-white stroke-[4]" />}
                      </div>
                      <input 
                        type="checkbox"
                        checked={formData.cgry_list.includes(c.code)}
                        onChange={() => handleCategoryToggle(c.code)}
                        className="hidden"
                      />
                      <span className="text-[11px] font-bold text-white/60 group-hover:text-white">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Multi-Segment Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Multi-Segment Selection</label>
                <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5 space-y-1">
                  {(editorData.segments || []).map((s: any) => (
                    <label key={s.code} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-all">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${formData.sgmt_list.includes(s.code) ? 'bg-brand border-brand' : 'border-white/20 bg-transparent'}`}>
                        {formData.sgmt_list.includes(s.code) && <Check className="h-3 w-3 text-white stroke-[4]" />}
                      </div>
                      <input 
                        type="checkbox"
                        checked={formData.sgmt_list.includes(s.code)}
                        onChange={() => handleSegmentToggle(s.code)}
                        className="hidden"
                      />
                      <span className="text-[11px] font-bold text-white/60 group-hover:text-white">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group (Special Tags) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Group (Special Tags)</label>
                <div className="grid grid-cols-1 gap-3">
                  {(editorData.groups || []).map((g: any) => (
                    <label key={g.code} className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all group ${formData.group_list.includes(g.code) ? 'bg-brand/20 border-brand/50 shadow-lg shadow-brand/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${formData.group_list.includes(g.code) ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-white/20'}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-[11px] font-black uppercase tracking-tight ${formData.group_list.includes(g.code) ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>{g.name}</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={formData.group_list.includes(g.code)}
                        onChange={() => handleGroupToggle(g.code)}
                        className="hidden"
                      />
                      {formData.group_list.includes(g.code) && <CheckCircle2 className="h-4 w-4 text-brand" />}
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Dropdowns */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mode</label>
                  <select 
                    value={formData.mode_code}
                    onChange={e => setFormData({ ...formData, mode_code: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none"
                  >
                    {(editorData.modes || []).map((m: any) => (
                      <option key={m.code} value={m.code} className="bg-slate-800">{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Segment</label>
                  <select 
                    value={formData.sgmt_code}
                    onChange={e => setFormData({ ...formData, sgmt_code: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none"
                  >
                    {(editorData.segments || []).map((s: any) => (
                      <option key={s.code} value={s.code} className="bg-slate-800">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reporter / Writer</label>
                  <input 
                    value={formData.reporter}
                    onChange={e => setFormData({ ...formData, reporter: e.target.value })}
                    placeholder="Name of reporter..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-brand transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Language</label>
                  <select 
                    value={formData.lang_code}
                    onChange={e => setFormData({ ...formData, lang_code: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none"
                  >
                    {(editorData.languages || []).map((l: any) => (
                      <option key={l.code} value={l.code} className="bg-slate-800">{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
               <button 
                type="submit"
                className="w-full bg-brand text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/40 hover:scale-105 active:scale-95 transition-all"
               >
                 Post Article Now
               </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
