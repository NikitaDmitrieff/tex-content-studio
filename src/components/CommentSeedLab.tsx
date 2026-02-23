'use client'

import { useState } from 'react'
import { EmotionalTone, CommentSeed, CommentSeedKit } from '@/lib/types'
import { Sprout, Copy, CheckCircle2, RefreshCw, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'

const ARCHETYPE_LABELS: Record<CommentSeed['archetype'], string> = {
  gentle_skeptic: 'Incrédule Bienveillant',
  personal_echo: 'Echo Personnel',
  soft_provocateur: 'Provocateur Doux',
  curiosity_magnet: 'Curieux Obsédé',
  shock_amplifier: 'Amplificateur de Choc',
}

const CONTROVERSY_COLORS: Record<CommentSeed['controversy_level'], { badge: string; dot: string }> = {
  douce: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  sceptique: {
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  curiosite: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  hot_take: {
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  choc: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
}

const THREAD_SHAPE_ICONS: Record<string, string> = {
  'skeptic battle': '⚔️',
  'personal story flood': '🌊',
  'info request chain': '🔗',
  'inspiration spiral': '🌀',
}

export function CommentSeedLab({
  storyId,
  emotionalTone,
}: {
  storyId: string
  emotionalTone: EmotionalTone
}) {
  const [seedKit, setSeedKit] = useState<CommentSeedKit | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [openAccordion, setOpenAccordion] = useState<number | null>(null)

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-comment-seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId }),
      })
      const data: CommentSeedKit = await res.json()
      setSeedKit(data)
      setOpenAccordion(null)
    } catch (err) {
      console.error('Comment seeds generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            Graines de Commentaires
          </h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            Plant these first to trigger the algorithm
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-accent flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="spinner" />
              <span>Génération...</span>
            </>
          ) : (
            <>
              <Sprout className="w-4 h-4" />
              <span>{seedKit ? 'Régénérer' : 'Générer les graines'}</span>
            </>
          )}
        </button>
      </div>

      {/* Empty state */}
      {!seedKit && !generating && (
        <div className="glass-card p-12 text-center">
          <MessageCircle className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-sm text-zinc-400 mb-1">
            Pré-écris 5 commentaires qui déclenchent l&apos;algorithme
          </p>
          <p className="text-xs text-zinc-600">
            Chaque graine représente un archétype psychologique différent pour maximiser l&apos;engagement
          </p>
          <p className="text-xs text-zinc-700 mt-2">Tone: {emotionalTone.replace(/_/g, ' ')}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {generating && !seedKit && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-24 rounded bg-white/[0.07]" />
                <div className="h-5 w-16 rounded-full bg-white/[0.07]" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-white/[0.07]" />
                <div className="h-3.5 w-4/5 rounded bg-white/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seed cards */}
      {seedKit && (
        <div className="space-y-3">
          {seedKit.seeds.map((seed, i) => {
            const colors = CONTROVERSY_COLORS[seed.controversy_level] ?? CONTROVERSY_COLORS.douce
            const isOpen = openAccordion === i
            const threadIcon = THREAD_SHAPE_ICONS[seed.thread_shape] ?? '💬'

            return (
              <div
                key={i}
                className="glass-card border border-white/[0.06] overflow-hidden"
              >
                {/* Card header */}
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-300">
                        {i + 1}. {ARCHETYPE_LABELS[seed.archetype]}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {seed.controversy_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-zinc-500">
                        {threadIcon} {seed.predicted_replies}
                      </span>
                    </div>
                  </div>

                  {/* Speech bubble */}
                  <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 mb-3">
                    <p className="text-sm text-zinc-200 leading-relaxed">{seed.comment_text}</p>
                    <button
                      onClick={() => copyToClipboard(seed.comment_text, `comment-${i}`)}
                      className="absolute top-2 right-2 text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {copied === `comment-${i}` ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Thread shape tag */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
                      {threadIcon} {seed.thread_shape}
                    </span>

                    {/* Accordion toggle */}
                    <button
                      onClick={() => setOpenAccordion(isOpen ? null : i)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <span>Réponse idéale</span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Accordion content */}
                {isOpen && (
                  <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-zinc-500 mb-1.5 uppercase tracking-wide">
                          Réponse du créateur
                        </p>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {seed.creator_response}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(seed.creator_response, `response-${i}`)}
                        className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-5"
                      >
                        {copied === `response-${i}` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Comment Strategy summary */}
      {seedKit && (
        <div className="glass-card p-5 border border-[var(--accent)]/15">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
            <h4 className="text-sm font-medium text-zinc-200">Comment Strategy</h4>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
            {seedKit.strategy_summary}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Ordre optimal:</span>
            {seedKit.optimal_post_order.map((order, i) => (
              <span
                key={i}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[11px] font-bold text-[var(--accent-hover)]"
              >
                {order}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Régénérer button at bottom */}
      {seedKit && (
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Régénérer</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
