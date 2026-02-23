'use client'

import { Flame } from 'lucide-react'
import { SlideSwipeScore, Scene } from '@/lib/types'

function getCardColor(prob: number): { bg: string; border: string; text: string; dot: string } {
  if (prob >= 0.75)
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' }
  if (prob >= 0.5)
    return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' }
  return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' }
}

const MOMENTUM_LABELS: Record<string, string> = {
  strong: 'Strong',
  building: 'Building',
  flat: 'Flat',
  drop: 'Drop',
}

export function SlideScoreCard({
  score,
  scene,
  isDropOff,
  isFixed,
  onClick,
}: {
  score: SlideSwipeScore
  scene: Scene
  isDropOff: boolean
  isFixed: boolean
  onClick: () => void
}) {
  const colors = getCardColor(isFixed ? 0.85 : score.swipe_probability)
  const displayProb = isFixed ? 0.85 : score.swipe_probability

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Drop-off flame */}
      {isDropOff && !isFixed && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Flame className="w-4 h-4 text-red-400 animate-pulse" />
        </div>
      )}

      {/* Card */}
      <button
        onClick={onClick}
        className={`relative w-16 h-20 rounded-xl border ${colors.bg} ${colors.border} flex flex-col items-center justify-between p-2 cursor-pointer hover:opacity-80 transition-opacity group`}
        title={`Swipe: ${Math.round(displayProb * 100)}% — ${score.momentum_type}${!isFixed ? `\n${score.weakness}` : '\nFixed!'}`}
      >
        {/* Slide number */}
        <span className={`text-xs font-bold ${colors.text}`}>{score.slide_index + 1}</span>

        {/* Probability */}
        <span className={`text-[11px] font-semibold ${colors.text}`}>
          {Math.round(displayProb * 100)}%
        </span>

        {/* Momentum badge */}
        <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
          {MOMENTUM_LABELS[score.momentum_type] ?? score.momentum_type}
        </span>

        {/* Fixed indicator */}
        {isFixed && (
          <div className="absolute inset-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <span className="text-emerald-400 text-[10px] font-bold">Fixed</span>
          </div>
        )}
      </button>

      {/* Color dot */}
      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />

      {/* Caption preview */}
      <p className="text-[9px] text-zinc-500 max-w-[64px] text-center truncate">
        {scene.description.slice(0, 20)}…
      </p>
    </div>
  )
}
