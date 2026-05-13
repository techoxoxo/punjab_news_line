import React from 'react'
import { query } from '@/lib/db'
import { 
  TrendingUp, 
  Eye, 
  Newspaper, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3
} from 'lucide-react'

async function getStats() {
  const articleCount = await query('SELECT count(*) FROM ox_article WHERE active = 2')
  const videoCount = await query('SELECT count(*) FROM ox_video WHERE active = 2')
  const galleryCount = await query('SELECT count(*) FROM ox_gallery WHERE active = 2')
  const totalHits = await query('SELECT sum(hits) FROM ox_article WHERE active = 2')
  const recentArticles = await query('SELECT article_head, date, hits, permalink FROM ox_article WHERE active = 2 ORDER BY date DESC LIMIT 5')
  
  // Fetch monthly analytics (last 6 months)
  const monthlyAnalytics = await query(`
    SELECT 
      TO_CHAR(date, 'Mon') as month,
      SUM(hits) as hits,
      COUNT(*) as articles
    FROM ox_article 
    WHERE date >= NOW() - INTERVAL '6 months' AND active = 2
    GROUP BY TO_CHAR(date, 'Mon'), DATE_TRUNC('month', date)
    ORDER BY DATE_TRUNC('month', date) ASC
  `)
  
  return {
    articles: parseInt((articleCount[0] as any).count),
    videos: parseInt((videoCount[0] as any).count),
    galleries: parseInt((galleryCount[0] as any).count),
    hits: parseInt((totalHits[0] as any).sum || '0'),
    recent: recentArticles,
    analytics: monthlyAnalytics.map((m: any) => ({
      month: m.month,
      hits: parseInt(m.hits || '0'),
      articles: parseInt(m.articles || '0')
    }))
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const maxHits = Math.max(...stats.analytics.map(a => a.hits), 1)
  
  // Calculate trends based on last 2 months if available
  let articleTrend = 0
  let hitsTrend = 0
  if (stats.analytics.length >= 2) {
    const current = stats.analytics[stats.analytics.length - 1]
    const previous = stats.analytics[stats.analytics.length - 2]
    
    if (previous.articles > 0) {
      articleTrend = ((current.articles - previous.articles) / previous.articles) * 100
    }
    if (previous.hits > 0) {
      hitsTrend = ((current.hits - previous.hits) / previous.hits) * 100
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Executive Overview</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time performance metrics for Punjab Newsline</p>
        </div>
        <div className="bg-slate-100 p-2 rounded-2xl flex items-center gap-2">
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-black text-slate-900 uppercase tracking-widest">Global Data</div>
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Historical</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          label="Total Articles" 
          value={stats.articles.toLocaleString()} 
          icon={Newspaper} 
          trend={`${articleTrend > 0 ? '+' : ''}${articleTrend.toFixed(1)}%`} 
          positive={articleTrend >= 0}
        />
        <StatCard 
          label="Total Readership" 
          value={(stats.hits ?? 0).toLocaleString()} 
          icon={Eye} 
          trend={`${hitsTrend > 0 ? '+' : ''}${hitsTrend.toFixed(1)}%`} 
          positive={hitsTrend >= 0}
        />
        <StatCard 
          label="Media Assets" 
          value={(stats.videos + stats.galleries).toLocaleString()} 
          icon={TrendingUp} 
          trend="Videos/Galleries" 
          positive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Monthly Readership</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-brand" />
                Hits
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 pt-4">
            {stats.analytics.map((m, i) => {
              const height = (m.hits / maxHits) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full relative flex flex-col items-center">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md mb-2 pointer-events-none whitespace-nowrap">
                      {(m.hits ?? 0).toLocaleString()} Hits
                    </div>
                    <div 
                      className="w-full max-w-[40px] bg-brand/10 group-hover:bg-brand transition-all duration-500 rounded-t-xl relative overflow-hidden"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recently Published */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Latest Stories</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {stats.recent.map((article: any, i: number) => (
              <div key={i} className="p-6 hover:bg-slate-50 transition-colors group">
                <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-brand transition-colors">{article.article_head}</h4>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="text-[9px] font-black text-brand uppercase tracking-widest">{(article.hits ?? 0).toLocaleString()} Hits</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
             <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-brand/20 hover:text-brand transition-all shadow-sm">
               Browse Library
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, trend, positive }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="h-32 w-32 text-slate-900" />
      </div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all duration-500">
          <Icon className="h-7 w-7 text-brand group-hover:text-white" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1 relative z-10">
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">{label}</p>
        <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h4>
      </div>
    </div>
  )
}
