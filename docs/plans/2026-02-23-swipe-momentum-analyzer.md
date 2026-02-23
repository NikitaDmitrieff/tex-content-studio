# Swipe Momentum Analyzer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a per-slide swipe drop-off predictor with AI-powered fixes, inserted between Story Arc generation and image generation.

**Architecture:** New API route calls Claude to score each scene's swipe probability. A collapsible panel in StoryArcStep renders a heatmap of colored slide cards with a momentum arc line. A right-side drawer lets users apply or ignore AI-generated caption fixes. SwipeScore state is threaded from StoryArcStep → StoryWorkspace → ImageGenerationStep for the pre-image gate warning.

**Tech Stack:** Next.js 16, React 19, TypeScript, Anthropic SDK (claude-sonnet-4-20250514), Tailwind CSS, Lucide icons, Supabase (tex_content schema for column migration).

---

### Task 1: Add SwipeScore Types to types.ts

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add types at end of file**

```typescript
// ── Swipe Momentum Analyzer ──────────────────────────────────────────────────

export type MomentumType = 'strong' | 'building' | 'flat' | 'drop'

export type SlideSwipeScore = {
  slide_index: number
  swipe_probability: number       // 0-1
  momentum_type: MomentumType
  weakness: string
  fix_suggestion: string
  rewritten_caption: string
}

export type SwipeMomentumResult = {
  slide_scores: SlideSwipeScore[]
  overall_score: number           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  drop_off_slide: number
  completion_rate_estimate: string
  critical_fixes: number[]
  strong_slides: number[]
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add SwipeMomentumResult types"
```

---

### Task 2: Create API Route `/api/analyze-swipe-momentum`

**Files:**
- Create: `src/app/api/analyze-swipe-momentum/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SlideSwipeScore, SwipeMomentumResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    story_id: string
    character: { name: string; job: string }
    scenes: { description: string; caption: string | null }[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scenes } = body

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'Missing or empty scenes array' }, { status: 400 })
  }

  // ── DEMO / FALLBACK ────────────────────────────────────────────────────────
  if (!apiKey) {
    const demoScores: SlideSwipeScore[] = scenes.map((s, i) => {
      // Purposely weak slides 3 and 6 (0-indexed: 2 and 5)
      const isWeak = i === 2 || i === 5
      const prob = isWeak ? (i === 2 ? 0.38 : 0.44) : 0.65 + Math.random() * 0.25
      const type = prob >= 0.75 ? 'strong' : prob >= 0.5 ? 'building' : (prob >= 0.38 ? 'flat' : 'drop')
      return {
        slide_index: i,
        swipe_probability: Math.round(prob * 100) / 100,
        momentum_type: type as SlideSwipeScore['momentum_type'],
        weakness: isWeak
          ? i === 2
            ? "Répète l'information de la diapositive précédente — aucune nouvelle tension créée"
            : "Pic émotionnel trop tôt — la tension se dissipe avant le climax"
          : "Bon rythme narratif",
        fix_suggestion: isWeak
          ? "Terminer par une question ouverte ou une révélation partielle. Ex: 'Ce qu'elle ne savait pas encore, c'est que son médecin allait lui dire quelque chose qui changerait tout.'"
          : "Aucune correction nécessaire",
        rewritten_caption: isWeak
          ? `${s.caption ?? s.description} — mais ce soir-là, elle ne savait pas encore ce qui l'attendait.`
          : (s.caption ?? s.description),
      }
    })

    const criticalFixes = demoScores
      .filter((s) => s.swipe_probability < 0.5)
      .map((s) => s.slide_index)
    const strongSlides = demoScores
      .filter((s) => s.swipe_probability >= 0.75)
      .map((s) => s.slide_index)
    const overallScore = 71
    const dropOff = demoScores.reduce((min, s) =>
      s.swipe_probability < demoScores[min].swipe_probability ? s.slide_index : min, 0)

    const result: SwipeMomentumResult = {
      slide_scores: demoScores,
      overall_score: overallScore,
      grade: 'B',
      drop_off_slide: dropOff,
      completion_rate_estimate: '~58% of viewers reach the last slide',
      critical_fixes: criticalFixes,
      strong_slides: strongSlides,
    }
    return NextResponse.json(result)
  }

  // ── CLAUDE ANALYSIS ────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey })

    const slidesText = scenes
      .map((s, i) => `Slide ${i + 1}:\nDescription: ${s.description}\nCaption: ${s.caption ?? '(no caption yet)'}`)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a TikTok/Instagram carousel optimization expert. Analyze each slide for swipe-through momentum.

