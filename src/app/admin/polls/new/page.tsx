'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  BarChart3,
  Plus,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

export default function NewPollPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pllx_head: '',
    poll1: '',
    poll2: '',
    poll3: '',
    poll4: '',
    poll5: '',
    poll6: '',
    permalink: '',
    active: 2,
    lang_code: 1
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Autogenerate permalink
  useEffect(() => {
    if (formData.pllx_head) {
      const slug = formData.pllx_head
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, permalink: slug }))
    }
  }, [formData.pllx_head])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.pllx_head.trim()) newErrors.pllx_head = 'Question is required'
    if (!formData.poll1.trim() || !formData.poll2.trim()) newErrors.options = 'At least two options are required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success('Poll created successfully!')
        router.push('/admin/polls')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(`Error: ${data.error || 'Failed to create'}`)
      }
    } catch (error) {
      toast.error('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <button 
            type="button"
            onClick={() => router.back()}
            className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Opinion Poll</h2>
            <p className="text-slate-500 font-medium">Create a new interactive poll for your readers</p>
          </div>
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Poll Question</label>
              <textarea 
                value={formData.pllx_head}
                onChange={e => setFormData({ ...formData, pllx_head: e.target.value })}
                placeholder="What would you like to ask?"
                className="w-full text-2xl font-black text-slate-900 placeholder:text-slate-200 outline-none border-none resize-none min-h-[80px] leading-tight"
              />
              {errors.pllx_head && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.pllx_head}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Permalink</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400 text-xs font-bold">/poll/</span>
                  <input 
                    value={formData.permalink}
                    onChange={e => setFormData({ ...formData, permalink: e.target.value })}
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, active: 2 })}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.active === 2 ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, active: 1 })}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.active === 1 ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Draft
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Poll Options (Up to 6)</label>
                {errors.options && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{errors.options}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner group focus-within:bg-white focus-within:border-brand/20 transition-all">
                      <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm border border-slate-100">
                        {i}
                      </div>
                      <input 
                        value={(formData as any)[`poll${i}`]}
                        onChange={e => setFormData({ ...formData, [`poll${i}`]: e.target.value })}
                        placeholder={`Option ${i} text...`}
                        className="bg-transparent text-sm font-bold text-slate-600 outline-none flex-1 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
