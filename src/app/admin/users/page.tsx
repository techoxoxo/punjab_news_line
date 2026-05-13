import React from 'react'
import { query } from '@/lib/db'
import { Plus, Users, Shield, Mail, Edit, Trash2 } from 'lucide-react'

async function getUsers() {
  const result = await query(
    `SELECT user_code, user_name, user_login, active, right_list 
     FROM ox_user 
     ORDER BY user_code ASC`
  )
  return result
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Editorial Team</h2>
          <p className="text-slate-500 font-medium mt-1">Manage user access and platform permissions</p>
        </div>
        <button className="bg-brand text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="h-5 w-5" />
          Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {users.map((user: any) => (
          <div key={user.user_code} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-8">
              <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand text-2xl font-black">
                {user.user_name[0]}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.active === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {user.active === 2 ? 'Active' : 'Restricted'}
              </span>
            </div>
            
            <div className="space-y-1 mb-8">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">{user.user_name}</h4>
              <p className="text-slate-500 font-bold text-xs">@{user.user_login}</p>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
               <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all">
                 <Edit className="h-4 w-4" />
                 Edit Profile
               </button>
               <button className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                 <Trash2 className="h-4 w-4" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