For each slide score:
- **tension_hook**: Does the caption end with open question, unresolved tension, or forward-pulling statement? (0-1)
- **new_information**: Does this slide add something genuinely new vs restating the previous slide? (0-1)
- **emotional_velocity**: Is the emotional arc building toward climax at slides 5-7? (0-1)
- **caption_density_risk**: More than 35 words is a risk — penalize (0-1, 1 = no risk)
- **transition_quality**: Does the previous slide's ending make you NEED to see this slide? (0-1)

Compute swipe_probability as weighted average: tension_hook*0.30 + new_information*0.25 + emotional_velocity*0.20 + caption_density_risk*0.10 + transition_quality*0.15

momentum_type must be one of: "strong" (≥0.75), "building" (0.50-0.74), "flat" (0.35-0.49), "drop" (<0.35)

Write weakness and fix_suggestion in French (the audience is French-speaking).
Write rewritten_caption as a full improved caption in French with a cliffhanger hook.

Slides to analyze:
${slidesText}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "slide_scores": [
    {
      "slide_index": 0,
      "swipe_probability": 0.82,
      "momentum_type": "strong",
      "weakness": "...",
      "fix_suggestion": "...",
      "rewritten_caption": "..."
    }
  ],
  "overall_score": 71,
  "grade": "B",
  "drop_off_slide": 2,
  "completion_rate_estimate": "~58% of viewers reach the last slide",
  "critical_fixes": [2, 5],
  "strong_slides": [0, 1, 6, 7]
}

grade must be: "A" (90-100), "B" (75-89), "C" (60-74), "D" (45-59), "F" (<45)`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result: SwipeMomentumResult = JSON.parse(cleanedText)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Swipe momentum analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze swipe momentum', details: String(err) },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify build**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/api/analyze-swipe-momentum/route.ts
git commit -m "feat: add analyze-swipe-momentum API route with Claude + demo fallback"
```

---

### Task 3: Create SlideScoreCard Component

**Files:**
- Create: `src/components/SlideScoreCard.tsx`

**Step 1: Write the component**

```typescript
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
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/SlideScoreCard.tsx
git commit -m "feat: add SlideScoreCard with color-coded swipe probability"
```

---

### Task 4: Create SlideDetailDrawer Component

**Files:**
- Create: `src/components/SlideDetailDrawer.tsx`

**Step 1: Write the component**

```typescript
'use client'

import { useState } from 'react'
import { X, Wand2, CheckCircle2 } from 'lucide-react'
import { SlideSwipeScore, Scene } from '@/lib/types'

export function SlideDetailDrawer({
  score,
  scene,
  onApplyFix,
  onIgnore,
  onClose,
}: {
  score: SlideSwipeScore
  scene: Scene
  onApplyFix: (rewrittenCaption: string) => void
  onIgnore: () => void
  onClose: () => void
}) {
  const [applying, setApplying] = useState(false)

  async function handleApplyFix() {
    setApplying(true)
    // Small animation delay for UX
    await new Promise((r) => setTimeout(r, 400))
    onApplyFix(score.rewritten_caption)
    setApplying(false)
  }

  const prob = score.swipe_probability
  const probColor = prob >= 0.75 ? 'text-emerald-400' : prob >= 0.5 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/[0.08] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="font-semibold text-white">Slide {score.slide_index + 1} Analysis</h3>
            <span className={`text-sm font-bold ${probColor}`}>
              {Math.round(prob * 100)}% swipe probability
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Current caption */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Current Caption</p>
            <div className="glass-card p-3">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {scene.caption ?? scene.description}
              </p>
            </div>
          </div>

          {/* Weakness */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Weakness Detected</p>
            <div className="glass-card p-3 border-red-500/20">
              <p className="text-sm text-zinc-300 leading-relaxed">{score.weakness}</p>
            </div>
          </div>

          {/* Fix suggestion */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Fix Suggestion</p>
            <div className="glass-card p-3 border-amber-500/20">
              <p className="text-sm text-zinc-300 leading-relaxed">{score.fix_suggestion}</p>
            </div>
          </div>

          {/* Rewritten caption */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Rewritten Caption</p>
            <div className="glass-card p-3 border-emerald-500/20">
              <p className="text-sm text-zinc-300 leading-relaxed italic">{score.rewritten_caption}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button
            onClick={onIgnore}
            className="btn-secondary flex-1"
          >
            Ignore
          </button>
          <button
            onClick={handleApplyFix}
            disabled={applying}
            className="btn-accent flex-1 flex items-center justify-center gap-2"
          >
            {applying ? (
              <>
                <div className="spinner w-4 h-4" />
                Applying…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Apply Fix
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/SlideDetailDrawer.tsx
git commit -m "feat: add SlideDetailDrawer with apply/ignore actions"
```

