'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Dna,
  Eye,
  Calendar,
  Lightbulb,
  FlaskConical,
  Clock,
  MessageCircle,
  Users,
  Film,
  RotateCcw,
} from 'lucide-react'
import { Scene, Story, FormatAdaptResult, ContentFormatId } from '@/lib/types'
import { FormatCard, FormatCardData } from './FormatCard'

const FORMATS: FormatCardData[] = [
  {
    id: 'pov_coach',
    name: 'POV: Tu as pris un coach',
    tagline: 'First-person present tense, reader is the protagonist',
    best_for: 'Fitness & self-improvement',
    engagement_modifier: '+23% saves',
    Icon: Eye,
  },
  {
    id: '30_jours_defi',
    name: '30 Jours de Défi',
    tagline: 'Daily log structure — Day 1 / Day 7 / Day 14 / Day 30',
    best_for: 'Challenge-based transformations',
    engagement_modifier: '+31% shares',
    Icon: Calendar,
  },
  {
    id: 'personne_ne_ma_dit',
    name: "Ce que personne ne m\u2019a dit",
    tagline: 'Revelation/listicle — each slide is an unexpected truth',
    best_for: 'Advice & lessons learned',
    engagement_modifier: '+19% comments',
    Icon: Lightbulb,
  },
  {
    id: 'essaye_30_jours',
    name: "J'ai essayé X pendant 30 jours",
    tagline: 'Experiment format, skeptic-to-convert arc',
    best_for: 'Reviews & personal experiments',
    engagement_modifier: '+27% completion',
    Icon: FlaskConical,
  },
  {
    id: 'avant_que_je_sache',
    name: 'Avant que je sache',
    tagline: 'Nostalgic looking-back, narrator has already succeeded',
    best_for: 'Before/after stories',
    engagement_modifier: '+18% saves',
    Icon: Clock,
  },
  {
    id: 'coach_dit_toujours',
    name: 'Mon coach dit toujours',
    tagline: 'Coach-voice authority format, wisdom-dispensing tone',
    best_for: 'Expertise & authority content',
    engagement_modifier: '+22% follows',
    Icon: MessageCircle,
  },
  {
    id: 'commentaires_pousse',
    name: "Les commentaires m'ont poussé",
    tagline: 'Community-driven format, reactive storytelling',
    best_for: 'High-engagement sequel content',
    engagement_modifier: '+35% comments',
    Icon: Users,
  },
  {
    id: 'journee_dans_sa_vie',
    name: 'Une journée dans sa vie',
    tagline: 'Day-in-life slice, cinematic vignette style',
    best_for: 'Lifestyle & routine content',
    engagement_modifier: '+24% saves',
    Icon: Film,
  },
]

function FormatFitBadge({ score, note }: { score: number; note: string }) {
  const colorClass =
    score >= 80
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : score >= 60
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30'

  return (
    <div className={`inline-flex items-start gap-3 px-3 py-2 rounded-xl border ${colorClass}`}>
      <div className="text-left">
        <div className="text-sm font-bold">Format Fit Score: {score}/100</div>
        <div className="text-xs opacity-80 mt-0.5">{note}</div>
      </div>
    </div>
  )
}

export function FormatAdapterPanel({
  story,
  scenes,
  onScenesUpdate,
}: {
  story: Story
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFormatId, setSelectedFormatId] = useState<ContentFormatId | null>(null)
  const [loading, setLoading] = useState(false)
  const [adaptResult, setAdaptResult] = useState<FormatAdaptResult | null>(null)
  const [originalScenes, setOriginalScenes] = useState<Scene[] | null>(null)
  const [flashingScenes, setFlashingScenes] = useState<Set<number>>(new Set())

  const selectedFormat = FORMATS.find((f) => f.id === selectedFormatId) ?? null

  async function handleAdapt() {
    if (!selectedFormat) return
    setLoading(true)
    setOriginalScenes(scenes)
    try {
      const res = await fetch('/api/adapt-story-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          scenes,
          format_id: selectedFormat.id,
          format_name: selectedFormat.name,
        }),
      })
      if (!res.ok) throw new Error(`Adapt failed: ${res.status}`)
      const data: FormatAdaptResult = await res.json()
      setAdaptResult(data)

      // Flash changed scenes
      const changed = new Set<number>()
      data.adapted_scenes.forEach((s, i) => {
        if (
          s.description !== scenes[i]?.description ||
          s.caption !== scenes[i]?.caption
        ) {
          changed.add(i)
        }
      })
      setFlashingScenes(changed)
      onScenesUpdate(data.adapted_scenes)
      setTimeout(() => setFlashingScenes(new Set()), 1200)
    } catch (err) {
      console.error('Format adaptation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleRevert() {
    if (!originalScenes) return
    onScenesUpdate(originalScenes)
    setAdaptResult(null)
    setOriginalScenes(null)
    setSelectedFormatId(null)
    setFlashingScenes(new Set())
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header / trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Dna className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <span className="text-sm font-semibold text-white">Format DNA Adapter</span>
            {adaptResult && selectedFormat && (
              <span className="ml-2 text-xs text-zinc-400">
                {selectedFormat.name} · Fit {adaptResult.format_fit_score}/100
              </span>
            )}
          </div>
          {!adaptResult && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
              8 formats
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Panel content */}
      {isOpen && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {/* Format grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FORMATS.map((format) => (
              <FormatCard
                key={format.id}
                format={format}
                selected={selectedFormatId === format.id}
                onClick={() => {
                  setSelectedFormatId(format.id)
                  // Clear previous adapt result when selecting a new format
                  if (adaptResult && originalScenes) {
                    onScenesUpdate(originalScenes)
                    setAdaptResult(null)
                    setOriginalScenes(null)
                  }
                }}
              />
            ))}
          </div>

          {/* Flash indicator for scene updates */}
          {flashingScenes.size > 0 && (
            <p className="text-xs text-amber-400 animate-pulse">
              ✦ {flashingScenes.size} scene{flashingScenes.size !== 1 ? 's' : ''} reformatted
            </p>
          )}

          {/* Format fit badge */}
          {adaptResult && (
            <FormatFitBadge
              score={adaptResult.format_fit_score}
              note={adaptResult.format_note}
            />
          )}

          {/* Action row */}
          <div className="flex items-center gap-3 flex-wrap">
            {selectedFormatId && !adaptResult && (
              <button
                onClick={handleAdapt}
                disabled={loading || scenes.length === 0}
                className="btn-accent flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    <span>Reformatage de l&apos;arc narratif...</span>
                  </>
                ) : (
                  <span>Adapter ce format</span>
                )}
              </button>
            )}

            {adaptResult && originalScenes && (
              <button
                onClick={handleRevert}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Annuler le format
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
