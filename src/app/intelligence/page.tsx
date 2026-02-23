'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart2, RefreshCw, Database } from 'lucide-react'
import { ViraliityMatrixGrid } from '@/components/ViraliityMatrixGrid'
import { FormulaLeaderboard } from '@/components/FormulaLeaderboard'
import { NextStoryOptimizer } from '@/components/NextStoryOptimizer'
import { PerformanceTrendChart } from '@/components/PerformanceTrendChart'
import type { IntelligenceReport, ProvenFormula, EmotionalTone, CharacterArchetype, HookTriggerType } from '@/lib/types'

type OptimizerPreset = {
  tone?: EmotionalTone
  archetype?: CharacterArchetype
  format?: string
  hookType?: HookTriggerType
}

export default function IntelligencePage() {
  const [report, setReport] = useState<IntelligenceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizerPreset, setOptimizerPreset] = useState<OptimizerPreset>({})
  const [isDemo, setIsDemo] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/intelligence/pattern-analysis', { method: 'POST' })
      const data = await res.json()
      setReport(data)
      setIsDemo(data._demo === true)
    } catch (err) {
      console.error('Failed to fetch intelligence report:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  function handleSelectFormula(formula: ProvenFormula) {
    setOptimizerPreset({
      tone: formula.tone,
      archetype: formula.archetype,
      format: formula.format,
      hookType: formula.hookType,
    })
  }

  const isEmpty = !loading && (report?.totalStoriesAnalyzed ?? 0) === 0 && !isDemo

  return (
    <div className="min-h-screen bg-gray-950" style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}>
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* Header */}
        <header className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'monospace' }}>
                Intelligence Dashboard
                <span className="inline-block w-2 h-5 bg-[var(--accent)] ml-2 align-middle animate-pulse" />
              </h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[3.25rem]">
              Virality pattern analysis across your story library
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isDemo && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <Database className="w-3 h-3" />
                Demo Data
              </div>
            )}
            {report && (
              <div className="text-xs text-zinc-600 font-mono">
                {report.totalStoriesAnalyzed} stories analyzed
              </div>
            )}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-2 btn-secondary text-sm py-2 px-4"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="spinner mx-auto mb-4" style={{ width: '2rem', height: '2rem' }} />
              <p className="text-zinc-500 text-sm font-mono">Analyzing patterns...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left: Matrix + Charts (70%) */}
            <div className="flex-1 lg:w-[70%] space-y-6">

              {/* Virality Matrix */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    VIRALITY MATRIX
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-xs text-zinc-600">Emotional Tone × Character Archetype</span>
                </div>
                <ViraliityMatrixGrid
                  matrix={report?.matrix ?? []}
                  isEmpty={isEmpty}
                />
              </section>

              {/* Formula Leaderboard */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    TOP PROVEN FORMULAS
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <FormulaLeaderboard
                  formulas={report?.topFormulas ?? []}
                  onSelectFormula={handleSelectFormula}
                />
              </section>

              {/* Performance Trend */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    PERFORMANCE TREND
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <PerformanceTrendChart data={report?.trendData ?? []} />
              </section>

            </div>

            {/* Right: Story Configurator (30%) */}
            <aside className="lg:w-[30%] shrink-0">
              <div className="glass-card p-6 lg:sticky lg:top-20">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    STORY CONFIGURATOR
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <NextStoryOptimizer
                  key={JSON.stringify(optimizerPreset)}
                  matrix={report?.matrix ?? []}
                  initialValues={optimizerPreset}
                />
              </div>
            </aside>

          </div>
        )}
      </div>
    </div>
  )
}
