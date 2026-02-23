'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Sparkles, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
import { Story, Scene, ScreeningResult, HookVariant, HookPersonaScore, HookWithScoring } from '@/lib/types'

// ─────────────────────────────────────────────────────────────
// Ring gauge — scroll-stop score (full circle)
// ─────────────────────────────────────────────────────────────
function ScrollStopRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120)
    return () => clearTimeout(t)
  }, [score])

  const r = 28
  const cx = 36
  const cy = 36
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (animated / 100) * circumference
  const color = animated >= 75 ? '#22c55e' : animated >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s' }}
        />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {animated}
        </text>
      </svg>
      <span className="text-xs text-zinc-500">scroll-stop</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Trigger type badge
// ─────────────────────────────────────────────────────────────
function TriggerBadge({ type }: { type: HookVariant['trigger_type'] }) {
  const map = {
    curiosity_gap: { label: 'Curiosité', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' },
    shock_stat: { label: 'Choc', color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)' },
    radical_relatability: { label: 'Identité', color: '#0284c7', bg: 'rgba(2,132,199,0.15)', border: 'rgba(2,132,199,0.3)' },
  }
  const { label, color, bg, border } = map[type]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Mini persona row
// ─────────────────────────────────────────────────────────────
function PersonaRow({ scores }: { scores: HookPersonaScore[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {scores.map((s) => (
        <div
          key={s.persona_name}
          className="flex flex-col items-center gap-0.5"
          title={`${s.persona_name}: ${s.scroll_stop_likelihood}% — ${s.predicted_reaction}`}
        >
          <span className="text-lg leading-none">{s.persona_emoji}</span>
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: s.scroll_stop_likelihood >= 60 ? '#22c55e' : '#ef4444' }}
          />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Phone mockup with hook overlay
// ─────────────────────────────────────────────────────────────
function PhoneMockup({ hookText, slide1ImageUrl }: { hookText: string; slide1ImageUrl: string | null }) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl"
      style={{
        width: '100%',
        maxWidth: '140px',
        aspectRatio: '9/16',
        background: '#0a0a0a',
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      {slide1ImageUrl ? (
        <img
          src={slide1ImageUrl}
          alt="Slide 1"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-[10px] font-semibold leading-tight text-center">{hookText}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Single hook card
// ─────────────────────────────────────────────────────────────
function HookCard({
  hookWithScoring,
  slide1ImageUrl,
  isScoring,
  translateToEnglish,
  onUseHook,
  onUpdateText,
}: {
  hookWithScoring: HookWithScoring
  slide1ImageUrl: string | null
  isScoring: boolean
  translateToEnglish: boolean
  onUseHook: (text: string) => void
  onUpdateText: (text: string) => void
}) {
  const { hook, persona_scores, scroll_stop_score } = hookWithScoring
  const [localText, setLocalText] = useState(hook.variant)
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    setLocalText(hook.variant)
  }, [hook.variant])

  useEffect(() => {
    if (!translateToEnglish || translatedText || translating) return
    setTranslating(true)
    fetch('/api/generate-hooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translate_text: hook.variant }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.translated) setTranslatedText(d.translated) })
      .catch(() => {/* fallback to original */})
      .finally(() => setTranslating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translateToEnglish])

  const displayText =
    translateToEnglish ? (translating ? '...' : (translatedText ?? localText)) : localText

  const scoreColor =
    scroll_stop_score >= 75 ? '#22c55e' : scroll_stop_score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 border"
      style={{
        background: '#1a1a2e',
        borderColor: scroll_stop_score >= 75 ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)',
        boxShadow: scroll_stop_score >= 75 ? '0 0 24px rgba(34,197,94,0.08)' : 'none',
      }}
    >
      {/* Header: badge + ring */}
      <div className="flex items-center justify-between">
        <TriggerBadge type={hook.trigger_type} />
        {isScoring ? (
          <div className="w-12 h-12 rounded-full border-2 border-white/10 animate-pulse" />
        ) : (
          <ScrollStopRing score={scroll_stop_score} />
        )}
      </div>

      {/* Phone mockup */}
      <PhoneMockup hookText={displayText} slide1ImageUrl={slide1ImageUrl} />

      {/* Hook text editor */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">
          Texte du hook <span className="text-zinc-600">({localText.length} car.)</span>
        </label>
        <textarea
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-white/20 transition-colors"
          rows={3}
          value={translateToEnglish ? displayText : localText}
          readOnly={translateToEnglish}
          onChange={(e) => {
            if (translateToEnglish) return
            setLocalText(e.target.value)
            onUpdateText(e.target.value)
          }}
        />
      </div>

      {/* Persona row */}
      {isScoring ? (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Réactions personas</p>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      ) : persona_scores.length > 0 ? (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Réactions personas</p>
          <PersonaRow scores={persona_scores} />
        </div>
      ) : null}

      {/* Confidence */}
      {!isScoring && (
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>Confiance Claude</span>
          <span style={{ color: scoreColor }}>{hook.confidence_score}%</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onUseHook(localText)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: 'rgba(109,90,255,0.15)',
          border: '1px solid rgba(109,90,255,0.35)',
          color: '#a78bfa',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(109,90,255,0.25)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(109,90,255,0.15)' }}
      >
        Utiliser ce hook ✓
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Hook cards grid + controls
// ─────────────────────────────────────────────────────────────
function HookCardsSection({
  hookVariants,
  slide1Image,
  scoring,
  scoringIndex,
  generating,
  translateToEnglish,
  setTranslateToEnglish,
  toneDirective,
  setToneDirective,
  usedHook,
  onGenerate,
  onUseHook,
  onUpdateHookText,
}: {
  hookVariants: HookWithScoring[]
  slide1Image: string | null
  scoring: boolean
  scoringIndex: number | null
  generating: boolean
  translateToEnglish: boolean
  setTranslateToEnglish: (v: boolean) => void
  toneDirective: string
  setToneDirective: (v: string) => void
  usedHook: string | null
  onGenerate: (directive?: string) => void
  onUseHook: (text: string) => void
  onUpdateHookText: (index: number, text: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onGenerate()}
          disabled={generating || scoring}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          Régénérer tout
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
          <button
            type="button"
            className={`w-9 h-5 rounded-full transition-colors flex items-center px-1 ${translateToEnglish ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
            onClick={() => setTranslateToEnglish(!translateToEnglish)}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${translateToEnglish ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
          <Globe className="w-3.5 h-3.5" />
          Traduire en anglais
        </label>
        {usedHook && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hook appliqué au Slide 1
          </div>
        )}
      </div>

      {/* 3-column grid (desktop), stacked (mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hookVariants.map((h, i) => (
          <HookCard
            key={i}
            hookWithScoring={h}
            slide1ImageUrl={slide1Image}
            isScoring={scoring && scoringIndex === i}
            translateToEnglish={translateToEnglish}
            onUseHook={onUseHook}
            onUpdateText={(text) => onUpdateHookText(i, text)}
          />
        ))}
      </div>

      {/* Generate more with tone directive */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="input-dark text-sm flex-1"
          placeholder="Directive de ton : ex. 'plus émouvant', 'essaie l'humour'..."
          value={toneDirective}
          onChange={(e) => setToneDirective(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && toneDirective.trim()) onGenerate(toneDirective)
          }}
        />
        <button
          onClick={() => onGenerate(toneDirective || undefined)}
          disabled={generating || scoring}
          className="btn-secondary flex items-center gap-2 text-sm shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Générer 3 nouvelles variantes
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main HookLab component
// ─────────────────────────────────────────────────────────────
export function HookLab({
  story,
  scenes,
  screeningResult,
  onUseHook,
}: {
  story: Story
  scenes: Scene[]
  screeningResult: ScreeningResult | null
  onUseHook: (hookText: string) => void
}) {
  const [hookVariants, setHookVariants] = useState<HookWithScoring[]>(
    story.hook_variants ?? []
  )
  const [generating, setGenerating] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoringIndex, setScoringIndex] = useState<number | null>(null)
  const [toneDirective, setToneDirective] = useState('')
  const [translateToEnglish, setTranslateToEnglish] = useState(false)
  const [usedHook, setUsedHook] = useState<string | null>(null)

  const scenesWithImages = scenes.filter((s) => s.image_url)
  const slide1Image = scenesWithImages[0]?.image_url ?? null

  async function generateHooks(directive?: string) {
    setGenerating(true)
    setHookVariants([])
    try {
      const res = await fetch('/api/generate-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenes.map((s) => ({ description: s.description, emotional_beat: s.emotional_beat })),
          character_name: story.character_name,
          character_age: story.character_age,
          character_job: story.character_job,
          emotional_tone: story.emotional_tone,
          virality_score: screeningResult?.virality_score,
          tone_directive: directive,
        }),
      })
      const data = await res.json()
      if (data.variants) {
        const withEmptyScoring: HookWithScoring[] = data.variants.map((v: HookVariant) => ({
          hook: v,
          persona_scores: [],
          scroll_stop_score: 0,
        }))
        setHookVariants(withEmptyScoring)
        if (screeningResult) {
          await scoreAllHooks(data.variants as HookVariant[])
        }
      }
    } catch (err) {
      console.error('Generate hooks failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  async function scoreAllHooks(variants: HookVariant[]) {
    setScoring(true)
    for (let i = 0; i < variants.length; i++) {
      setScoringIndex(i)
      try {
        const res = await fetch('/api/screen-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hook_test_mode: true,
            hook_text: variants[i].variant,
            character_name: story.character_name,
            character_job: story.character_job,
            character_age: story.character_age,
            emotional_tone: story.emotional_tone,
            scenes: [],
          }),
        })
        const data = await res.json()
        const scored: HookWithScoring = {
          hook: variants[i],
          persona_scores: data.persona_scores ?? [],
          scroll_stop_score: data.scroll_stop_score ?? 0,
        }
        setHookVariants((prev) => {
          const updated = [...prev]
          updated[i] = scored
          return updated
        })
      } catch {
        // keep the zero score on failure
      }
    }
    setScoringIndex(null)
    setScoring(false)
    // Persist final state
    setHookVariants((final) => {
      saveHookVariants(final)
      return final
    })
  }

  async function saveHookVariants(variants: HookWithScoring[]) {
    try {
      await fetch('/api/update-story-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: story.id, hook_variants: variants }),
      })
    } catch {
      // best-effort persistence
    }
  }

  function handleUseHook(hookText: string) {
    setUsedHook(hookText)
    onUseHook(hookText)
    fetch('/api/update-story-hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: story.id, selected_hook: hookText }),
    }).catch(() => {/* best-effort */})
  }

  function handleUpdateHookText(index: number, newText: string) {
    setHookVariants((prev) =>
      prev.map((h, i) => i === index ? { ...h, hook: { ...h.hook, variant: newText } } : h)
    )
  }

  const sharedGridProps = {
    hookVariants,
    slide1Image,
    scoring,
    scoringIndex,
    generating,
    translateToEnglish,
    setTranslateToEnglish,
    toneDirective,
    setToneDirective,
    usedHook,
    onGenerate: generateHooks,
    onUseHook: handleUseHook,
    onUpdateHookText: handleUpdateHookText,
  }

  // Empty state — screening room not run
  if (!screeningResult) {
    return (
      <div className="space-y-6">
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-4"
          style={{ background: 'rgba(109,90,255,0.08)', border: '1px solid rgba(109,90,255,0.2)' }}
        >
          <AlertCircle className="w-5 h-5 text-[var(--accent)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-zinc-200 font-medium mb-0.5">
              Lance d&rsquo;abord la Salle de Projection
            </p>
            <p className="text-sm text-zinc-500">
              Exécute l&rsquo;Audience Screening Room dans l&rsquo;étape &laquo;&nbsp;Story Arc&nbsp;&raquo; pour débloquer le scoring persona de tes hooks.
            </p>
          </div>
        </div>

        {hookVariants.length === 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => generateHooks()}
              disabled={generating || scenes.length === 0}
              className="btn-secondary flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="spinner" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer les hooks quand même
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {generating && hookVariants.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-5 space-y-4 animate-pulse"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex justify-between">
                  <div className="h-6 w-20 rounded-full bg-white/[0.06]" />
                  <div className="w-12 h-12 rounded-full bg-white/[0.06]" />
                </div>
                <div className="rounded-xl bg-white/[0.04]" style={{ aspectRatio: '9/16', maxWidth: '140px', margin: '0 auto' }} />
                <div className="h-16 rounded-lg bg-white/[0.04]" />
                <div className="h-9 rounded-xl bg-white/[0.04]" />
              </div>
            ))}
          </div>
        )}

        {hookVariants.length > 0 && <HookCardsSection {...sharedGridProps} />}
      </div>
    )
  }

  // Normal state — screening room result available
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>🎣</span>
            Hook Lab
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            3 variantes d&rsquo;accroche testées sur tes personas avant publication
          </p>
        </div>
        {hookVariants.length === 0 && (
          <button
            onClick={() => generateHooks()}
            disabled={generating}
            className="btn-accent flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="spinner" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer les hooks
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {generating && hookVariants.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 space-y-4 animate-pulse"
              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex justify-between">
                <div className="h-6 w-20 rounded-full bg-white/[0.06]" />
                <div className="w-12 h-12 rounded-full bg-white/[0.06]" />
              </div>
              <div className="rounded-xl bg-white/[0.04]" style={{ aspectRatio: '9/16', maxWidth: '140px', margin: '0 auto' }} />
              <div className="h-16 rounded-lg bg-white/[0.04]" />
              <div className="h-9 rounded-xl bg-white/[0.04]" />
            </div>
          ))}
        </div>
      )}

      {/* Hook grid */}
      {hookVariants.length > 0 && <HookCardsSection {...sharedGridProps} />}
    </div>
  )
}
