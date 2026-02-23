'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, HelpCircle, X } from 'lucide-react'
import type { MatrixCell, EmotionalTone, CharacterArchetype } from '@/lib/types'

const EMOTIONAL_TONES: { value: EmotionalTone; label: string }[] = [
  { value: 'comeback', label: 'Comeback' },
  { value: 'revenge', label: 'Revenge' },
  { value: 'quiet_transformation', label: 'Quiet Transform' },
  { value: 'rock_bottom', label: 'Rock Bottom' },
  { value: 'against_all_odds', label: 'Against All Odds' },
]

const ARCHETYPES: { value: CharacterArchetype; label: string }[] = [
  { value: 'blue_collar_worker', label: 'Blue Collar' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'service_industry', label: 'Service' },
  { value: 'transport', label: 'Transport' },
  { value: 'retired', label: 'Retired' },
  { value: 'parent', label: 'Parent' },
  { value: 'tradesperson', label: 'Tradesperson' },
  { value: 'office_worker', label: 'Office Worker' },
  { value: 'creative', label: 'Creative' },
  { value: 'food_service', label: 'Food Service' },
]

function scoreToColor(score: number | null): string {
  if (score === null) return 'transparent'
  // 0 → #1e3a5f (cool blue), 10 → #ff6b35 (hot orange)
  const t = Math.max(0, Math.min(1, score / 10))
  // Interpolate through: 0=blue, 5=yellow-ish, 10=orange
  if (t < 0.5) {
    // blue → amber
    const p = t / 0.5
    const r = Math.round(0x1e + (0xff - 0x1e) * p * 0.6)
    const g = Math.round(0x3a + (0xb0 - 0x3a) * p)
    const b = Math.round(0x5f + (0x20 - 0x5f) * p)
    return `rgb(${r},${g},${b})`
  } else {
    // amber → hot orange
    const p = (t - 0.5) / 0.5
    const r = Math.round(0xb0 + (0xff - 0xb0) * p)
    const g = Math.round(0xb0 + (0x6b - 0xb0) * p)
    const b = Math.round(0x20 + (0x35 - 0x20) * p)
    return `rgb(${r},${g},${b})`
  }
}

function scoreToTextColor(score: number | null): string {
  if (score === null) return '#6b7280'
  return score > 5 ? '#fff' : '#e2e8f0'
}

interface SlideOverProps {
  cell: MatrixCell
  stories: MatrixCell[]
  onClose: () => void
}

