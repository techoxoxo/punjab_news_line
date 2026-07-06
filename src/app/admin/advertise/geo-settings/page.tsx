'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Save, RefreshCw, CheckCircle2, Globe,
  Shield, AlertTriangle, Search, ChevronDown, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

interface Region {
  id: number
  name: string
  slug: string
  country: string
  lat_min: number | null
  lat_max: number | null
  lon_min: number | null
  lon_max: number | null
  is_active: boolean
  sort_order: number
  parent_id: number | null
  region_type: string
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className={`shrink-0 h-7 w-12 rounded-full flex items-center transition-all duration-300 ${
        on ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
      } p-1`}
    >
      <div className="h-5 w-5 rounded-full bg-white shadow flex items-center justify-center">
        {on && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      </div>
    </button>
  )
}

export default function GeoFenceSettingsPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState('')
  const [expandedStates, setExpandedStates] = useState<Record<number, boolean>>({ })

  const fetchRegions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/geofence-regions')
      const data: Region[] = await res.json()
      setRegions(data)
      setDirty({})
      // Auto-expand Punjab on first load
      const punjab = data.find(r => r.slug === 'punjab')
      if (punjab) setExpandedStates({ [punjab.id]: true })
    } catch {
      toast.error('Failed to load regions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegions() }, [fetchRegions])

  const toggle = (id: number, current: boolean) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
    setDirty(prev => ({ ...prev, [id]: !current }))
  }

  // Toggle all districts under a state
  const toggleAllChildren = (parentId: number, targetActive: boolean) => {
    const children = regions.filter(r => r.parent_id === parentId)
    const updates: Record<number, boolean> = {}
    const updated = regions.map(r => {
      if (r.parent_id === parentId) {
        updates[r.id] = targetActive
        return { ...r, is_active: targetActive }
      }
      return r
    })
    setRegions(updated)
    setDirty(prev => ({ ...prev, ...updates }))
  }

  const save = async () => {
    const updates = Object.entries(dirty).map(([id, is_active]) => ({
      id: Number(id), is_active,
    }))
    if (updates.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/geofence-regions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`Saved ${data.updated} region${data.updated !== 1 ? 's' : ''}. Takes effect in ~5 min.`)
      setDirty({})
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Split into top-level and children
  const topLevel = regions.filter(r => r.parent_id === null)
  const childrenOf = (id: number) => regions.filter(r => r.parent_id === id)

  const matchesSearch = (r: Region) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())

  // When searching, flatten everything
  const filteredFlat = search
    ? regions.filter(matchesSearch)
    : null

  const activeCount = regions.filter(r => r.is_active).length
  const hasDirty = Object.keys(dirty).length > 0
  const activeDistricts = regions.filter(r => r.region_type === 'district' && r.is_active).length
  const totalDistricts = regions.filter(r => r.region_type === 'district').length

  const typeLabel: Record<string, string> = {
    state: 'State',
    ut: 'UT',
    district: 'District',
  }
  const typeColor: Record<string, string> = {
    state: 'bg-blue-100 text-blue-600',
    ut: 'bg-purple-100 text-purple-600',
    district: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/advertise/geo-report"
            className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Geo-Fence Configuration</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Region Settings</h2>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Select states, UTs, and Punjab districts for geo-fence compliance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchRegions} disabled={loading}
            className="h-11 w-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={save} disabled={!hasDirty || saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-40 ${
              hasDirty ? 'bg-brand text-white shadow-brand/20 hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
            Save {hasDirty ? `(${Object.keys(dirty).length})` : ''}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[2rem] border border-emerald-200 shadow-sm p-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Active Regions</p>
            <p className="text-2xl font-black text-emerald-700">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-amber-200 shadow-sm p-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Punjab Districts</p>
            <p className="text-2xl font-black text-amber-700">{activeDistricts}/{totalDistricts}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Regions</p>
            <p className="text-2xl font-black text-slate-700">{regions.length}</p>
          </div>
        </div>
        {hasDirty && (
          <div className="bg-amber-50 rounded-[2rem] border border-amber-200 shadow-sm p-5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Unsaved</p>
              <p className="text-2xl font-black text-amber-700">{Object.keys(dirty).length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search states, UTs, or Punjab districts..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-800 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all shadow-sm" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-blue-700 text-xs font-medium leading-relaxed">
          Toggle states/UTs or individual Punjab districts. Changes apply within <strong>5 minutes</strong>. 
          Use &ldquo;Select All&rdquo; / &ldquo;Deselect All&rdquo; to quickly configure all districts of Punjab at once.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      ) : filteredFlat ? (
        /* Flat search results */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFlat.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">No results for &ldquo;{search}&rdquo;</div>
          )}
          {filteredFlat.map(r => (
            <div key={r.id}
              className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 transition-all cursor-pointer hover:scale-[1.01] ${
                r.is_active ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
              } ${r.id in dirty ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}
              onClick={() => toggle(r.id, r.is_active)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${typeColor[r.region_type] ?? 'bg-slate-100 text-slate-500'}`}>
                    {typeLabel[r.region_type] ?? r.region_type}
                  </span>
                  {r.id in dirty && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                </div>
                <p className={`font-black text-sm mt-1 ${r.is_active ? 'text-emerald-800' : 'text-slate-700'}`}>{r.name}</p>
              </div>
              <Toggle on={r.is_active} onChange={() => toggle(r.id, r.is_active)} />
            </div>
          ))}
        </div>
      ) : (
        /* Hierarchical view */
        <div className="space-y-3">
          {topLevel.map(state => {
            const districts = childrenOf(state.id)
            const isExpanded = expandedStates[state.id] ?? false
            const activeDistricts = districts.filter(d => d.is_active).length
            const allOn = districts.length > 0 && activeDistricts === districts.length
            const someOn = activeDistricts > 0 && !allOn

            return (
              <div key={state.id} className={`rounded-[1.5rem] border-2 overflow-hidden transition-all ${
                state.is_active ? 'border-emerald-300' : 'border-slate-200'
              }`}>
                {/* State / UT Row */}
                <div className={`flex items-center gap-4 px-6 py-4 ${state.is_active ? 'bg-emerald-50' : 'bg-white'} ${state.id in dirty ? 'ring-inset ring-2 ring-amber-300' : ''}`}>
                  {/* Expand/Collapse for states with districts */}
                  {districts.length > 0 ? (
                    <button onClick={() => setExpandedStates(prev => ({ ...prev, [state.id]: !prev[state.id] }))}
                      className="text-slate-400 hover:text-slate-600 transition-colors">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${typeColor[state.region_type] ?? 'bg-slate-100 text-slate-500'}`}>
                        {typeLabel[state.region_type] ?? state.region_type}
                      </span>
                      <span className={`font-black text-sm ${state.is_active ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {state.name}
                      </span>
                      {districts.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {activeDistricts}/{districts.length} districts active
                          {someOn && ' (partial)'}
                        </span>
                      )}
                      {state.id in dirty && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                    </div>
                    {state.lat_min && (
                      <p className="text-[9px] font-mono text-slate-300 mt-0.5">
                        {state.lat_min}°–{state.lat_max}°N · {state.lon_min}°–{state.lon_max}°E
                      </p>
                    )}
                  </div>

                  {/* State-level toggle */}
                  <Toggle on={state.is_active} onChange={() => toggle(state.id, state.is_active)} />

                  {/* Select/Deselect all districts */}
                  {districts.length > 0 && (
                    <div className="flex items-center gap-2 ml-2">
                      <button onClick={() => toggleAllChildren(state.id, true)}
                        className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:underline px-2 py-1 rounded-lg hover:bg-emerald-50 transition-all">
                        All
                      </button>
                      <button onClick={() => toggleAllChildren(state.id, false)}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:underline px-2 py-1 rounded-lg hover:bg-rose-50 transition-all">
                        None
                      </button>
                    </div>
                  )}
                </div>

                {/* Districts Grid (collapsible) */}
                {districts.length > 0 && isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                      {districts.map(d => (
                        <button key={d.id}
                          onClick={() => toggle(d.id, d.is_active)}
                          className={`text-left rounded-xl border-2 px-4 py-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            d.is_active ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
                          } ${d.id in dirty ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate ${d.is_active ? 'text-emerald-800' : 'text-slate-700'}`}>
                                {d.name}
                              </p>
                              {d.id in dirty && (
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse mt-1" />
                              )}
                            </div>
                            <div className={`shrink-0 h-6 w-10 rounded-full flex items-center transition-all duration-300 ${
                              d.is_active ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
                            } p-0.5`}>
                              <div className="h-5 w-5 rounded-full bg-white shadow" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Sticky Save Bar */}
      {hasDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4 border border-white/10">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-sm font-bold">{Object.keys(dirty).length} unsaved change{Object.keys(dirty).length !== 1 ? 's' : ''}</span>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand/90 transition-all disabled:opacity-50">
            {saving ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-3 w-3" />}
            Save Now
          </button>
          <button onClick={fetchRegions} className="text-xs font-bold text-white/50 hover:text-white transition-colors">
            Discard
          </button>
        </div>
      )}
    </div>
  )
}
