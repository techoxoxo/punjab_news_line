'use client'

import React, { useState } from 'react'
import { subscribeNewsletter } from '@/app/actions/newsletter'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await subscribeNewsletter(email)

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Subscribed successfully!' })
      setEmail('')
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to subscribe' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Your email address" 
          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900" 
        />
        <button 
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-brand hover:shadow-brand/20 active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-900 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe Now'
          )}
        </button>
      </form>
      
      {message && (
        <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-lg animate-in fade-in slide-in-from-top-1 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
