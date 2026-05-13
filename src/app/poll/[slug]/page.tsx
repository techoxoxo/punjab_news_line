import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPollByPermalink, getPollXByPermalink, getPollOptions } from '@/lib/queries'
import { LANG_CODE_MAP, PollX } from '@/lib/types'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const poll = await getPollByPermalink(slug)
  const pollX = !poll ? await getPollXByPermalink(slug) : null
  
  const finalPoll = poll || pollX
  if (!finalPoll) return { title: 'Not Found' }
  
  const title = (finalPoll as any).poll_question || (finalPoll as any).pllx_head
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/poll/${finalPoll.permalink}`
  const locale = LANG_CODE_MAP[finalPoll.lang_code ?? 1]
  
  return {
    title: title ?? 'Poll',
    alternates: {
      canonical,
      languages: locale ? { [locale]: canonical } : undefined,
    },
  }
}

export default async function PollPage({ params }: Props) {
  const { slug } = await params
  
  // Try ox_poll first
  const poll = await getPollByPermalink(slug)
  let pollTitle = ''
  let options: { option_text: string | null; votes: number; option_code?: number }[] = []

  if (poll) {
    pollTitle = poll.poll_question || ''
    const rawOptions = await getPollOptions(poll.poll_code)
    options = rawOptions.map(o => ({ option_text: o.option_text, votes: o.votes, option_code: o.option_code }))
  } else {
    // Try ox_pollx
    const pollX = await getPollXByPermalink(slug)
    if (!pollX) notFound()
    
    pollTitle = pollX.pllx_head || ''
    // Map PollX options (poll1-6 and count1-6)
    const p = pollX as PollX
    options = [
      { option_text: p.poll1, votes: p.count1 },
      { option_text: p.poll2, votes: p.count2 },
      { option_text: p.poll3, votes: p.count3 },
      { option_text: p.poll4, votes: p.count4 },
      { option_text: p.poll5, votes: p.count5 },
      { option_text: p.poll6, votes: p.count6 },
    ].filter(o => o.option_text && o.option_text.trim() !== '' && o.option_text !== '-')
  }

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0)

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <nav className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
        <span className="opacity-30">/</span>
        <Link href="/poll" className="hover:text-brand transition-colors">Polls</Link>
      </nav>

      <div className="premium-card p-10 bg-white shadow-2xl shadow-slate-200/50">
        <h1 className="text-3xl font-black leading-tight text-slate-900 mb-10">{pollTitle}</h1>

        <div className="space-y-6">
          {options.map((option, idx) => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
            return (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-700">{option.option_text}</span>
                  <span className="text-xs font-black text-brand bg-brand/5 px-2 py-1 rounded-md">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{option.votes.toLocaleString()} votes</p>
              </div>
            )
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Total Participation: <span className="text-slate-900">{totalVotes.toLocaleString()}</span>
          </p>
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
