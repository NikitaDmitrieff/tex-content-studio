'use client'

import { RealityAnchors } from '@/lib/types'

const BADGE_CONFIG = {
  real: {
    emoji: '🟢',
    label: 'Real fact',
    cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  },
  inspired: {
    emoji: '🔵',
    label: 'Inspired by real',
    cls: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  },
  invented: {
    emoji: '⚪',
    label: 'Invented',
    cls: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  },
} as const

export function RealityAnchorCard({ realityAnchors }: { realityAnchors: RealityAnchors }) {
  const { anchors } = realityAnchors

  const realCount = anchors.filter((a) => a.type === 'real').length
  const inspiredCount = anchors.filter((a) => a.type === 'inspired').length
  const inventedCount = anchors.filter((a) => a.type === 'invented').length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Reality Anchors</h3>
        <p className="text-xs text-zinc-500">
          Private reference — shows what came from real data vs what was invented. Not included in
          exports.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>🟢</span>{' '}
          <span>
            {realCount} Real fact{realCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>🔵</span> <span>{inspiredCount} Inspired by real</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>⚪</span>{' '}
          <span>
            {inventedCount} Invented
          </span>
        </div>
      </div>

      {/* Anchor list */}
      <div className="space-y-2">
        {anchors.map((anchor, i) => {
          const anchorType = anchor.type as keyof typeof BADGE_CONFIG
          const config = BADGE_CONFIG[anchorType] ?? BADGE_CONFIG.invented
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border ${config.cls}`}
            >
              <span className="text-base shrink-0 mt-0.5">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed">{anchor.fact}</p>
                {anchor.scene_index != null && (
                  <p className="text-xs opacity-60 mt-0.5">Scene {anchor.scene_index + 1}</p>
                )}
              </div>
              <span className="text-[10px] opacity-60 shrink-0 self-start mt-0.5">
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
