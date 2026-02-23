'use client'

import { HookWithScoring } from '@/lib/types'
import { Zap } from 'lucide-react'

interface HookSwitcherPanelProps {
  hookVariants: HookWithScoring[]
  activeIndex: number
  onSelect: (index: number) => void
}

const TRIGGER_LABELS: Record<string, string> = {
  curiosity_gap: 'Curiosity Gap',
  shock_stat: 'Shock Stat',
  radical_relatability: 'Relatable',
}

export function HookSwitcherPanel({ hookVariants, activeIndex, onSelect }: HookSwitcherPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Testing Hook</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent-hover)] border border-[var(--accent)]/20">
          Live preview
        </span>
      </div>

      {hookVariants.slice(0, 3).map((hws, i) => {
        const isActive = i === activeIndex
        const score = Math.round(hws.scroll_stop_score)
        const scoreColor = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="w-full text-left transition-all"
            style={{
              background: isActive ? 'rgba(109,90,255,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActive ? 'rgba(109,90,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p
                style={{
                  fontSize: 12,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
                  lineHeight: 1.4,
                  flex: 1,
                  transition: 'color 0.2s',
                }}
              >
                {hws.hook.variant.slice(0, 100)}{hws.hook.variant.length > 100 ? '…' : ''}
              </p>

              <div
                style={{
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: scoreColor,
                  background: `${scoreColor}18`,
                  border: `1px solid ${scoreColor}30`,
                  borderRadius: 8,
                  padding: '2px 7px',
                }}
              >
                {score}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '1px 6px',
                  borderRadius: 6,
                }}
              >
                {TRIGGER_LABELS[hws.hook.trigger_type] ?? hws.hook.trigger_type}
              </span>

              {hws.persona_scores.slice(0, 2).map((ps) => (
                <span key={ps.persona_name} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  {ps.persona_emoji} {Math.round(ps.scroll_stop_likelihood * 100)}%
                </span>
              ))}
            </div>
          </button>
        )
      })}

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 2 }}>
        Click a hook to see it live on slide 1
      </p>
    </div>
  )
}
