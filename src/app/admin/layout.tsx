import React from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Newspaper, 
  Video, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  Megaphone,
  Users,
  BarChart3
} from 'lucide-react'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/news', label: 'Articles', icon: Newspaper },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/photos', label: 'Galleries', icon: ImageIcon },
  { href: '/admin/advertise', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/polls', label: 'Opinion Polls', icon: BarChart3 },
  { href: '/admin/users', label: 'Team', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center font-black text-white text-lg">
              P
            </div>
            <span className="font-display font-black text-lg tracking-tight group-hover:text-brand transition-colors">
              PNL Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <item.icon className="h-5 w-5 text-slate-400 group-hover:text-brand transition-colors" />
                <span className="font-semibold text-sm text-slate-300 group-hover:text-white">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-white/0 group-hover:text-white/20 transition-all" />
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button className="flex items-center gap-4 p-3 w-full rounded-xl hover:bg-red-500/10 text-red-400 transition-all group">
            <LogOut className="h-5 w-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-display text-xl font-bold text-slate-900">Admin Console</h1>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="h-10 w-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black">
               A
             </div>
          </div>
        </header>

        <div className="p-10 max-w-8xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
