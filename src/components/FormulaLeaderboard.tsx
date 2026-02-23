'use client'

import { useRouter } from 'next/navigation'
import { Trophy, ArrowRight } from 'lucide-react'
import type { ProvenFormula, EmotionalTone, CharacterArchetype } from '@/lib/types'

const TONE_COLORS: Record<EmotionalTone, string> = {
  comeback: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  revenge: 'bg-red-500/20 text-red-300 border-red-500/30',
  quiet_transformation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  rock_bottom: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  against_all_odds: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const TONE_LABELS: Record<EmotionalTone, string> = {
  comeback: 'Comeback',
  revenge: 'Revenge',
  quiet_transformation: 'Quiet Transform',
  rock_bottom: 'Rock Bottom',
  against_all_odds: 'Against All Odds',
}

const ARCHETYPE_LABELS: Record<CharacterArchetype, string> = {
  blue_collar_worker: 'Blue Collar',
  healthcare: 'Healthcare',
  service_industry: 'Service Industry',
  transport: 'Transport',
  retired: 'Retired',
  parent: 'Parent',
  tradesperson: 'Tradesperson',
  office_worker: 'Office Worker',
  creative: 'Creative',
  food_service: 'Food Service',
}

const RANK_COLORS = [
  'bg-yellow-500 text-black',
  'bg-zinc-400 text-black',
  'bg-amber-700 text-white',
  'bg-zinc-700 text-white',
  'bg-zinc-800 text-white',
]

function scoreToGradient(score: number): string {
  if (score >= 8.5) return 'from-orange-500 to-amber-400'
  if (score >= 7) return 'from-amber-500 to-yellow-400'
  if (score >= 5) return 'from-blue-500 to-cyan-400'
  return 'from-zinc-600 to-zinc-500'
}

interface FormulaLeaderboardProps {
  formulas: ProvenFormula[]
  onSelectFormula?: (formula: ProvenFormula) => void
}

export function FormulaLeaderboard({ formulas, onSelectFormula }: FormulaLeaderboardProps) {
  const router = useRouter()

  function handleUseFormula(formula: ProvenFormula) {
    // Pre-fill configurator via callback
    onSelectFormula?.(formula)

    // Deep-link to story new with query params
    const params = new URLSearchParams({
      tone: formula.tone,
      archetype: formula.archetype,
      format: formula.format,
      hookType: formula.hookType,
    })
    router.push(`/story/new?${params.toString()}`)
  }

  if (formulas.length === 0) {
    return (
      <div className="text-center py-10">
        <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">No proven formulas yet. Generate more stories to unlock rankings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {formulas.map((formula, i) => (
        <div
          key={formula.rank}
          className="glass-card p-4 flex items-center gap-4 hover:border-white/[0.14] transition-all"
        >
          {/* Rank badge */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_COLORS[i] ?? 'bg-zinc-800 text-white'}`}
          >
            #{formula.rank}
          </div>

          {/* Formula info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`status-badge ${TONE_COLORS[formula.tone]}`}
              >
                {TONE_LABELS[formula.tone]}
              </span>
              <span className="text-zinc-300 text-sm font-medium">
                × {ARCHETYPE_LABELS[formula.archetype]}
              </span>
              <span className="text-xs text-zinc-500 font-mono">{formula.format}</span>
            </div>
            <p className="text-xs text-zinc-500 truncate">{formula.rationale}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{formula.storyCount} {formula.storyCount === 1 ? 'story' : 'stories'} tested</p>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <div
              className={`text-2xl font-black bg-gradient-to-r ${scoreToGradient(formula.compositeScore)} bg-clip-text text-transparent`}
            >
              {formula.compositeScore.toFixed(1)}
            </div>
            <div className="text-[10px] text-zinc-600 font-mono">/ 10 avg</div>
          </div>

          {/* CTA */}
          <button
            onClick={() => handleUseFormula(formula)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
          >
            Use Formula
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
