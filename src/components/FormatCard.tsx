'use client'

import { LucideIcon } from 'lucide-react'
import { ContentFormatId } from '@/lib/types'

export type FormatCardData = {
  id: ContentFormatId
  name: string
  tagline: string
  best_for: string
  engagement_modifier: string
  Icon: LucideIcon
}

export function FormatCard({
  format,
  selected,
  onClick,
}: {
  format: FormatCardData
  selected: boolean
  onClick: () => void
}) {
  const { Icon } = format
  return (
    <button
      onClick={onClick}
      className={`glass-card p-4 text-left flex flex-col gap-2 transition-all hover:border-amber-400/30 ${
        selected
          ? 'border-amber-400/60 bg-amber-400/[0.05] ring-1 ring-amber-400/40'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            selected ? 'bg-amber-400/20 text-amber-400' : 'bg-white/[0.04] text-zinc-400'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
            selected
              ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {format.engagement_modifier}
        </span>
      </div>

      <div>
        <p className={`text-xs font-semibold leading-tight ${selected ? 'text-amber-300' : 'text-zinc-200'}`}>
          {format.name}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{format.tagline}</p>
      </div>

      <p className="text-[10px] text-zinc-600 border-t border-white/[0.04] pt-2 leading-snug">
        <span className="text-zinc-500 font-medium">Best for: </span>
        {format.best_for}
      </p>
    </button>
  )
}
