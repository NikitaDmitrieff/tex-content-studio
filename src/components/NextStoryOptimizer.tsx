'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2, Compass, ArrowRight } from 'lucide-react'
import type {
  EmotionalTone,
  CharacterArchetype,
  MatrixCell,
  ProvenFormula,
  HookTriggerType,
} from '@/lib/types'

const EMOTIONAL_TONES: { value: EmotionalTone; label: string }[] = [
  { value: 'comeback', label: 'Comeback' },
  { value: 'revenge', label: 'Revenge' },
  { value: 'quiet_transformation', label: 'Quiet Transformation' },
  { value: 'rock_bottom', label: 'Rock Bottom' },
  { value: 'against_all_odds', label: 'Against All Odds' },
]

const ARCHETYPES: { value: CharacterArchetype; label: string }[] = [
  { value: 'blue_collar_worker', label: 'Blue Collar Worker' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'service_industry', label: 'Service Industry' },
  { value: 'transport', label: 'Transport' },
  { value: 'retired', label: 'Retired' },
  { value: 'parent', label: 'Parent' },
  { value: 'tradesperson', label: 'Tradesperson' },
  { value: 'office_worker', label: 'Office Worker' },
  { value: 'creative', label: 'Creative' },
  { value: 'food_service', label: 'Food Service' },
]

const FORMATS = [
  { value: 'pov_coach', label: 'POV Coach' },
  { value: '30j_defi', label: '30j Défi' },
  { value: 'personne_ne_ma_dit', label: 'Personne ne m\'a dit' },
  { value: 'essaye_30_jours', label: 'Essayé 30 jours' },
  { value: 'avant_que_je_sache', label: 'Avant que je sache' },
  { value: 'coach_dit_toujours', label: 'Coach dit toujours' },
  { value: 'commentaires_pousse', label: 'Commentaires poussé' },
  { value: 'journee_dans_sa_vie', label: 'Journée dans sa vie' },
]

const HOOK_TYPES: { value: HookTriggerType; label: string }[] = [
  { value: 'curiosity_gap', label: 'Curiosity Gap' },
  { value: 'shock_stat', label: 'Shock Stat' },
  { value: 'radical_relatability', label: 'Radical Relatability' },
]

function scoreColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Viral Potential'
  if (score >= 8) return 'High Performer'
  if (score >= 7) return 'Strong'
  if (score >= 6) return 'Above Average'
  if (score >= 5) return 'Average'
  if (score >= 4) return 'Below Average'
  return 'Low Potential'
}

function predictScore(
  tone: EmotionalTone,
  archetype: CharacterArchetype,
  format: string,
  hookType: HookTriggerType,
  matrix: MatrixCell[][]
): number {
  const TONES: EmotionalTone[] = ['comeback', 'revenge', 'quiet_transformation', 'rock_bottom', 'against_all_odds']
  const ARCHS: CharacterArchetype[] = ['blue_collar_worker', 'healthcare', 'service_industry', 'transport', 'retired', 'parent', 'tradesperson', 'office_worker', 'creative', 'food_service']
  const ri = TONES.indexOf(tone)
  const ci = ARCHS.indexOf(archetype)
  const cell = matrix[ri]?.[ci]

  if (cell?.avgScore !== null && cell?.avgScore !== undefined) {
    // Adjust slightly by format and hook type
    let adj = 0
    if (format === '30j_defi') adj += 0.3
    if (hookType === 'shock_stat') adj += 0.2
    if (hookType === 'radical_relatability') adj += 0.1
    return Math.min(10, Math.max(0, cell.avgScore + adj))
  }

  // Interpolate from neighbors
  let neighborSum = 0
  let neighborCount = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = ri + dr
      const nc = ci + dc
      if (nr >= 0 && nr < matrix.length && nc >= 0 && nc < (matrix[0]?.length ?? 0)) {
        const ncell = matrix[nr]?.[nc]
        if (ncell?.avgScore !== null && ncell?.avgScore !== undefined) {
          neighborSum += ncell.avgScore
          neighborCount++
        }
      }
    }
  }
  if (neighborCount > 0) {
    return parseFloat((neighborSum / neighborCount).toFixed(1))
  }
  // Default mid score for completely isolated cells
  return 6.0
}

function generateRationale(
  tone: EmotionalTone,
  archetype: CharacterArchetype,
  score: number,
  matrix: MatrixCell[][]
): string {
  const TONES: EmotionalTone[] = ['comeback', 'revenge', 'quiet_transformation', 'rock_bottom', 'against_all_odds']
  const ARCHS: CharacterArchetype[] = ['blue_collar_worker', 'healthcare', 'service_industry', 'transport', 'retired', 'parent', 'tradesperson', 'office_worker', 'creative', 'food_service']
  const ri = TONES.indexOf(tone)
  const ci = ARCHS.indexOf(archetype)
  const cell = matrix[ri]?.[ci]

  const toneLabel = EMOTIONAL_TONES.find((t) => t.value === tone)?.label ?? tone
  const archLabel = ARCHETYPES.find((a) => a.value === archetype)?.label ?? archetype

  if (cell?.avgScore === null || cell?.avgScore === undefined) {
    return `This ${toneLabel} × ${archLabel} combination is untested — its ${score.toFixed(1)}/10 predicted score is interpolated from neighboring patterns. High unexplored upside.`
  }
  if (score >= 8) {
    return `${toneLabel} resonates strongly with ${archLabel} audiences based on ${cell.storyCount} proven stories. This pattern consistently drives high scroll-stop and share rates.`
  }
  if (score >= 6) {
    return `${toneLabel} × ${archLabel} shows solid performance across ${cell.storyCount} stories. The emotional hook aligns with audience pain points, though there's room to push the narrative tension further.`
  }
  return `This combination has underperformed in testing — ${cell.storyCount} stories averaged only ${cell.avgScore.toFixed(1)}/10. Consider a different emotional angle or archetype for higher virality.`
}

