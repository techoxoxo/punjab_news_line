'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, RefreshCw, MapPin, Shield, BarChart2,
  Globe, AlertTriangle, CheckCircle2, Users, TrendingUp, Filter, Settings
} from 'lucide-react'

interface Summary {
  advt_code: number
  campaign_name: string
  total_impressions: string
  punjab_impressions: string
  outside_impressions: string
  punjab_pct: string
  first_impression: string | null
  last_impression: string | null
}

interface DailyRow {
  day: string
  advt_code: number
  impressions: string
  punjab_impressions: string
}

interface CityRow {
  city: string
  advt_code: number
  impressions: string
}

interface Totals {
  total_impressions: string
  punjab_impressions: string
  outside_impressions: string
  unique_visitors: string
  unique_punjab_visitors: string
}

interface ReportData {
  summary: Summary[]
  daily: DailyRow[]
  cities: CityRow[]
  totals: Totals
  generated_at: string
  filters: { advtCode: number | null; from: string | null; to: string | null }
}

function fmt(n: string | number | null | undefined): string {
  return Number(n ?? 0).toLocaleString('en-IN')
}

function pct(n: string | null | undefined): string {
  return `${Number(n ?? 0).toFixed(1)}%`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  })
}

function fmtDay(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata'
  })
}

