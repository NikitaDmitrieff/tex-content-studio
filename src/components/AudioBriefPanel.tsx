'use client'

import { useState } from 'react'
import { Story, Scene, AudioBrief, SongSuggestion } from '@/lib/types'
import { Sparkles, Copy, CheckCircle2, Music, Info } from 'lucide-react'

// Energy level → CSS color (cool blue to warm orange)
function energyToColor(energy: number): string {
  if (energy < 0.2) return '#3b82f6' // blue-500
  if (energy < 0.4) return '#6366f1' // indigo-500
  if (energy < 0.55) return '#8b5cf6' // violet-500
  if (energy < 0.7) return '#f59e0b' // amber-500
  if (energy < 0.85) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

function energyLabel(energy: number): string {
  if (energy < 0.2) return 'Quiet'
  if (energy < 0.4) return 'Low'
  if (energy < 0.55) return 'Mid'
  if (energy < 0.7) return 'Rising'
  if (energy < 0.85) return 'High'
  return 'Peak'
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 80
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : pct >= 55
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${color}`}>
      {label} {pct}%
    </span>
  )
}

function SongCard({
  song,
  index,
  copied,
  onCopy,
}: {
  song: SongSuggestion
  index: number
  copied: string | null
  onCopy: (text: string, key: string) => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const matchPct = Math.round(song.mood_match_score * 100)
  const matchColor =
    matchPct >= 80
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : matchPct >= 60
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10'
  const copyKey = `tiktok-${index}`

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">{song.track}</span>
            <span className="text-xs text-zinc-500">—</span>
            <span className="text-xs text-zinc-400">{song.artist}</span>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Mood match badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${matchColor}`}
            >
              {matchPct}% match
            </span>

            {/* Why it fits tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Info className="w-3 h-3" />
                Why it fits
              </button>
              {showTooltip && (
                <div className="absolute bottom-full left-0 mb-2 z-10 w-72 p-3 rounded-xl bg-zinc-900 border border-white/[0.12] shadow-xl">
                  <p className="text-xs text-zinc-300 leading-relaxed">{song.why_it_fits}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TikTok search chip */}
        <button
          onClick={() => onCopy(song.tiktok_search_term, copyKey)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#010101] border border-white/[0.08] text-xs text-zinc-300 hover:border-white/20 hover:text-white transition-all"
          title="Copy TikTok search term"
        >
          {copied === copyKey ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.15a8.17 8.17 0 0 0 4.77 1.52V7.24a4.85 4.85 0 0 1-1-.55z" />
              </svg>
              <span>Search TikTok</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export function AudioBriefPanel({
  story,
  scenes,
  onBriefGenerated,
}: {
  story: Story
  scenes: Scene[]
  onBriefGenerated?: (brief: AudioBrief) => void
}) {
  const [brief, setBrief] = useState<AudioBrief | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-audio-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: story.id }),
      })
      const data = await res.json()
      if (data.audio_brief) {
        setBrief(data.audio_brief)
        onBriefGenerated?.(data.audio_brief)
      }
    } catch (err) {
      console.error('Audio brief generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // Build the mood map segments — pad or trim to 8 segments
  function getMoodMapSegments(brief: AudioBrief): { energy: number; label: string }[] {
    const totalScenes = Math.max(scenes.length, 1)
    const energies = brief.scene_energies ?? []
    const segments: { energy: number; label: string }[] = []
    for (let i = 0; i < 8; i++) {
      const energy = energies[i] ?? energies[energies.length - 1] ?? 0.5
      segments.push({ energy, label: scenes[i]?.emotional_beat ?? `Scene ${i + 1}` })
    }
    return segments
  }

  const frenchPct = brief ? Math.round(brief.french_affinity_score * 100) : 0
  const universalPct = brief ? Math.round(brief.universal_score * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-zinc-200">Audio DNA Brief</span>
          {brief && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-hover)]">
              Generated
            </span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-accent flex items-center gap-2 text-xs py-1.5 px-3"
        >
          {generating ? (
            <>
              <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Analysing story...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{brief ? 'Regenerate' : 'Generate Audio Brief'}</span>
            </>
          )}
        </button>
      </div>

      {/* Empty state */}
      {!brief && !generating && (
        <div className="glass-card p-10 text-center">
          <Music className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-1">
            Get an AI-generated music brief for this carousel
          </p>
          <p className="text-xs text-zinc-600">
            BPM range, mood arc, song suggestions with TikTok search terms
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {generating && (
        <div className="space-y-4">
          <div className="glass-card p-5 animate-pulse space-y-3">
            <div className="h-4 bg-white/[0.06] rounded w-1/3" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/[0.04] rounded-xl" />
              ))}
            </div>
          </div>
          <div className="glass-card p-5 animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-1/4 mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex-1 h-16 bg-white/[0.04] rounded-lg" />
              ))}
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-2/5 mb-2" />
              <div className="h-3 bg-white/[0.04] rounded w-3/5" />
            </div>
          ))}
        </div>
      )}

      {/* Brief content */}
      {brief && !generating && (
        <div className="space-y-5">
          {/* Audio DNA grid */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Audio DNA
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {/* BPM Range */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">BPM Range</div>
                <div className="text-sm font-semibold text-white">{brief.bpm_range}</div>
              </div>

              {/* Mood Arc */}
              <div className="col-span-2 sm:col-span-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">Mood Arc</div>
                <div className="text-sm font-semibold text-white leading-snug">{brief.mood_arc}</div>
              </div>

              {/* French Affinity */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1.5">French Affinity</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇫🇷</span>
                  <ScoreBadge score={brief.french_affinity_score} label="" />
                </div>
              </div>

              {/* Universal Score */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1.5">Universal</div>
                <ScoreBadge score={brief.universal_score} label="" />
              </div>
            </div>

            {/* Genre tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {brief.genre_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-hover)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Audio Mood Map */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Audio Mood Map
            </h3>
            <div className="flex gap-1.5 items-end h-20">
              {getMoodMapSegments(brief).map((seg, i) => {
                const heightPct = Math.max(20, Math.round(seg.energy * 100))
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                    title={`Scene ${i + 1}: ${seg.label} (${Math.round(seg.energy * 100)}%)`}
                  >
                    <div
                      className="w-full rounded-t-lg transition-all duration-300 group-hover:opacity-90 cursor-default"
                      style={{
                        height: `${heightPct}%`,
                        background: energyToColor(seg.energy),
                        boxShadow: `0 0 8px ${energyToColor(seg.energy)}40`,
                        minHeight: '8px',
                      }}
                    />
                    <span className="text-[10px] text-zinc-600 font-mono">{i + 1}</span>
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap">
                      <div className="text-[10px] text-zinc-300 bg-zinc-900 border border-white/[0.08] px-2 py-1 rounded-lg shadow">
                        {energyLabel(seg.energy)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-zinc-600">Low energy</span>
              <div className="flex items-center gap-1">
                {['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#f97316', '#ef4444'].map((c) => (
                  <div
                    key={c}
                    className="w-4 h-1.5 rounded-full"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-600">Peak energy</span>
            </div>
          </div>

          {/* Song suggestions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Song Suggestions ({brief.song_suggestions.length})
            </h3>
            <div className="space-y-2">
              {brief.song_suggestions.map((song, i) => (
                <SongCard
                  key={i}
                  song={song}
                  index={i}
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
