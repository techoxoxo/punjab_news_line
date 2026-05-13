import type { Metadata } from 'next'
import { query } from '@/lib/db'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Archive',
  description: 'Browse archived articles on Punjab Newsline.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/archive` },
}

type MonthGroup = { year: number; month: number; count: number }

export default async function ArchivePage() {
  let months: MonthGroup[] = []
  try {
    months = await query<MonthGroup>(
      `SELECT EXTRACT(YEAR FROM date)::int AS year,
              EXTRACT(MONTH FROM date)::int AS month,
              COUNT(*)::int AS count
       FROM ox_article
       WHERE active = 2 AND date IS NOT NULL
       GROUP BY year, month
       ORDER BY year DESC, month DESC
       LIMIT 36`
    )
  } catch {
    // DB not ready
  }

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Archive</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {months.map((m) => (
          <a
            key={`${m.year}-${m.month}`}
            href={`/search?q=${m.year}-${String(m.month).padStart(2,'0')}`}
            className="block border rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">{monthNames[m.month]} {m.year}</span>
            <span className="text-xs text-gray-400 ml-2">({m.count})</span>
          </a>
        ))}
      </div>
    </main>
  )
}