export default function GeoReportPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAd, setSelectedAd] = useState<string>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedAd) params.set('advt_code', selectedAd)
      if (from) params.set('from', from)
      if (to) params.set('to', to + 'T23:59:59')
      const res = await fetch(`/api/admin/geo-report?${params}`)
      if (!res.ok) throw new Error('Failed to load report')
      setData(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [selectedAd, from, to])

  useEffect(() => { fetchReport() }, [fetchReport])

  const downloadCSV = () => {
    if (!data) return
    const headers = ['Campaign', 'Total Impressions', 'Punjab Impressions', 'Outside Punjab', 'Punjab %', 'First Shown', 'Last Shown']
    const rows = data.summary.map(s => [
      s.campaign_name,
      s.total_impressions,
      s.punjab_impressions,
      s.outside_impressions,
      pct(s.punjab_pct),
      fmtDate(s.first_impression),
      fmtDate(s.last_impression),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dipr-geofencing-report-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = data?.totals
  const punjabPct = totals
    ? Math.round(100 * Number(totals.punjab_impressions) / Math.max(Number(totals.total_impressions), 1))
    : 0

  // Get unique daily dates for chart (last 14 days)
  const dailyByDate = data?.daily.reduce<Record<string, { total: number; punjab: number }>>((acc, row) => {
    const d = fmtDay(row.day)
    if (!acc[d]) acc[d] = { total: 0, punjab: 0 }
    acc[d].total += Number(row.impressions)
    acc[d].punjab += Number(row.punjab_impressions)
    return acc
  }, {}) ?? {}
  const chartDays = Object.entries(dailyByDate).slice(0, 14).reverse()
  const maxChartVal = Math.max(...chartDays.map(([, v]) => v.total), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/advertise"
            className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-orange-100 flex items-center justify-center">
                <MapPin className="h-3 w-3 text-orange-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">DIPR Compliance</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Geo-Fencing Report</h2>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Punjab-targeted ad impressions · SEC/SAP/ME/MCC/2026/2287</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/advertise/geo-settings"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-blue-200 text-blue-600 font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm">
            <Settings className="h-4 w-4" />
            Region Settings
          </Link>
          <button onClick={fetchReport} disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={downloadCSV} disabled={!data}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-40 shadow-lg shadow-emerald-200">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-slate-400 mr-2">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Filters</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</label>
            <select value={selectedAd} onChange={e => setSelectedAd(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-brand">
              <option value="">All Campaigns</option>
              {data?.summary.map(s => (
                <option key={s.advt_code} value={String(s.advt_code)}>{s.campaign_name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From Date</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-brand" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">To Date</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-brand" />
          </div>
          {(from || to || selectedAd) && (
            <button onClick={() => { setFrom(''); setTo(''); setSelectedAd('') }}
              className="text-xs font-bold text-rose-500 hover:underline px-3 py-2">Clear</button>
          )}
        </div>
        {data && (
          <p className="text-[10px] text-slate-400 font-medium mt-4">
            Report generated: {fmtDate(data.generated_at)} IST
          </p>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-rose-700 font-bold text-sm">{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Impressions</p>
              <p className="text-3xl font-black text-slate-900">{fmt(totals?.total_impressions)}</p>
            </div>

            <div className="bg-white rounded-[2rem] border border-emerald-200 shadow-sm p-6 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Punjab (In-Fence)</p>
              <p className="text-3xl font-black text-emerald-700">{fmt(totals?.punjab_impressions)}</p>
              <p className="text-xs font-bold text-emerald-500">{punjabPct}% of total</p>
            </div>

            <div className="bg-white rounded-[2rem] border border-orange-200 shadow-sm p-6 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Outside Punjab</p>
              <p className="text-3xl font-black text-orange-700">{fmt(totals?.outside_impressions)}</p>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unique Punjab Visitors</p>
              <p className="text-3xl font-black text-slate-900">{fmt(totals?.unique_punjab_visitors)}</p>
              <p className="text-xs font-medium text-slate-400">of {fmt(totals?.unique_visitors)} total unique</p>
            </div>
          </div>

          {/* Geo Compliance Indicator */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Punjab Geo-Fence Compliance</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Percentage of impressions served within Punjab state boundaries</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                punjabPct >= 70 ? 'bg-emerald-50 text-emerald-600' :
                punjabPct >= 40 ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
              }`}>
                {punjabPct >= 70 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {punjabPct >= 70 ? 'Compliant' : punjabPct >= 40 ? 'Partial' : 'Review Needed'}
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-700 ${
                  punjabPct >= 70 ? 'bg-emerald-500' : punjabPct >= 40 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(punjabPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-bold text-slate-400">0%</span>
              <span className="text-sm font-black text-slate-700">{punjabPct}% Punjab</span>
              <span className="text-xs font-bold text-slate-400">100%</span>
            </div>
          </div>

          {/* Daily Chart */}
          {chartDays.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-5 w-5 text-brand" />
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Daily Impressions</h3>
              </div>
              <div className="flex items-end gap-2 h-40">
                {chartDays.map(([day, v]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex flex-col justify-end gap-0.5 h-32">
                      <div
                        className="w-full bg-emerald-400 rounded-t-sm transition-all"
                        style={{ height: `${(v.punjab / maxChartVal) * 100}%` }}
                        title={`Punjab: ${v.punjab}`}
                      />
                      <div
                        className="w-full bg-slate-200 rounded-none transition-all"
                        style={{ height: `${((v.total - v.punjab) / maxChartVal) * 100}%` }}
                        title={`Outside: ${v.total - v.punjab}`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 -rotate-45 origin-center">{day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-emerald-400" /><span className="text-xs font-bold text-slate-500">Punjab</span></div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-slate-200" /><span className="text-xs font-bold text-slate-500">Outside Punjab</span></div>
              </div>
            </div>
          )}

          {/* Campaign Summary Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Campaign-wise Geo Report</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">For DIPR submission — attach with self-declaration</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    {['Campaign', 'Total', 'Punjab ✓', 'Outside', 'Punjab %', 'Period', 'Status'].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.summary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-bold text-sm">
                        No impressions recorded yet. Make sure ads are displayed with the tracker component.
                      </td>
                    </tr>
                  ) : data.summary.map(s => {
                    const p = Number(s.punjab_pct ?? 0)
                    return (
                      <tr key={s.advt_code} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900 text-sm">{s.campaign_name || `Ad #${s.advt_code}`}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: {s.advt_code}</p>
                        </td>
                        <td className="px-6 py-5 font-black text-slate-700">{fmt(s.total_impressions)}</td>
                        <td className="px-6 py-5 font-black text-emerald-600">{fmt(s.punjab_impressions)}</td>
                        <td className="px-6 py-5 font-bold text-orange-500">{fmt(s.outside_impressions)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${p >= 70 ? 'bg-emerald-500' : p >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                style={{ width: `${Math.min(p, 100)}%` }} />
                            </div>
                            <span className="text-xs font-black text-slate-700">{pct(s.punjab_pct)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[10px] font-bold text-slate-500">{fmtDate(s.first_impression)}</p>
                          <p className="text-[10px] font-bold text-slate-400">to {fmtDate(s.last_impression)}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            p >= 70 ? 'bg-emerald-50 text-emerald-600' :
                            p >= 40 ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-500'
                          }`}>
                            {p >= 70 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {p >= 70 ? 'Compliant' : p >= 40 ? 'Partial' : 'Review'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Punjab City Breakdown */}
          {data.cities.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Punjab City Breakdown</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Impressions from within Punjab geo-fence only</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.cities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                    <span className="text-sm font-bold text-slate-700 truncate">{c.city || 'Unknown'}</span>
                    <span className="text-xs font-black text-emerald-600 ml-2 shrink-0">{fmt(c.impressions)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DIPR Declaration Note */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-amber-200 p-8">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-black text-amber-900 text-sm uppercase tracking-widest">DIPR Submission Note</h4>
                <p className="text-amber-800 text-sm font-medium mt-2 leading-relaxed">
                  This report is generated as per <strong>SEC/SAP/ME/MCC/2026/2287 Dated 12.05.2026</strong>. 
                  Export this data as CSV and attach it along with the self-declaration of non-violation of 
                  Model Code of Conduct. Geo-fencing is based on IP geolocation mapped to Punjab state boundaries 
                  (lat 29.5°–32.6°N, lon 73.8°–76.9°E).
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button onClick={downloadCSV}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all">
                    <Download className="h-3.5 w-3.5" />
                    Download Report for DIPR
                  </button>
                  <span className="text-amber-600 text-xs font-medium">Generated: {fmtDate(data.generated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
