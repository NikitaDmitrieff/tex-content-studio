'use client'

import { useState } from 'react'
import { X, Wand2 } from 'lucide-react'
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
