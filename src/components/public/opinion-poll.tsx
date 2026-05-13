'use client'

import React from 'react'
import { PollX } from '@/lib/types'
import Link from 'next/link'
import { votePollXAction } from '@/app/actions/poll'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { decodeHtml } from '@/lib/format'

interface OpinionPollProps {
  activePoll: PollX
  pollDisplayOptions: { text: string | null; count: number }[]
}

export function OpinionPoll({ activePoll, pollDisplayOptions }: OpinionPollProps) {
  const [selected, setSelected] = React.useState<number | null>(null)
  const [isVoting, setIsVoting] = React.useState(false)
  const [hasVoted, setHasVoted] = React.useState(false)
  const router = useRouter()

  const handleVote = async () => {
    if (selected === null) {
      toast.error('Please select an option first')
      return
    }

    setIsVoting(true)
    try {
      const result = await votePollXAction(activePoll.pllx_code, selected + 1)
      if (result.success) {
        toast.success('Your vote has been recorded!')
        setHasVoted(true)
        // Revalidate the current page or the poll result page
        router.refresh()
        
        // Optionally redirect to results after a delay
        setTimeout(() => {
          router.push(`/poll/${activePoll.permalink}`)
        }, 1500)
      } else {
        toast.error(result.error || 'Failed to record vote')
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-1 flex-1 bg-brand" />
          <h3 className="font-display text-base font-black uppercase tracking-[0.2em] text-slate-900 shrink-0">Opinion Poll</h3>
          <div className="h-1 flex-1 bg-brand" />
        </div>

        <h4 className="font-display text-2xl font-black leading-tight text-slate-800 mb-8">
          {decodeHtml(activePoll.pllx_head)}
        </h4>

        <div className="space-y-3 mb-10">
          {pollDisplayOptions.map((option, idx) => (
            <div 
              key={idx} 
              onClick={() => !hasVoted && setSelected(idx)}
              className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                selected === idx 
                  ? 'border-brand bg-brand/5 shadow-md' 
                  : 'bg-slate-50 border-slate-100 hover:border-brand/20 hover:bg-white hover:shadow-md'
              } ${hasVoted ? 'opacity-60 cursor-default' : ''}`}
            >
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected === idx ? 'border-brand' : 'border-slate-200 group-hover:border-brand'
              }`}>
                 <div className={`h-2.5 w-2.5 rounded-full bg-brand transition-transform ${
                   selected === idx ? 'scale-100' : 'scale-0 group-hover:scale-50'
                 }`} />
              </div>
              <span className={`text-sm font-bold ${selected === idx ? 'text-brand' : 'text-slate-700'}`}>
                {decodeHtml(option.text)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={handleVote}
            disabled={isVoting || hasVoted || selected === null}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
              isVoting || hasVoted || selected === null
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand text-white hover:bg-brand-deep hover:scale-105 shadow-brand/20'
            }`}
          >
            {isVoting ? 'Voting...' : hasVoted ? 'Voted' : 'Vote'}
          </button>
          <Link href={`/poll/${activePoll.permalink}`} className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-brand flex items-center gap-2 group transition-colors">
            View Result
            <span className="group-hover:translate-x-1 transition-transform">»</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
