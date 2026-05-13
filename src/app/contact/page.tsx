'use client'

import React, { useState } from 'react'
import { Mail, Phone, MapPin, Send, MessageSquare, Globe, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { submitContactForm } from '@/app/actions/contact'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const message = formData.get('message') as string

    const result = await submitContactForm({ name, email, message })

    if (result.success) {
      setSuccess(true)
      e.currentTarget.reset()
    } else {
      setError(result.error || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-8xl mx-auto px-4 lg:px-8 py-10 space-y-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <div className="space-y-6">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Contact Us</span>
            <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight leading-[0.9]">Get in touch with our newsroom.</h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Have a story tip, a question, or feedback? Our team is ready to listen and respond.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm group hover:border-brand/20 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-brand/5 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Us</div>
                <div className="text-lg font-bold text-slate-900">editor@punjabnewsline.com</div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm group hover:border-brand/20 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Call Us</div>
                <div className="text-lg font-bold text-slate-900">+91 172 4600000</div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm group hover:border-brand/20 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visit Us</div>
                <div className="text-lg font-bold text-slate-900">Chandigarh, India</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent opacity-50" />
          
          {success ? (
            <div className="relative z-10 py-10 text-center space-y-6">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-black text-white">Message Sent!</h2>
                <p className="text-white/60 font-medium">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
              <button 
                onClick={() => setSuccess(false)}
                className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="relative z-10 space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-black text-white">Send a Message</h2>
                <p className="text-white/50 font-medium">We usually respond within 24 hours.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</label>
                  <input 
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Address</label>
                  <input 
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Your Message</label>
                <textarea 
                  name="message"
                  required
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-medium resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold">
                  {error}
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-brand text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
