'use client'

import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Zap, RefreshCw, Check, RotateCcw } from 'lucide-react'
import { Scene, CaptionWordAnalysisResult, SceneWordAnalysis, WordScore } from '@/lib/types'

function getWordTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 7) return 'high'
  if (score >= 4) return 'mid'
  return 'low'
}

function WordTooltip({ word }: { word: WordScore }) {
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
  onWordReplace,
  skeletonWordWidths,
}: {
  analysis: SceneWordAnalysis | null
  onWordReplace: (originalWord: string, replacement: string) => void
  skeletonWordWidths: number[]
}) {
  const [hoveredWord, setHoveredWord] = useState<number | null>(null)
  const [activeChips, setActiveChips] = useState<number | null>(null)
  const [flashedWord, setFlashedWord] = useState<number | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!analysis) {
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
            {isHovered && !isActive && <WordTooltip word={w} />}

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
  const [preUpgradeScenes, setPreUpgradeScenes] = useState<Scene[] | null>(null)

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

    const regex = new RegExp(
      `\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i'
    )
    const newCaption = scene.caption.replace(regex, replacement)
    const updatedScenes = scenes.map((s) =>
      s.id === sceneId ? { ...s, caption: newCaption } : s
    )
    onScenesUpdate(updatedScenes)

    if (result) {
      const updatedResultScenes = result.scenes.map((sa) => {
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
      setResult({ scenes: updatedResultScenes })
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
          const regex = new RegExp(
            `\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
            'i'
          )
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
  }

  function handleConfirmUpgrade() {
    const updatedScenes = scenes.map((s) =>
      upgradedCaptions[s.id] ? { ...s, caption: upgradedCaptions[s.id] } : s
    )
    onScenesUpdate(updatedScenes)
    setShowDiff(false)
    setPreUpgradeScenes(null)
    setTimeout(() => runAnalysis(), 300)
  }

  function handleUndoUpgrade() {
    if (preUpgradeScenes) {
      onScenesUpdate(preUpgradeScenes)
    }
    setShowDiff(false)
    setPreUpgradeScenes(null)
  }

  const weakWordCount = result
    ? result.scenes.reduce((sum, sa) => sum + sa.words.filter((w) => w.score < 5).length, 0)
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
                {weakWordCount} mot{weakWordCount !== 1 ? 's' : ''} faible
                {weakWordCount !== 1 ? 's' : ''} détecté{weakWordCount !== 1 ? 's' : ''}
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
          {/* Bulk upgrade button + legend */}
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
              <div className="flex gap-2 items-center">
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
                  <ColoredCaption
                    analysis={isLoadingThis ? null : sceneAnalysis}
                    onWordReplace={(orig, repl) => handleWordReplace(scene.id, orig, repl)}
                    skeletonWordWidths={getSkeletonWidths(scene)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
