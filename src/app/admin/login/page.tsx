'use client'

import React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Newspaper, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { FallbackImage } from '@/components/public/fallback-image'
import { logoUrl } from '@/lib/image'

export default function AdminLoginPage() {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Invalid credentials or unauthorized access.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 ring-1 ring-slate-200/50">
               <FallbackImage 
                 src={logoUrl()} 
                 alt="Logo" 
                 width={240} 
                 height={60} 
                 className="h-10 w-auto object-contain"
               />
             </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Identity Management System</p>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Username</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-brand transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                  placeholder="Enter your handle"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-brand transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                <p className="text-xs font-bold text-rose-600 text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 hover:bg-brand hover:shadow-brand/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Authorized personnel only. Access is monitored.
        </p>
      </div>
    </div>
  )
}
