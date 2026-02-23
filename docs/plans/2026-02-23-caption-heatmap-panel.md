# Caption Power Word Heatmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CaptionHeatmapPanel that colors every French word in scene captions by virality power (high/mid/low), with hover tooltips, one-click word replacements, and a bulk upgrade flow.

**Architecture:** New panel component `CaptionHeatmapPanel.tsx` added after `SwipeMomentumPanel` in `StoryArcStep.tsx`. API route `/api/analyze-caption-words` calls Claude to score every word. State is ephemeral (component-level only, not persisted to DB).

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind v4, Anthropic SDK (`@anthropic-ai/sdk`)

---

### Task 1: Add types to `src/lib/types.ts`

**Files:**
- Modify: `src/lib/types.ts` (append at end)

**Step 1: Append new types**

```typescript
// ── Caption Power Word Heatmap ────────────────────────────────────────────────

export type WordPowerTier = 'high' | 'mid' | 'low'

export type WordScore = {
  word: string
  score: number        // 1–10
  reason_fr: string
  alternatives: string[]
}

export type SceneWordAnalysis = {
  sceneId: string
  words: WordScore[]
}

export type CaptionWordAnalysisResult = {
  scenes: SceneWordAnalysis[]
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /private/tmp/builder-f1165f2d && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors

---

### Task 2: Create API route `/api/analyze-caption-words/route.ts`

**Files:**
- Create: `src/app/api/analyze-caption-words/route.ts`

**Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { WordScore, SceneWordAnalysis, CaptionWordAnalysisResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { scenes: { id: string; caption: string }[] }
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
    const demoResult: CaptionWordAnalysisResult = {
      scenes: scenes.map((scene) => {
        const words = scene.caption.split(/\s+/).filter(Boolean)
        return {
          sceneId: scene.id,
          words: words.map((word, i): WordScore => {
            // Alternate tiers for demo
            const score = i % 3 === 0 ? 8 : i % 3 === 1 ? 5 : 3
            return {
              word,
              score,
              reason_fr: score >= 7 ? 'Mot émotionnel fort' : score >= 4 ? 'Mot neutre' : 'Mot vague — réduit l\'engagement',
              alternatives: score < 5 ? ['plus fort', 'incroyable', 'transformé'] : [],
            }
          }),
        }
      }),
    }
    return NextResponse.json(demoResult)
  }

  // ── CLAUDE ANALYSIS ────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey })

    const captionsText = scenes
      .map((s, i) => `Scene ${i + 1} (id: ${s.id}):\n${s.caption}`)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a French TikTok virality expert specializing in fitness transformation content.
For each caption below, analyze every word and score it 1-10 for scroll-stop potential.
High-scoring words (7-10): emotional triggers, specificity, French vernacular, vulnerability, urgency, numbers/data, French fitness slang.
Mid-scoring words (4-6): neutral functional words.
Low-scoring words (1-3): vague adjectives, filler words, generic verbs, over-formal language.
For each word under 5/10, provide 3 French replacement suggestions that score higher.
reason_fr must be a short French explanation (max 10 words).

Captions to analyze:
${captionsText}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "scenes": [
    {
      "sceneId": "scene-id-here",
      "words": [
        { "word": "mot", "score": 8, "reason_fr": "Mot de vulnérabilité — ancre le lecteur", "alternatives": [] },
        { "word": "faible", "score": 3, "reason_fr": "Adjectif vague — réduit l'impact", "alternatives": ["brisé", "épuisé", "à terre"] }
      ]
    }
  ]
}`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result: CaptionWordAnalysisResult = JSON.parse(cleanedText)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Caption word analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze caption words', details: String(err) },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /private/tmp/builder-f1165f2d && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors

---

### Task 3: Add CSS animations to `src/app/globals.css`

**Files:**
- Modify: `src/app/globals.css` (append at end)

**Step 1: Append new CSS**

```css
/* Caption Power Word Heatmap */
.word-power-high {
  background-color: #22c55e;
  color: #14532d;
  border-radius: 0.25rem;
  padding: 0 2px;
  cursor: pointer;
}

.word-power-mid {
  background-color: #f59e0b;
  color: #451a03;
  border-radius: 0.25rem;
  padding: 0 2px;
  cursor: pointer;
}

.word-power-low {
  background-color: #ef4444;
  color: white;
  border-radius: 0.25rem;
  padding: 0 2px;
  cursor: pointer;
}

@keyframes wordFlash {
  0%   { background-color: #6d5aff; color: white; }
  100% { background-color: inherit; color: inherit; }
}

.word-flash {
  animation: wordFlash 0.6s ease-out forwards;
}

@keyframes wordPillPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.7; }
}

.word-pill-skeleton {
  display: inline-block;
  height: 1em;
  background: rgba(255,255,255,0.1);
  border-radius: 0.25rem;
  animation: wordPillPulse 1.2s ease-in-out infinite;
  vertical-align: middle;
}
```