---

### Task 5: Create SwipeMomentumPanel Component

**Files:**
- Create: `src/components/SwipeMomentumPanel.tsx`

This is the main panel with: summary bar (grade + score + completion rate + Auto-Fix All button), momentum arc SVG line, heatmap row of SlideScoreCards, and SlideDetailDrawer.

**Step 1: Write the component**

```typescript
'use client'

import { useState, useRef } from 'react'
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

  // Gradient: green → yellow → red based on probability
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

    // Animate slide-by-slide
    for (let i = 0; i < weakSlides.length; i++) {
      await new Promise((r) => setTimeout(r, 300))
      const slideScore = weakSlides[i]
      setAutoFixProgress((prev) => [...prev, slideScore.slide_index])
    }

    // Apply all fixes
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

    // Re-run analysis to show improved score
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
              <div className="flex gap-3 overflow-x-auto pb-2 pt-2">
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
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ≥75% swipe-through</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 50–74% building</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;50% drop risk</span>
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
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/SwipeMomentumPanel.tsx
git commit -m "feat: add SwipeMomentumPanel with heatmap, arc, auto-fix, and drawer"
```

---

### Task 6: Integrate SwipeMomentumPanel into StoryArcStep

**Files:**
- Modify: `src/components/StoryArcStep.tsx`
- Modify: `src/components/StoryWorkspace.tsx`

**Step 1: Update StoryArcStep props + state + render**

1. Add import at top of `StoryArcStep.tsx`:
   ```typescript
   import { SwipeMomentumPanel } from './SwipeMomentumPanel'
   import { SwipeMomentumResult } from '@/lib/types'
   ```

2. Add `onSwipeAnalysisComplete` to props:
   ```typescript
   onSwipeAnalysisComplete?: (result: SwipeMomentumResult | null) => void
   ```

3. Add `swipeMomentumResult` state after existing state declarations:
   ```typescript
   const [swipeMomentumResult, setSwipeMomentumResult] = useState<SwipeMomentumResult | null>(null)
   ```

4. Add SwipeMomentumPanel after the "Add Scene" button and before AuthenticityScanner in the scenes.length > 0 branch. Place it just after the `{/* Add scene button */}` block:
   ```tsx
   {/* Swipe Momentum Analyzer */}
   <SwipeMomentumPanel
     scenes={scenes}
     storyId={story.id}
     onScenesUpdate={onScenesUpdate}
     initialResult={swipeMomentumResult}
     onResultChange={(r) => {
       setSwipeMomentumResult(r)
       onSwipeAnalysisComplete?.(r)
     }}
   />
   ```

5. Update the "Continue to Images" button to show a warning if score < 70:
   - Replace the `<button onClick={onContinue}...>` block at the bottom navigation section:
   ```tsx
   <div className="relative">
     <button
       onClick={onContinue}
       disabled={scenes.length === 0}
       className="btn-accent flex items-center gap-2"
     >
       {screeningResult && (
         <span className="text-xs font-semibold opacity-80">
           Score: {screeningResult.virality_score} →
         </span>
       )}
       Continue to Images
       <ArrowRight className="w-4 h-4" />
     </button>
     {swipeMomentumResult && swipeMomentumResult.overall_score < 70 && (
       <p className="absolute -bottom-5 right-0 text-[10px] text-amber-400 whitespace-nowrap">
         ⚠ Low completion risk detected
       </p>
     )}
   </div>
   ```

**Step 2: Update StoryWorkspace to pass swipe result to ImageGenerationStep**

In `StoryWorkspace.tsx`:

1. Add import:
   ```typescript
   import { SwipeMomentumResult } from '@/lib/types'
   ```

2. Add state:
   ```typescript
   const [swipeMomentumResult, setSwipeMomentumResult] = useState<SwipeMomentumResult | null>(null)
   ```

