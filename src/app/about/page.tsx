import React from 'react'
import { Metadata } from 'next'
import { Newspaper, Target, Users, Award, ShieldCheck, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Punjab Newsline',
  description: 'Learn about the legacy and mission of Punjab Newsline, the leading digital news platform for the Punjab region since 2005.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 py-10">
      <section className="text-center space-y-6">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">The Legacy</span>
        <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight">Pioneering Digital Journalism</h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
          For nearly two decades, Punjab Newsline has been the heartbeat of regional reporting, delivering unbiased news to millions worldwide.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-brand/5 flex items-center justify-center text-brand">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Our Mission</h3>
          <p className="text-slate-500 leading-relaxed font-medium">
            To provide the most accurate, real-time, and comprehensive news coverage of Punjab, bridging the gap between the region and the global diaspora.
          </p>
        </div>
        <div className="p-10 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Editorial Integrity</h3>
          <p className="text-slate-500 leading-relaxed font-medium">
            We adhere to the highest standards of journalistic ethics, ensuring every story is verified, balanced, and serves the public interest.
          </p>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Globe className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-8 max-w-2xl">
          <h2 className="text-4xl font-display font-black tracking-tight">Serving the Global Punjabi Community</h2>
          <p className="text-lg text-white/60 leading-relaxed font-medium">
            From the bustling streets of Amritsar to the vibrant communities in Canada, UK, and Australia, we bring home closer to you. Our multi-language platform ensures that language is never a barrier to staying informed.
          </p>
          <div className="flex flex-wrap gap-10 pt-4">
             <div>
               <div className="text-3xl font-black text-brand">2005</div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Established</div>
             </div>
             <div>
               <div className="text-3xl font-black text-brand">1M+</div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Monthly Readers</div>
             </div>
             <div>
               <div className="text-3xl font-black text-brand">24/7</div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Live Updates</div>
             </div>
          </div>
        </div>
      </section>
    </div>
  )
}