interface NextStoryOptimizerProps {
  matrix: MatrixCell[][]
  initialValues?: Partial<{
    tone: EmotionalTone
    archetype: CharacterArchetype
    format: string
    hookType: HookTriggerType
  }>
}

export function NextStoryOptimizer({ matrix, initialValues }: NextStoryOptimizerProps) {
  const router = useRouter()
  const [tone, setTone] = useState<EmotionalTone>(initialValues?.tone ?? 'comeback')
  const [archetype, setArchetype] = useState<CharacterArchetype>(initialValues?.archetype ?? 'transport')
  const [format, setFormat] = useState(initialValues?.format ?? '30j_defi')
  const [hookType, setHookType] = useState<HookTriggerType>(initialValues?.hookType ?? 'shock_stat')

const score = useMemo(
    () => predictScore(tone, archetype, format, hookType, matrix),
    [tone, archetype, format, hookType, matrix]
  )

  const rationale = useMemo(
    () => generateRationale(tone, archetype, score, matrix),
    [tone, archetype, score, matrix]
  )

  function handleDiscoverBest() {
    // Find highest predicted unexplored combo
    const TONES: EmotionalTone[] = ['comeback', 'revenge', 'quiet_transformation', 'rock_bottom', 'against_all_odds']
    const ARCHS: CharacterArchetype[] = ['blue_collar_worker', 'healthcare', 'service_industry', 'transport', 'retired', 'parent', 'tradesperson', 'office_worker', 'creative', 'food_service']

    let bestScore = -1
    let bestTone: EmotionalTone = tone
    let bestArch: CharacterArchetype = archetype

    TONES.forEach((t, ri) => {
      ARCHS.forEach((a, ci) => {
        const cell = matrix[ri]?.[ci]
        if (cell?.avgScore !== null && cell?.avgScore !== undefined) return // skip tested
        const s = predictScore(t, a, format, hookType, matrix)
        if (s > bestScore) {
          bestScore = s
          bestTone = t
          bestArch = a
        }
      })
    })

    setTone(bestTone)
    setArchetype(bestArch)
  }

  function handleCreate() {
    const params = new URLSearchParams({ tone, archetype, format, hookType })
    router.push(`/story/new?${params.toString()}`)
  }

  const color = scoreColor(score)

  return (
    <div className="flex flex-col gap-5">
      {/* Score badge */}
      <div className="text-center py-5 px-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <style>{`
          @keyframes scorePop {
            0% { transform: scale(0.8); opacity: 0; }
            60% { transform: scale(1.08); }
            100% { transform: scale(1); opacity: 1; }
          }
          .score-pop { animation: scorePop 0.35s ease-out forwards; }
        `}</style>
        <div
          key={`${tone}-${archetype}-${format}-${hookType}`}
          className="score-pop text-6xl font-black mb-1"
          style={{ color }}
        >
          {score.toFixed(1)}
        </div>
        <div className="text-sm font-semibold" style={{ color }}>
          {scoreLabel(score)}
        </div>
        <div className="text-xs text-zinc-600 mt-0.5">predicted virality score</div>
      </div>

      {/* Rationale */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[10px] text-zinc-600 font-mono mb-2">AI RATIONALE</div>
        <p className="text-xs text-zinc-400 leading-relaxed">{rationale}</p>
      </div>

      {/* Dropdowns */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] text-zinc-500 font-mono mb-1.5">EMOTIONAL TONE</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as EmotionalTone)}
            className="input-dark text-sm py-2"
          >
            {EMOTIONAL_TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-zinc-500 font-mono mb-1.5">CHARACTER ARCHETYPE</label>
          <select
            value={archetype}
            onChange={(e) => setArchetype(e.target.value as CharacterArchetype)}
            className="input-dark text-sm py-2"
          >
            {ARCHETYPES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-zinc-500 font-mono mb-1.5">TIKTOK FORMAT</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="input-dark text-sm py-2"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-zinc-500 font-mono mb-1.5">HOOK TYPE</label>
          <select
            value={hookType}
            onChange={(e) => setHookType(e.target.value as HookTriggerType)}
            className="input-dark text-sm py-2"
          >
            {HOOK_TYPES.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={handleDiscoverBest}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-hover)] hover:bg-[var(--accent)]/20 text-sm font-medium transition-colors"
      >
        <Compass className="w-4 h-4" />
        Discover Highest-Scoring Unexplored Combo
      </button>

      <button
        onClick={handleCreate}
        className="w-full flex items-center justify-center gap-2 btn-accent py-3 rounded-xl font-semibold"
      >
        <Wand2 className="w-4 h-4" />
        Create Story With This Formula
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// Export a way to imperatively update from parent
export type { NextStoryOptimizerProps }
export type OptimizerPreset = Pick<ProvenFormula, 'tone' | 'archetype' | 'format' | 'hookType'>