3. Pass to StoryArcStep:
   ```tsx
   <StoryArcStep
     story={story}
     scenes={scenes}
     onScenesUpdate={handleScenesUpdate}
     onBack={() => setStep(1)}
     onContinue={() => setStep(3)}
     onScreeningComplete={setScreeningResult}
     onSwipeAnalysisComplete={setSwipeMomentumResult}
   />
   ```

4. Pass swipeMomentumResult to ImageGenerationStep as a new `swipeScore` prop:
   ```tsx
   <ImageGenerationStep
     story={story}
     scenes={scenes}
     visualDna={lockedCharacter?.visual_dna}
     onScenesUpdate={handleScenesUpdate}
     onBack={() => setStep(2)}
     onContinue={() => setStep(4)}
     swipeScore={swipeMomentumResult?.overall_score ?? null}
   />
   ```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/StoryArcStep.tsx src/components/StoryWorkspace.tsx
git commit -m "feat: integrate SwipeMomentumPanel into StoryArcStep + thread swipe score to workspace"
```

---

### Task 7: Add Pre-Image Gate Warning in ImageGenerationStep

**Files:**
- Modify: `src/components/ImageGenerationStep.tsx`

**Step 1: Add `swipeScore` prop**

In the props destructure and type, add:
```typescript
swipeScore?: number | null
```

**Step 2: Add dismissible warning overlay above the "Generate All" button**

Read the file to find where the "Generate All" / main CTA button is rendered, then add just above it:

```tsx
{/* Pre-image gate: swipe score warning */}
{swipeScore !== null && swipeScore !== undefined && swipeScore < 70 && !warningDismissed && (
  <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
    <span className="text-amber-400 text-lg shrink-0">⚠</span>
    <div className="flex-1">
      <p className="text-sm font-semibold text-amber-300">Low completion risk detected</p>
      <p className="text-xs text-zinc-400 mt-1">
        Your carousel scored {swipeScore}/100. Fixing story structure before generating images saves credits.
      </p>
    </div>
    <button
      onClick={() => setWarningDismissed(true)}
      className="text-xs text-zinc-500 hover:text-zinc-300 shrink-0"
    >
      Proceed anyway
    </button>
  </div>
)}
```

Add `const [warningDismissed, setWarningDismissed] = useState(false)` to the component state.

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/ImageGenerationStep.tsx
git commit -m "feat: add pre-image gate warning when swipe score < 70"
```

---

### Task 8: Database Migration (tex_content.stories)

**Files:**
- No file changes — raw SQL via Supabase REST API

**Step 1: Run migration**

Using the Supabase MCP tool or raw SQL via curl with `SUPABASE_SANDBOX_URL` and `SUPABASE_SANDBOX_SERVICE_ROLE_KEY`:

```sql
ALTER TABLE tex_content.stories
  ADD COLUMN IF NOT EXISTS swipe_score integer,
  ADD COLUMN IF NOT EXISTS swipe_grade text,
  ADD COLUMN IF NOT EXISTS drop_off_slide integer,
  ADD COLUMN IF NOT EXISTS swipe_completion_estimate float,
  ADD COLUMN IF NOT EXISTS swipe_analyzed_at timestamptz;
```

Note: This migration uses `tex_content` schema as specified in the product spec, since the `stories` table is already in that schema and the Supabase client connects to it. The migration is optional — the feature works fully without it (scores are held in React state).

**Step 2: Verify migration ran**

```bash
# Check column exists via Supabase REST
curl "$SUPABASE_SANDBOX_URL/rest/v1/stories?select=swipe_score&limit=1" \
  -H "Authorization: Bearer $SUPABASE_SANDBOX_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SANDBOX_SERVICE_ROLE_KEY"
```

---

### Task 9: Final Build Verification

**Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 2: Run build**

```bash
npm run build
```

Expected: successful build with no TypeScript errors

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Swipe Momentum Analyzer — per-slide drop-off predictor with one-click fixes"
```

---

## Summary of All Files

| Action | Path |
|--------|------|
| Modify | `src/lib/types.ts` |
| Create | `src/app/api/analyze-swipe-momentum/route.ts` |
| Create | `src/components/SlideScoreCard.tsx` |
| Create | `src/components/SlideDetailDrawer.tsx` |
| Create | `src/components/SwipeMomentumPanel.tsx` |
| Modify | `src/components/StoryArcStep.tsx` |
| Modify | `src/components/StoryWorkspace.tsx` |
| Modify | `src/components/ImageGenerationStep.tsx` |
| SQL migration | `tex_content.stories` (5 new columns) |