function CellSlideOver({ cell, onClose }: SlideOverProps) {
  const toneName = EMOTIONAL_TONES.find((t) => t.value === cell.tone)?.label ?? cell.tone
  const archName = ARCHETYPES.find((a) => a.value === cell.archetype)?.label ?? cell.archetype

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full bg-gray-950 border-l border-white/10 shadow-2xl overflow-y-auto p-6 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs text-zinc-500 font-mono mb-1">CELL DETAIL</div>
            <h3 className="text-lg font-bold text-white">{toneName}</h3>
            <p className="text-sm text-zinc-400">{archName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
            <div className="text-2xl font-bold" style={{ color: scoreToColor(cell.avgScore) }}>
              {cell.avgScore !== null ? cell.avgScore.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Avg Score</div>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
            <div className="text-2xl font-bold text-white">{cell.storyCount}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Stories</div>
          </div>
        </div>

        {cell.isDeadZone && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">Dead zone — avg score below 4. Avoid this combination.</p>
          </div>
        )}

        {cell.topStoryId && (
          <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 font-mono mb-2">TOP STORY</div>
            <p className="text-sm text-zinc-300 mb-3 font-mono">{cell.topStoryId}</p>
            <Link
              href={`/story/${cell.topStoryId}`}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
            >
              Preview Best Story →
            </Link>
          </div>
        )}

        {cell.avgScore === null && (
          <div className="text-center py-8">
            <HelpCircle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No stories have been created with this combination yet.</p>
            <Link
              href="/story/new"
              className="mt-3 inline-block text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Create First Story →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

interface ViraliityMatrixGridProps {
  matrix: MatrixCell[][]
  isEmpty?: boolean
}

export function ViraliityMatrixGrid({ matrix, isEmpty = false }: ViraliityMatrixGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null)

  if (isEmpty || matrix.length === 0) {
    return (
      <div className="relative">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Column headers */}
            <div className="flex ml-32 mb-2">
              {ARCHETYPES.map((a) => (
                <div key={a.value} className="flex-1 text-center text-[10px] text-zinc-600 font-mono truncate px-0.5">
                  {a.label}
                </div>
              ))}
            </div>
            {EMOTIONAL_TONES.map((tone) => (
              <div key={tone.value} className="flex items-center mb-1.5">
                <div className="w-32 shrink-0 text-right pr-3 text-xs text-zinc-600 font-mono">{tone.label}</div>
                {ARCHETYPES.map((arch) => (
                  <div
                    key={arch.value}
                    className="flex-1 h-10 mx-0.5 rounded-lg border border-dashed border-zinc-800 opacity-30"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 rounded-xl">
          <HelpCircle className="w-10 h-10 text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-400 text-center max-w-xs">
            Generate your first 3 stories to unlock intelligence patterns
          </p>
          <Link href="/story/new" className="mt-4 btn-accent text-sm px-4 py-2 rounded-xl">
            Quick-Start →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes cellPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(255,107,53,0.3); }
          50% { box-shadow: 0 0 18px rgba(255,107,53,0.6); }
        }
        .cell-pulse { animation: cellPulse 3s ease-in-out infinite; }
      `}</style>

      <div className="overflow-x-auto">
        <div className="min-w-[780px]">
          {/* Column headers */}
          <div className="flex ml-36 mb-2">
            {ARCHETYPES.map((a) => (
              <div key={a.value} className="flex-1 text-center text-[10px] text-zinc-500 font-mono truncate px-0.5">
                {a.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {EMOTIONAL_TONES.map((tone, rowIdx) => (
            <div key={tone.value} className="flex items-center mb-1.5">
              <div className="w-36 shrink-0 text-right pr-3 text-xs text-zinc-400 font-mono leading-tight">
                {tone.label}
              </div>
              {ARCHETYPES.map((arch, colIdx) => {
                const cell = matrix[rowIdx]?.[colIdx]
                const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx
                const hasPulse = cell && cell.storyCount >= 3 && cell.avgScore !== null
                const isUnexplored = !cell || cell.avgScore === null

                return (
                  <div key={arch.value} className="flex-1 mx-0.5 relative group">
                    <button
                      className={`
                        w-full h-11 rounded-lg border transition-all duration-300 cursor-pointer
                        hover:scale-105 hover:z-10 relative flex items-center justify-center
                        ${isUnexplored ? 'border-dashed border-zinc-700 bg-transparent' : 'border-transparent'}
                        ${cell?.isDeadZone ? 'border border-red-500/40' : ''}
                        ${hasPulse ? 'cell-pulse' : ''}
                      `}
                      style={
                        !isUnexplored && cell
                          ? { backgroundColor: scoreToColor(cell.avgScore) }
                          : {}
                      }
                      onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => cell && setSelectedCell(cell)}
                      title={`${tone.label} × ${arch.label}`}
                    >
                      {isUnexplored ? (
                        <HelpCircle className="w-3 h-3 text-zinc-700" />
                      ) : cell?.isDeadZone ? (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      ) : cell?.avgScore !== null ? (
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: scoreToTextColor(cell.avgScore) }}
                        >
                          {cell.avgScore.toFixed(1)}
                        </span>
                      ) : null}

                      {/* Dead zone badge */}
                      {cell?.isDeadZone && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-[7px] text-white font-bold">!</span>
                        </span>
                      )}
                    </button>

                    {/* Tooltip */}
                    {isHovered && cell && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none w-48">
                        <div className="bg-gray-900 border border-white/[0.12] rounded-xl p-3 shadow-2xl text-left">
                          <p className="text-xs font-semibold text-white mb-1">
                            {tone.label} × {arch.label}
                          </p>
                          {cell.avgScore !== null ? (
                            <>
                              <p className="text-[11px] text-zinc-400">
                                Avg score:{' '}
                                <span className="font-bold" style={{ color: scoreToColor(cell.avgScore) }}>
                                  {cell.avgScore.toFixed(1)}/10
                                </span>
                              </p>
                              <p className="text-[11px] text-zinc-400">Stories: {cell.storyCount}</p>
                              {cell.topStoryId && (
                                <p className="text-[10px] text-zinc-500 mt-1 truncate">
                                  Top: {cell.topStoryId}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-[11px] text-zinc-500">Unexplored — try this combo!</p>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-gray-900 border-r border-b border-white/[0.12] rotate-45 mx-auto -mt-1" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Score legend */}
      <div className="flex items-center gap-3 mt-4">
        <span className="text-[10px] text-zinc-600 font-mono">LOW</span>
        <div className="flex-1 h-2 rounded-full" style={{
          background: 'linear-gradient(to right, #1e3a5f, #6b9a3a, #ffb020, #ff6b35)',
        }} />
        <span className="text-[10px] text-zinc-600 font-mono">HIGH</span>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 border border-dashed border-zinc-700 rounded" />
          <span className="text-[10px] text-zinc-600">Unexplored</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span className="text-[10px] text-zinc-600">Dead zone</span>
        </div>
      </div>

      {/* SlideOver */}
      {selectedCell && (
        <CellSlideOver
          cell={selectedCell}
          stories={[]}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  )
}
