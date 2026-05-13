import React from 'react'
import { query } from '@/lib/db'
import Link from 'next/link'
import { Plus, ImageIcon, Eye, Edit, Trash2 } from 'lucide-react'

async function getGalleries() {
  const result = await query(
    `SELECT gallery_code, gallery_head, date, hits, active, permalink 
     FROM ox_gallery 
     ORDER BY date DESC 
     LIMIT 50`
  )
  return result
}

export default async function AdminPhotosPage() {
  const galleries = await getGalleries()

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Photo Galleries</h2>
          <p className="text-slate-500 font-medium mt-1">Manage image collections and visual stories</p>
        </div>
        <button className="bg-brand text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="h-5 w-5" />
          Create New Gallery
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Title</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Views</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {galleries.map((gallery: any) => (
                <tr key={gallery.gallery_code} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${gallery.active === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${gallery.active === 2 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {gallery.active === 2 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-6 max-w-md">
                    <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-brand transition-colors">{gallery.gallery_head}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">/{gallery.permalink}</p>
                  </td>
                  <td className="p-6">
                    <span className="font-semibold text-slate-600 text-sm">
                       {new Date(gallery.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <Eye className="h-4 w-4 text-slate-300" />
                       <span className="font-black text-slate-900 text-sm">{(gallery.hits ?? 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <button className="p-2 rounded-lg hover:bg-brand/10 text-slate-400 hover:text-brand transition-all">
                         <Edit className="h-5 w-5" />
                       </button>
                       <button className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all">
                         <Trash2 className="h-5 w-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
