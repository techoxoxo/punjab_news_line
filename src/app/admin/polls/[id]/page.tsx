'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  BarChart3,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

export default function EditPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    pllx_head: '',
    poll1: '',
    poll2: '',
    poll3: '',
    poll4: '',
    poll5: '',
    poll6: '',
    count1: 0,
    count2: 0,
    count3: 0,
    count4: 0,
    count5: 0,
    count6: 0,
    permalink: '',
    active: 2,
    lang_code: 1
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/admin/polls/${id}`)
      .then(res => res.json())
      .then(data => {
        setFormData(data)
        setLoading(false)
      })
      .catch(err => {
        toast.error('Failed to load poll data')
        setLoading(false)
      })
  }, [id])

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

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/polls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success('Poll updated successfully!')
        router.refresh()
        router.push('/admin/polls')
      } else {
        const data = await res.json()
        toast.error(`Error: ${data.error || 'Failed to update'}`)
      }
    } catch (error) {
      toast.error('A network error occurred.')
    } finally {
      setSaving(false)
    }
  }

  const resetVotes = () => {
    if (confirm('Are you sure you want to reset all vote counts to zero? This cannot be undone.')) {
      setFormData(prev => ({
        ...prev,
        count1: 0, count2: 0, count3: 0, count4: 0, count5: 0, count6: 0
      }))
      toast.info('Votes reset in form. Save changes to commit.')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <RefreshCw className="h-8 w-8 text-brand animate-spin" />
      <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Loading Poll Data...</p>
    </div>
  )

  const totalVotes = (formData.count1 || 0) + (formData.count2 || 0) + (formData.count3 || 0) + (formData.count4 || 0) + (formData.count5 || 0) + (formData.count6 || 0)

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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Edit Poll</h2>
            <p className="text-slate-500 font-medium">Updating poll #{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={resetVotes}
            className="px-6 py-3 rounded-2xl border border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all"
          >
            Reset Votes
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Engagement</p>
             <div className="flex items-center gap-3 mt-2">
               <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                 <BarChart3 className="h-5 w-5" />
               </div>
               <span className="text-2xl font-black text-slate-900">{totalVotes.toLocaleString()} <span className="text-xs text-slate-400 font-bold ml-1">Votes</span></span>
             </div>
           </div>
           {/* Add more stats if needed */}
        </div>

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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Poll Options & Vote Distribution</label>
                {errors.options && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{errors.options}</p>}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => {
                  const votes = (formData as any)[`count${i}`] || 0;
                  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const hasValue = (formData as any)[`poll${i}`];

                  return (
                    <div key={i} className="group flex flex-col md:flex-row gap-4">
                      <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 shadow-inner focus-within:bg-white focus-within:border-brand/20 transition-all">
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
                      
                      {hasValue && (
                        <div className="md:w-48 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Votes</span>
                            <span className="text-sm font-black text-slate-900">{votes}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Share</span>
                            <span className="text-sm font-black text-brand">{percentage}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
