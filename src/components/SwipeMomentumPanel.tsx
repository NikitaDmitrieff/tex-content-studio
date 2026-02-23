'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, RefreshCw } from 'lucide-react'
import { Scene, SwipeMomentumResult, SlideSwipeScore } from '@/lib/types'
import { SlideScoreCard } from './SlideScoreCard'
import { SlideDetailDrawer } from './SlideDetailDrawer'

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const colors: Record<string, string> = {
    A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    C: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    D: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    F: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const cls = colors[grade] ?? colors.C
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cls}`}>
      <span className="text-2xl font-black">{grade}</span>
      <div className="text-left">
        <div className="text-xs font-bold">{score}/100</div>
        <div className="text-[10px] opacity-70">Carousel Score</div>
      </div>
    </div>
  )
}

function MomentumArc({ scores }: { scores: SlideSwipeScore[] }) {
  if (scores.length === 0) return null
  const width = 600
  const height = 60
  const padding = 24
  const plotWidth = width - padding * 2
  const plotHeight = height - 12

  const points = scores.map((s, i) => {
    const x = padding + (i / Math.max(scores.length - 1, 1)) * plotWidth
    const y = 6 + (1 - s.swipe_probability) * plotHeight
    return { x, y, prob: s.swipe_probability }
  })

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')

  function dotColor(prob: number) {
    if (prob >= 0.75) return '#34d399'
    if (prob >= 0.5) return '#fbbf24'
    return '#f87171'
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height: height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="arc-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="url(#arc-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={dotColor(p.prob)} opacity="0.8" />
      ))}
    </svg>
  )
}

export function SwipeMomentumPanel({
  scenes,
  storyId,
  onScenesUpdate,
  initialResult,
  onResultChange,
}: {
  scenes: Scene[]
  storyId: string
  onScenesUpdate: (scenes: Scene[]) => void
  initialResult?: SwipeMomentumResult | null
  onResultChange?: (result: SwipeMomentumResult | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResultState] = useState<SwipeMomentumResult | null>(initialResult ?? null)
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null)
  const [fixedSlides, setFixedSlides] = useState<Set<number>>(new Set())
  const [autoFixLoading, setAutoFixLoading] = useState(false)
  const [autoFixToast, setAutoFixToast] = useState<string | null>(null)
  const [autoFixProgress, setAutoFixProgress] = useState<number[]>([])

  function setResult(r: SwipeMomentumResult | null) {
    setResultState(r)
    onResultChange?.(r)
  }

  async function runAnalysis() {
    setLoading(true)
    setIsOpen(true)
    try {
      const res = await fetch('/api/analyze-swipe-momentum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: storyId,
          character: { name: '', job: '' },
          scenes: scenes.map((s) => ({
            description: s.description,
            caption: s.caption,
          })),
        }),
      })
      const data: SwipeMomentumResult = await res.json()
      setResult(data)
      setFixedSlides(new Set())
    } catch (err) {
      console.error('Swipe analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleApplyFix(slideIndex: number, rewrittenCaption: string) {
    const updated = scenes.map((s, i) =>
      i === slideIndex ? { ...s, caption: rewrittenCaption } : s
    )
    onScenesUpdate(updated)
    setFixedSlides((prev) => new Set([...prev, slideIndex]))
    setSelectedSlide(null)
  }

  function handleIgnore(slideIndex: number) {
    setFixedSlides((prev) => new Set([...prev, slideIndex]))
    setSelectedSlide(null)
  }

  async function handleAutoFixAll() {
    if (!result) return
    setAutoFixLoading(true)
    setAutoFixProgress([])

    const weakSlides = result.slide_scores.filter(
      (s) => s.swipe_probability < 0.75 && !fixedSlides.has(s.slide_index)
    )

    for (let i = 0; i < weakSlides.length; i++) {
      await new Promise((r) => setTimeout(r, 300))
      const slideScore = weakSlides[i]
      setAutoFixProgress((prev) => [...prev, slideScore.slide_index])
    }

    let updatedScenes = [...scenes]
    const newFixed = new Set(fixedSlides)
    for (const slideScore of weakSlides) {
      updatedScenes = updatedScenes.map((s, i) =>
        i === slideScore.slide_index ? { ...s, caption: slideScore.rewritten_caption } : s
      )
      newFixed.add(slideScore.slide_index)
    }
    onScenesUpdate(updatedScenes)
    setFixedSlides(newFixed)

    try {
      const res = await fetch('/api/analyze-swipe-momentum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: storyId,
          character: { name: '', job: '' },
          scenes: updatedScenes.map((s) => ({
            description: s.description,
            caption: s.caption,
          })),
        }),
      })
      const newResult: SwipeMomentumResult = await res.json()
      const prevGrade = result.grade
      setResult(newResult)
      setAutoFixToast(
        `Momentum fixed — ${weakSlides.length} slide${weakSlides.length !== 1 ? 's' : ''} rewritten. Carousel score: ${prevGrade} → ${newResult.grade}`
      )
      setTimeout(() => setAutoFixToast(null), 5000)
    } catch {
      setAutoFixToast(`${weakSlides.length} slides rewritten.`)
      setTimeout(() => setAutoFixToast(null), 3000)
    }

    setAutoFixProgress([])
    setAutoFixLoading(false)
  }

  const selectedScore = result?.slide_scores.find((s) => s.slide_index === selectedSlide) ?? null
  const selectedScene = selectedSlide !== null ? scenes[selectedSlide] : null

  return (
    <div className="glass-card overflow-hidden">
      {/* Header / trigger */}
      <button
        onClick={() => {
          if (!result && !loading) {
            runAnalysis()
          } else {
            setIsOpen((v) => !v)
          }
        }}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-[var(--accent)]" />
          <div className="text-left">
            <span className="text-sm font-semibold text-white">Swipe Momentum Analyzer</span>
            {result && (
              <span className="ml-2 text-xs text-zinc-400">
                Score: {result.overall_score}/100 · Grade {result.grade}
              </span>
            )}
          </div>
          {!result && !loading && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
              Run Analysis
            </span>
          )}
        </div>
        {loading ? (
          <div className="spinner w-4 h-4" />
        ) : isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Panel content */}
      {isOpen && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {loading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="spinner" />
              <span className="text-sm text-zinc-400">Analyzing swipe momentum…</span>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <GradeBadge grade={result.grade} score={result.overall_score} />

                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{result.completion_rate_estimate}</p>
                  <p className="text-[10px] text-zinc-500">Algorithm completion rate estimate</p>
                </div>

                <button
                  onClick={handleAutoFixAll}
                  disabled={autoFixLoading}
                  className="btn-accent flex items-center gap-2 text-sm"
                >
                  {autoFixLoading ? (
                    <>
                      <div className="spinner w-4 h-4" />
                      Fixing…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Auto-Fix All Weak Slides
                    </>
                  )}
                </button>
              </div>

              {/* Momentum arc */}
              <div className="pt-2">
                <MomentumArc scores={result.slide_scores} />
              </div>

              {/* Heatmap row */}
              <div className="flex gap-3 overflow-x-auto pb-2 pt-6">
                {result.slide_scores.map((score) => (
                  <SlideScoreCard
                    key={score.slide_index}
                    score={score}
                    scene={scenes[score.slide_index] ?? {
                      id: '',
                      story_id: '',
                      order_index: score.slide_index,
                      description: '',
                      emotional_beat: '',
                      visual_prompt: '',
                      image_url: null,
                      caption: null,
                      created_at: '',
                    }}
                    isDropOff={score.slide_index === result.drop_off_slide}
                    isFixed={fixedSlides.has(score.slide_index) || autoFixProgress.includes(score.slide_index)}
                    onClick={() => setSelectedSlide(score.slide_index)}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[10px] text-zinc-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  ≥75% swipe-through
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  50–74% building
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  &lt;50% drop risk
                </span>
                <span className="flex items-center gap-1 text-red-400">🔥 Predicted drop-off slide</span>
              </div>

              {/* Re-analyze button */}
              <button
                onClick={runAnalysis}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Re-analyze
              </button>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {autoFixToast && (
        <div className="fixed bottom-6 right-6 z-50 glass-card px-4 py-3 text-sm text-emerald-400 border-emerald-500/30 shadow-lg">
          ✓ {autoFixToast}
        </div>
      )}

      {/* Detail drawer */}
      {selectedScore && selectedScene && (
        <SlideDetailDrawer
          score={selectedScore}
          scene={selectedScene}
          onApplyFix={(caption) => handleApplyFix(selectedScore.slide_index, caption)}
          onIgnore={() => handleIgnore(selectedScore.slide_index)}
          onClose={() => setSelectedSlide(null)}
        />
      )}
    </div>
  )
}
