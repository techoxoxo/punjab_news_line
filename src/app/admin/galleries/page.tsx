import React from 'react'
import { query } from '@/lib/db'
import Link from 'next/link'
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react'
import { FallbackImage } from '@/components/public/fallback-image'
import { logoUrl } from '@/lib/image'
import { DeleteButton } from '@/components/admin/DeleteButton'

async function getGalleries(page = 1, search = '') {
  const limit = 20
  const offset = (page - 1) * limit
  
  let whereClause = ''
  let params: any[] = [limit, offset]
  
  if (search) {
    whereClause = 'WHERE g.gallery_head ILIKE $3'
    params.push(`%${search}%`)
  }

  const result = await query(
    `SELECT g.gallery_code, g.gallery_head, g.date, g.hits, g.active, g.permalink, c.cgry_name
     FROM ox_gallery g
     LEFT JOIN ox_code c ON g.cgry_code = c.cgry_code
     ${whereClause} 
     ORDER BY g.date DESC 
     LIMIT $1 OFFSET $2`,
    params
  )

  const countResult = await query(
    `SELECT count(*) FROM ox_gallery g ${search ? 'WHERE g.gallery_head ILIKE $1' : ''}`, 
    search ? [`%${search}%`] : []
  )
  
  return {
    galleries: result,
    total: parseInt((countResult[0] as any).count)
  }
}

export default async function AdminGalleriesPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.q || ''
  const { galleries, total } = await getGalleries(page, search)
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Photo Galleries</h2>
          <p className="text-slate-500 font-medium mt-1">Manage and publish visual stories</p>
        </div>
        <Link 
          href="/admin/galleries/new" 
          className="bg-brand text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" />
          Create New Gallery
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
          <form action="/admin/galleries" method="GET" className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand transition-colors" />
             <input 
              name="q"
              type="text" 
              placeholder="Search galleries..." 
              defaultValue={search}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
             />
          </form>
          <button className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Gallery</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Category</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Views</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {galleries.map((gal: any) => (
                <tr key={gal.gallery_code} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${gal.active === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${gal.active === 2 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {gal.active === 2 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4 max-w-md">
                      <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 relative">
                        <FallbackImage 
                          src={`/images/gallery/full${gal.gallery_code}.jpg`} 
                          alt="" 
                          fill
                          sizes="64px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          fallbackSrc={logoUrl()}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 line-clamp-2 group-hover:text-brand transition-colors text-sm leading-tight">{gal.gallery_head}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 truncate">/{gal.permalink}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {gal.cgry_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="font-semibold text-slate-600 text-sm">
                       {new Date(gal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <Eye className="h-4 w-4 text-slate-300" />
                       <span className="font-black text-slate-900 text-sm">{(gal.hits ?? 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <Link 
                        href={`/photo-gallery/${gal.permalink}`} 
                        target="_blank"
                        className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-all"
                       >
                         <Eye className="h-5 w-5" />
                       </Link>
                       <Link 
                        href={`/admin/galleries/${gal.gallery_code}`}
                        className="p-2 rounded-lg hover:bg-brand/10 text-slate-400 hover:text-brand transition-all"
                       >
                         <Edit className="h-5 w-5" />
                       </Link>
                       <DeleteButton id={gal.gallery_code} entity="galleries" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">
            Showing <span className="text-slate-900">{galleries.length}</span> of <span className="text-slate-900">{total.toLocaleString()}</span> galleries
          </p>
          <div className="flex items-center gap-2">
            <Link 
              href={page > 1 ? `/admin/galleries?page=${page - 1}${search ? `&q=${search}` : ''}` : '#'}
              className={`p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all ${page === 1 ? 'opacity-30 pointer-events-none' : ''}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
                .reduce((acc: (number | string)[], p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => (
                  p === '...' ? (
                    <span key={`sep-${i}`} className="px-2 text-slate-300 font-black">...</span>
                  ) : (
                    <Link 
                      key={p} 
                      href={`/admin/galleries?page=${p}${search ? `&q=${search}` : ''}`}
                      className={`h-10 w-10 rounded-xl font-black text-sm flex items-center justify-center transition-all ${p === page ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {p}
                    </Link>
                  )
                ))}
            </div>

            <Link 
              href={page < totalPages ? `/admin/galleries?page=\${page + 1}\${search ? \`&q=\${search}\` : ''}` : '#'}
              className={`p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all \${page === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
