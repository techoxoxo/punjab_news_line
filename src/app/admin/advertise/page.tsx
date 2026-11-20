import React from 'react'
import { query } from '@/lib/db'
import Link from 'next/link'
import { 
  Plus, 
  Search,
  Edit,
  Eye,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Layout,
  MapPin
} from 'lucide-react'
import { FallbackImage } from '@/components/public/fallback-image'
import { advtImageUrl } from '@/lib/image'
import { DeleteButton } from '@/components/admin/DeleteButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

type Status = 'all' | 'running' | 'paused'

async function getAdvertisements(q: string, status: Status, page: number) {
  const where: string[] = []
  const params: unknown[] = []
  if (q) {
    params.push(`%${q}%`)
    where.push(`(advt_head ILIKE $${params.length} OR permalink ILIKE $${params.length})`)
  }
  if (status === 'running') where.push('active = 2')
  if (status === 'paused') where.push('active <> 2')
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const [countRows, ads] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM ox_advt ${whereSql}`, params),
    query(
      `SELECT advt_code, advt_head, permalink, active, advt_body, updated_at, geo_enabled, start_date, end_date
       FROM ox_advt ${whereSql}
       ORDER BY advt_code DESC
       LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
      params
    ),
  ])
  return { ads, total: parseInt(countRows[0]?.count ?? '0', 10) }
}

export default async function AdminAdvertisePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const status: Status = sp.status === 'running' || sp.status === 'paused' ? sp.status : 'all'
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const { ads, total } = await getAdvertisements(q, status, page)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hrefFor = (over: { status?: Status; page?: number }) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    const st = over.status ?? status
    if (st !== 'all') p.set('status', st)
    if (over.page && over.page > 1) p.set('page', String(over.page))
    const qs = p.toString()
    return `/admin/advertise${qs ? `?${qs}` : ''}`
  }
  const tabClass = (active: boolean) =>
    `px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg ${active ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Advertisement Center</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your campaigns, banners, and promotional content</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/advertise/geo-report"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-emerald-200 text-emerald-700 font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
          >
            <MapPin className="h-4 w-4" />
            Geo Report
          </Link>
          <Link 
            href="/admin/advertise/new" 
            className="bg-brand text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-5 w-5" />
            Create New Campaign
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-6">
          <form method="GET" action="/admin/advertise" className="flex-1 relative group">
             {status !== 'all' && <input type="hidden" name="status" value={status} />}
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand transition-colors" />
             <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search campaigns by title or permalink..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
             />
          </form>
          <div className="flex items-center gap-3">
            <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block" />
            <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
               <Link href={hrefFor({ status: 'all' })} className={tabClass(status === 'all')}>All Ads</Link>
               <Link href={hrefFor({ status: 'running' })} className={tabClass(status === 'running')}>Running</Link>
               <Link href={hrefFor({ status: 'paused' })} className={tabClass(status === 'paused')}>Paused</Link>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Campaign Details</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Placement</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Megaphone className="h-8 w-8 text-slate-200" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-black uppercase text-xs tracking-widest">No campaigns found</p>
                        <p className="text-slate-400 text-sm font-medium mt-1">Start by creating your first advertisement campaign</p>
                      </div>
                      <Link href="/admin/advertise/new" className="mt-4 text-brand font-black text-xs uppercase tracking-widest hover:underline">Get Started &rarr;</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                ads.map((ad: any) => (
                  <tr key={ad.advt_code} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-8">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ad.active === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {ad.active === 2 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {ad.active === 2 ? 'Running' : 'Paused'}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-24 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                          <FallbackImage 
                            src={advtImageUrl(ad.advt_code, ad.updated_at)} 
                            alt={ad.advt_head || 'Advertisement'} 
                            fill 
                            unoptimized
                            sizes="100px"
                            className="object-cover" 
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors text-base">{ad.advt_head}</h4>
                            {ad.geo_enabled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-wider">
                                <MapPin className="h-2 w-2" />
                                Geo-Fenced
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                               <ExternalLink className="h-3 w-3" />
                               /{ad.permalink}
                            </p>
                            {(ad.start_date || ad.end_date) && (
                              <p className="text-[9px] font-semibold text-slate-400">
                                {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : 'Start'}
                                {' - '}
                                {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : 'End'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-slate-50 w-fit px-3 py-1 rounded-lg border border-slate-100">
                          <Globe className="h-3 w-3 text-brand" />
                          {ad.advt_body?.split('|')[0] || 'Homepage'}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest px-3">
                          <Layout className="h-3 w-3" />
                          {ad.advt_body?.split('|')[1] || 'Top'}
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center justify-end gap-2">
                         <a 
                          href={ad.permalink?.startsWith('http') ? ad.permalink : (ad.permalink ? `https://${ad.permalink}` : '#')} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl hover:bg-slate-200 text-slate-400 transition-all"
                         >
                           <Eye className="h-5 w-5" />
                         </a>
                         <Link 
                          href={`/admin/advertise/${ad.advt_code}`}
                          className="p-2.5 rounded-xl hover:bg-brand/10 text-slate-400 hover:text-brand transition-all"
                         >
                           <Edit className="h-5 w-5" />
                         </Link>
                         <DeleteButton id={ad.advt_code} entity="advertise" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-100 text-xs font-bold text-slate-500">
            <span>{total} campaigns · Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={hrefFor({ page: page - 1 })} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Previous</Link>}
              {page < totalPages && <Link href={hrefFor({ page: page + 1 })} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