---

### Task 4: Create `src/components/CaptionHeatmapPanel.tsx`

**Files:**
- Create: `src/components/CaptionHeatmapPanel.tsx`

This is the main component. It has several sub-sections:
- Header trigger (collapsed/expanded)
- Loading skeleton (word pills)
- Per-scene caption render with colored word spans
- Hover tooltip per word
- Click to show replacement chips inline
- Bulk "Booster toutes les captions" button with diff view + Confirm/Undo

**Step 1: Create the component**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Zap, RefreshCw, Check, RotateCcw } from 'lucide-react'
import { Scene, CaptionWordAnalysisResult, SceneWordAnalysis, WordScore } from '@/lib/types'

function getWordTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 7) return 'high'
  if (score >= 4) return 'mid'
  return 'low'
}

function WordTooltip({ word, onClose }: { word: WordScore; onClose: () => void }) {
  const tier = getWordTier(word.score)
  return (
    <div
      className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 glass-card p-3 text-xs shadow-xl"
      style={{ border: '1px solid rgba(255,255,255,0.15)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-white">{word.word}</span>
        <span
          className={`font-bold ${
            tier === 'high' ? 'text-green-400' : tier === 'mid' ? 'text-amber-400' : 'text-red-400'
          }`}
        >
          {word.score}/10
        </span>
      </div>
      <p className="text-zinc-300 mb-1 leading-relaxed">{word.reason_fr}</p>
      {word.alternatives.length > 0 && (
        <div>
          <p className="text-zinc-500 text-[10px] mb-0.5">Alternatives:</p>
          <div className="flex flex-wrap gap-1">
            {word.alternatives.map((alt) => (
              <span key={alt} className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ColoredCaption({
  analysis,
  caption,
  onWordReplace,
  skeletonWordWidths,
}: {
  analysis: SceneWordAnalysis | null
  caption: string
  onWordReplace: (originalWord: string, replacement: string) => void
  skeletonWordWidths: number[]
}) {
  const [hoveredWord, setHoveredWord] = useState<number | null>(null)
  const [activeChips, setActiveChips] = useState<number | null>(null)
  const [flashedWord, setFlashedWord] = useState<number | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!analysis) {
    // Skeleton: pulsing pills of varying width
    return (
      <p className="text-sm leading-7 flex flex-wrap gap-1 items-center">
        {skeletonWordWidths.map((w, i) => (
          <span
            key={i}
            className="word-pill-skeleton"
            style={{ width: w, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </p>
    )
  }

  function handleWordClick(idx: number) {
    setActiveChips((prev) => (prev === idx ? null : idx))
    setHoveredWord(null)
  }

  function handleReplace(idx: number, alt: string) {
    const wordData = analysis!.words[idx]
    onWordReplace(wordData.word, alt)
    setActiveChips(null)
    setFlashedWord(idx)
    setTimeout(() => setFlashedWord(null), 700)
  }

  return (
    <p className="text-sm leading-8 flex flex-wrap gap-x-1 gap-y-0.5 items-center">
      {analysis.words.map((w, idx) => {
        const tier = getWordTier(w.score)
        const isHovered = hoveredWord === idx
        const isActive = activeChips === idx
        const isFlashing = flashedWord === idx

        return (
          <span key={`${idx}-${w.word}`} className="relative inline-block">
            <span
              className={`word-power-${tier} ${isFlashing ? 'word-flash' : ''} select-none`}
              onMouseEnter={() => {
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
                setHoveredWord(idx)
              }}
              onMouseLeave={() => {
                hoverTimeout.current = setTimeout(() => setHoveredWord(null), 150)
              }}
              onClick={() => handleWordClick(idx)}
            >
              {w.word}
            </span>

            {/* Hover tooltip */}
            {isHovered && !isActive && (
              <WordTooltip word={w} onClose={() => setHoveredWord(null)} />
            )}

            {/* Inline replacement chips */}
            {isActive && w.alternatives.length > 0 && (
              <span className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 flex gap-1 flex-nowrap">
                {w.alternatives.map((alt) => (
                  <button
                    key={alt}
                    onClick={() => handleReplace(idx, alt)}
                    className="px-2 py-1 text-xs rounded-lg bg-[var(--accent)] text-white whitespace-nowrap hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    {alt}
                  </button>
                ))}
                <button
                  onClick={() => setActiveChips(null)}
                  className="px-2 py-1 text-xs rounded-lg bg-zinc-700 text-zinc-300 whitespace-nowrap hover:bg-zinc-600 transition-colors"
                >
                  ✕
                </button>
              </span>
            )}
          </span>
        )
      })}
    </p>
  )
}

export function CaptionHeatmapPanel({
  scenes,
  onScenesUpdate,
}: {
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CaptionWordAnalysisResult | null>(null)
  const [loadingSceneIndex, setLoadingSceneIndex] = useState<number>(-1)

  // Bulk upgrade state
  const [showDiff, setShowDiff] = useState(false)
  const [upgradedCaptions, setUpgradedCaptions] = useState<Record<string, string>>({})
  const [confirmedUpgrade, setConfirmedUpgrade] = useState(false)
  const [preUpgradeScenes, setPreUpgradeScenes] = useState<Scene[] | null>(null)

  // Skeleton widths — deterministic per scene/word count
  function getSkeletonWidths(scene: Scene): number[] {
    const caption = scene.caption ?? scene.description ?? ''
    const wordCount = Math.max(caption.split(/\s+/).filter(Boolean).length, 5)
    return Array.from({ length: wordCount }, (_, i) => 30 + ((i * 17 + 23) % 60))
  }

  const scenesWithCaptions = scenes.filter((s) => s.caption && s.caption.trim().length > 0)

  async function runAnalysis() {
    if (scenesWithCaptions.length === 0) return
    setLoading(true)
    setIsOpen(true)
    setResult(null)
    setLoadingSceneIndex(0)

    // Animate scene-by-scene loading
    const animInterval = setInterval(() => {
      setLoadingSceneIndex((prev) => {
        if (prev < scenesWithCaptions.length - 1) return prev + 1
        return prev
      })
    }, 600)

    try {
      const res = await fetch('/api/analyze-caption-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenesWithCaptions.map((s) => ({ id: s.id, caption: s.caption! })),
        }),
      })
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`)
      const data: CaptionWordAnalysisResult = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Caption heatmap analysis failed:', err)
    } finally {
      clearInterval(animInterval)
      setLoading(false)
      setLoadingSceneIndex(-1)
    }
  }

  function handleWordReplace(sceneId: string, originalWord: string, replacement: string) {
    const scene = scenes.find((s) => s.id === sceneId)
    if (!scene || !scene.caption) return

    // Replace first occurrence of the word (case-insensitive)
    const regex = new RegExp(`\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    const newCaption = scene.caption.replace(regex, replacement)
    const updatedScenes = scenes.map((s) =>
      s.id === sceneId ? { ...s, caption: newCaption } : s
    )
    onScenesUpdate(updatedScenes)

    // Update result to reflect new word
    if (result) {
      const updatedScenes2 = result.scenes.map((sa) => {
        if (sa.sceneId !== sceneId) return sa
        return {
          ...sa,
          words: sa.words.map((w) =>
            w.word.toLowerCase() === originalWord.toLowerCase()
              ? { ...w, word: replacement, score: 8, alternatives: [] }
              : w
          ),
        }
      })
      setResult({ scenes: updatedScenes2 })
    }
  }

  function handleBulkUpgrade() {
    if (!result) return
    const upgraded: Record<string, string> = {}

    for (const sceneAnalysis of result.scenes) {
      const scene = scenes.find((s) => s.id === sceneAnalysis.sceneId)
      if (!scene || !scene.caption) continue

      let caption = scene.caption
      for (const word of sceneAnalysis.words) {
        if (word.score < 5 && word.alternatives.length > 0) {
          const best = word.alternatives[0]
          const regex = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
          caption = caption.replace(regex, best)
        }
      }
      if (caption !== scene.caption) {
        upgraded[sceneAnalysis.sceneId] = caption
      }
    }

    setPreUpgradeScenes([...scenes])
    setUpgradedCaptions(upgraded)
    setShowDiff(true)
    setConfirmedUpgrade(false)
  }

  function handleConfirmUpgrade() {
    const updatedScenes = scenes.map((s) =>
      upgradedCaptions[s.id] ? { ...s, caption: upgradedCaptions[s.id] } : s
    )
    onScenesUpdate(updatedScenes)
    setShowDiff(false)
    setConfirmedUpgrade(true)
    // Re-analyze
    setTimeout(() => runAnalysis(), 300)
  }

  function handleUndoUpgrade() {
    if (preUpgradeScenes) {
      onScenesUpdate(preUpgradeScenes)
    }
    setShowDiff(false)
    setConfirmedUpgrade(false)
    setPreUpgradeScenes(null)
  }

  const weakWordCount = result
    ? result.scenes.reduce(
        (sum, sa) => sum + sa.words.filter((w) => w.score < 5).length,
        0
      )
    : 0

  if (scenesWithCaptions.length === 0) return null

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
          <Zap className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <span className="text-sm font-semibold text-white">Word Power Heatmap</span>
            {result && (
              <span className="ml-2 text-xs text-zinc-400">
                {weakWordCount} mot{weakWordCount !== 1 ? 's' : ''} faible{weakWordCount !== 1 ? 's' : ''} détecté{weakWordCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {!result && !loading && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Analyser
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
          {/* Bulk upgrade button */}
          {result && !showDiff && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                  <span className="text-zinc-400">Fort (7-10)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                  <span className="text-zinc-400">Neutre (4-6)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                  <span className="text-zinc-400">Faible (1-3)</span>
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkUpgrade}
                  disabled={weakWordCount === 0}
                  className="btn-accent flex items-center gap-2 text-sm disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Booster toutes les captions
                </button>
                <button
                  onClick={runAnalysis}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Ré-analyser
                </button>
              </div>
            </div>
          )}

          {/* Diff view */}
          {showDiff && (
            <div className="glass-card p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white">Aperçu des améliorations</h4>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Object.entries(upgradedCaptions).map(([sceneId, newCaption]) => {
                  const scene = scenes.find((s) => s.id === sceneId)
                  return (
                    <div key={sceneId} className="text-xs space-y-1">
                      <p className="text-zinc-500 line-through">{scene?.caption}</p>
                      <p className="text-emerald-400">{newCaption}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleConfirmUpgrade}
                  className="btn-accent flex items-center gap-2 text-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirmer
                </button>
                <button
                  onClick={handleUndoUpgrade}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Per-scene caption renders */}
          <div className="space-y-4">
            {scenesWithCaptions.map((scene, sceneIdx) => {
              const sceneAnalysis = result?.scenes.find((sa) => sa.sceneId === scene.id) ?? null
              const isLoadingThis = loading && loadingSceneIndex >= sceneIdx

              return (
                <div key={scene.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Scène {sceneIdx + 1}
                    </span>
                    {sceneAnalysis && (
                      <span className="text-[10px] text-zinc-600">
                        {sceneAnalysis.words.filter((w) => w.score >= 7).length} forts ·{' '}
                        {sceneAnalysis.words.filter((w) => w.score < 5).length} faibles
                      </span>
                    )}
                  </div>
                  {isLoadingThis || (!sceneAnalysis && loading) ? (
                    <ColoredCaption
                      analysis={null}
                      caption={scene.caption!}
                      onWordReplace={() => {}}
                      skeletonWordWidths={getSkeletonWidths(scene)}
                    />
                  ) : (
                    <ColoredCaption
                      analysis={sceneAnalysis}
                      caption={scene.caption!}
                      onWordReplace={(orig, repl) => handleWordReplace(scene.id, orig, repl)}
                      skeletonWordWidths={getSkeletonWidths(scene)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /private/tmp/builder-f1165f2d && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors

---

### Task 5: Integrate `CaptionHeatmapPanel` into `StoryArcStep.tsx`

**Files:**
- Modify: `src/components/StoryArcStep.tsx`

**Step 1: Add import at top of file (after existing imports)**

After line 21 (`import { ArcOverlay } from './ArcOverlay'`), add:
```typescript
import { CaptionHeatmapPanel } from './CaptionHeatmapPanel'
```

**Step 2: Add panel after `SwipeMomentumPanel` in JSX**

After the closing `/>` of `<SwipeMomentumPanel` block (around line 465), add:
```tsx
{/* Caption Power Word Heatmap */}
<CaptionHeatmapPanel
  scenes={scenes}
  onScenesUpdate={onScenesUpdate}
/>
```

This goes between `</SwipeMomentumPanel>` close and `<AuthenticityScanner`.

---

### Task 6: Run build to verify

Run: `cd /private/tmp/builder-f1165f2d && npm run build 2>&1 | tail -30`
Expected: build succeeds with no TypeScript or compilation errors

If errors appear, fix them before marking complete.

---

## Summary of files to create/modify

| Action | File |
|--------|------|
| Modify | `src/lib/types.ts` |
| Create | `src/app/api/analyze-caption-words/route.ts` |
| Modify | `src/app/globals.css` |
| Create | `src/components/CaptionHeatmapPanel.tsx` |
| Modify | `src/components/StoryArcStep.tsx` |
