import type { Metadata } from 'next'
import { query } from '@/lib/db'
import type { Poll } from '@/lib/types'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Polls',
  description: 'Vote on the latest polls from Punjab Newsline.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/poll` },
}

export default async function PollIndexPage() {
  let polls: Poll[] = []
  try {
    polls = await query<Poll>(
      `SELECT * FROM ox_poll WHERE active = 2 ORDER BY date DESC LIMIT 20`
    )
  } catch { /* DB not ready */ }
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Polls</h1>
      <ul className="space-y-4">
        {polls.map((p) => (
          <li key={p.poll_code}>
            <a href={`/poll/${p.permalink}`}
               className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h2 className="font-semibold">{p.poll_question}</h2>
              {p.date && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(p.date).toLocaleDateString('pa-IN')}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
