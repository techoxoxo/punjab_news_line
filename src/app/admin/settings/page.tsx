import React from 'react'
import { Settings, Globe, Shield, Bell, Database, Palette } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
        <p className="text-slate-500 font-medium mt-1">Control platform behavior and global preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingSection 
          icon={Globe} 
          title="Site Meta" 
          desc="General site name, contact info, and SEO defaults"
        />
        <SettingSection 
          icon={Palette} 
          title="Appearance" 
          desc="Branding, logos, and portal theme preferences"
        />
        <SettingSection 
          icon={Database} 
          title="Legacy Sync" 
          desc="Configuration for SQL Server and data migration"
        />
        <SettingSection 
          icon={Shield} 
          title="Security" 
          desc="Authentication providers and API token management"
        />
      </div>

      <div className="bg-slate-900 p-12 rounded-[3rem] text-white flex flex-col items-center text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-brand flex items-center justify-center">
          <Settings className="h-10 w-10 text-white animate-[spin_10s_linear_infinite]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">Advanced Settings</h3>
          <p className="text-slate-400 max-w-md font-medium">Deep configuration options are coming soon in the Phase 7 release of the Punjab Newsline platform.</p>
        </div>
        <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all">
          Explore Technical Docs
        </button>
      </div>
    </div>
  )
}

function SettingSection({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="flex items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-all">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-bold text-lg text-slate-900">{title}</h4>
          <p className="text-sm text-slate-500 font-medium">{desc}</p>
        </div>
      </div>
    </div>
  )
}
