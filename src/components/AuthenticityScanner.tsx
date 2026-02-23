'use client'

import { useState } from 'react'
import {
  ScanLine,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wand2,
  CheckCircle2,
} from 'lucide-react'
import { Scene, ScanResult } from '@/lib/types'

function highlightFlaggedPhrases(
  text: string,
  phrases: string[]
): React.ReactNode {
  if (!phrases.length) return text
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) => {
    if (phrases.some((p) => p.toLowerCase() === part.toLowerCase())) {
      return (
        <mark
          key={i}
          className="bg-orange-500/20 text-orange-300 underline decoration-red-400 decoration-wavy not-italic rounded-sm"
        >
          {part}
        </mark>
      )
    }
    return part
  })
}

function ScoreBadge({ score }: { score: number }) {
  const emoji = score >= 80 ? '👤' : score >= 60 ? '🤔' : '🤖'
  const cls =
    score >= 80
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : score >= 60
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30'
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}
    >
      {emoji} {score}
    </span>
  )
}

export function AuthenticityScanner({
  scenes,
  onScenesUpdate,
  scanResults,
  onScanComplete,
}: {
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  scanResults: ScanResult[]
  onScanComplete: (results: ScanResult[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set())
  const [fixingSlide, setFixingSlide] = useState<number | null>(null)
  const [fixedSlides, setFixedSlides] = useState<Set<number>>(new Set())
  const [fixAllLoading, setFixAllLoading] = useState(false)

  async function runScan(scenesToScan: { description: string; emotional_beat: string }[]) {
    setIsScanning(true)
    setRevealedCount(0)
    try {
      const res = await fetch('/api/scan-authenticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: scenesToScan, language: 'en' }),
      })
      const data = await res.json()
      if (data.results && Array.isArray(data.results)) {
        onScanComplete(data.results)
        data.results.forEach((_: ScanResult, i: number) => {
          setTimeout(() => {
            setRevealedCount(i + 1)
          }, 200 * (i + 1))
        })
      }
    } catch (err) {
      console.error('Scan failed:', err)
    } finally {
      setIsScanning(false)
    }
  }

  function handleOpen() {
    if (!isOpen) {
      setIsOpen(true)
      if (scanResults.length === 0) {
        runScan(scenes.map((s) => ({ description: s.description, emotional_beat: s.emotional_beat })))
      }
    } else {
      setIsOpen(false)
    }
  }

  async function handleRescan() {
    await runScan(
      scenes.map((s) => ({ description: s.description, emotional_beat: s.emotional_beat }))
    )
  }

  async function handleFixThis(slideIndex: number, rewrite: string) {
    const updatedScenes = scenes.map((s, i) =>
      i === slideIndex ? { ...s, description: rewrite } : s
    )
    onScenesUpdate(updatedScenes)
    setFixingSlide(slideIndex)

    try {
      const res = await fetch('/api/scan-authenticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: [{ description: rewrite, emotional_beat: scenes[slideIndex].emotional_beat }],
          language: 'en',
        }),
      })
      const data = await res.json()
      if (data.results && data.results[0]) {
        const updatedResult: ScanResult = { ...data.results[0], slide_index: slideIndex }
        const merged = scanResults.map((r) =>
          r.slide_index === slideIndex ? updatedResult : r
        )
        onScanComplete(merged)
      }
    } catch (err) {
      console.error('Rescan failed:', err)
    } finally {
      setFixedSlides((prev) => new Set(prev).add(slideIndex))
      setTimeout(() => setFixingSlide(null), 1500)
    }
  }

  function handleFixAll() {
    setFixAllLoading(true)
    const updated = scenes.map((s, i) => {
      const result = scanResults.find((r) => r.slide_index === i)
      if (result && result.human_score < 75 && result.rewrite) {
        return { ...s, description: result.rewrite }
      }
      return s
    })
    onScenesUpdate(updated)
    setTimeout(() => setFixAllLoading(false), 500)
  }

  function toggleExpanded(slideIndex: number) {
    setExpandedSlides((prev) => {
      const next = new Set(prev)
      if (next.has(slideIndex)) next.delete(slideIndex)
      else next.add(slideIndex)
      return next
    })
  }

  const avgScore =
    scanResults.length > 0
      ? Math.round(
          scanResults.reduce((sum, r) => sum + r.human_score, 0) / scanResults.length
        )
      : null

  const verdictLabel =
    avgScore === null
      ? null
      : avgScore >= 80
      ? 'Sounds Real'
      : avgScore >= 65
      ? 'Borderline'
      : 'AI Smell Detected'

  const verdictCls =
    avgScore === null
      ? ''
      : avgScore >= 80
      ? 'bg-emerald-500/20 text-emerald-400'
      : avgScore >= 65
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-red-500/20 text-red-400'

  const flaggedCount = scanResults.filter((r) => r.human_score < 75).length
  const rewriteCount = scanResults.filter((r) => r.human_score < 75 && r.rewrite).length

  return (
    <div className="glass-card overflow-hidden">
      {/* Toggle */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-medium">Check Authenticity</span>
          {avgScore !== null && !isOpen && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verdictCls}`}>
              {avgScore}/100
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {isScanning ? (
            <div className="text-center py-8 space-y-3">
              <div className="spinner mx-auto" />
              <p className="text-sm text-zinc-400">Scanning for AI patterns…</p>
            </div>
          ) : scanResults.length > 0 ? (
            <>
              {/* Global summary */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{avgScore}/100</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${verdictCls}`}>
                      {verdictLabel}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {flaggedCount} slide{flaggedCount !== 1 ? 's' : ''} flagged
                    {rewriteCount > 0 && ` · ${rewriteCount} need rewrites`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {rewriteCount > 0 && (
                    <button
                      onClick={handleFixAll}
                      disabled={fixAllLoading}
                      className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <Wand2 className="w-3 h-3" />
                      Fix All Suspicious
                    </button>
                  )}
                  <button
                    onClick={handleRescan}
                    className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Rescan
                  </button>
                </div>
              </div>

              {/* Per-slide results */}
              <div className="space-y-2">
                {scanResults.map((result) => {
                  const isRevealed = revealedCount > result.slide_index
                  const isExpanded = expandedSlides.has(result.slide_index)
                  const isFixed = fixedSlides.has(result.slide_index)
                  const isFixingThis = fixingSlide === result.slide_index
                  const scene = scenes[result.slide_index]
                  if (!scene) return null

                  return (
                    <div
                      key={result.slide_index}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                    >
                      {/* Scanning bar while not yet revealed */}
                      {!isRevealed && (
                        <div className="scanning-bar-wrap">
                          <div className="scanning-bar-fill" />
                        </div>
                      )}

                      {isRevealed && (
                        <div className="p-3 fade-in">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500 font-medium">
                              Slide {result.slide_index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {isFixed && !isFixingThis && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Fixed ✓
                                </span>
                              )}
                              <ScoreBadge score={result.human_score} />
                            </div>
                          </div>

                          <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                            {highlightFlaggedPhrases(scene.description, result.flagged_phrases)}
                          </p>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleExpanded(result.slide_index)}
                              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              {isExpanded ? 'Less' : 'Details'}
                            </button>
                            {result.verdict !== 'authentic' && result.rewrite && (
                              <button
                                onClick={() =>
                                  handleFixThis(result.slide_index, result.rewrite!)
                                }
                                disabled={isFixingThis}
                                className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                {isFixingThis ? 'Fixing…' : 'Fix This'}
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-white/[0.06]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    result.verdict === 'authentic'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : result.verdict === 'suspicious'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {result.verdict === 'authentic'
                                    ? 'Authentic'
                                    : result.verdict === 'suspicious'
                                    ? 'Suspicious'
                                    : 'AI Smell'}
                                </span>
                                {result.flagged_phrases.map((phrase, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  >
                                    {phrase}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Placeholder height while scanning bar is running */}
                      {!isRevealed && <div className="h-10" />}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <button
                onClick={handleRescan}
                className="btn-accent flex items-center gap-2 mx-auto"
              >
                <ScanLine className="w-4 h-4" />
                Scan Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
