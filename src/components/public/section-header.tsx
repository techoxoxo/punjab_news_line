import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="relative pl-8">
        <div className="absolute left-0 top-0 h-full w-2 rounded-full bg-slate-900/5 overflow-hidden">
           <div className="h-1/2 w-full bg-brand" />
        </div>
        {eyebrow && (
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          {title}
        </h2>
        {description && (
          <p className="mt-5 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500 md:text-xl md:leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </div>
  )
}