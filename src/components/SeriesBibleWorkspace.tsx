'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Character, SeriesBibleEpisode, EMOTIONAL_TONES } from '@/lib/types'
import {
  BookOpen,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Users,
  Calendar,
  Target,
  Zap,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

// ── Episode status helpers ────────────────────────────────────────────────────

type EpisodePlanStatus = 'planned' | 'in_progress' | 'published'

function getEpisodeStatus(
  episodeIndex: number,
  linkedStoryIds?: (string | null)[]
): EpisodePlanStatus {
  if (!linkedStoryIds) return 'planned'
  const storyId = linkedStoryIds[episodeIndex]
  if (!storyId) return 'planned'
  // If we have a story ID, consider it in_progress until we know the status
  // The presence of a linked ID is sufficient signal here
  return 'in_progress'
}

const EPISODE_STATUS_CONFIG: Record<EpisodePlanStatus, { label: string; color: string; dot: string }> = {
  planned: {
    label: 'Planned',
    color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    dot: 'bg-zinc-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  published: {
    label: 'Published',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-white/[0.06] rounded-lg w-3/4" />
          <div className="h-3 bg-white/[0.04] rounded w-1/2" />
          <div className="h-12 bg-white/[0.04] rounded-lg w-full mt-3" />
          <div className="h-10 bg-white/[0.06] rounded-lg w-full mt-2" />
          <div className="h-8 bg-white/[0.03] rounded-lg w-full mt-2" />
        </div>
      </div>
    </div>
  )
}

// ── Episode card ──────────────────────────────────────────────────────────────

function EpisodeCard({
  episode,
  status,
  onGenerateEpisode,
  generating,
}: {
  episode: SeriesBibleEpisode
  status: EpisodePlanStatus
  onGenerateEpisode: (episode: SeriesBibleEpisode) => void
  generating: boolean
}) {
  const toneInfo = EMOTIONAL_TONES.find((t) => t.value === episode.emotional_tone)
  const statusCfg = EPISODE_STATUS_CONFIG[status]

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Episode number badge + tone + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[var(--accent)]">{episode.episode_number}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-snug">{episode.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500">
                {toneInfo?.emoji} {toneInfo?.label}
              </span>
            </div>
          </div>
        </div>
        <span className={`status-badge text-[10px] shrink-0 ${statusCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Premise */}
      <p className="text-sm text-zinc-300 italic mb-4 leading-relaxed">{episode.premise}</p>

      {/* Turning point callout */}
      <div className="rounded-xl bg-[var(--accent)]/[0.08] border border-[var(--accent)]/20 px-4 py-3 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
            Turning Point
          </span>
        </div>
        <p className="text-xs text-zinc-200 leading-relaxed">{episode.turning_point}</p>
      </div>

      {/* Cliffhanger hook strip */}
      <div
        className="rounded-xl px-4 py-3 mb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(109,90,255,0.12), rgba(109,90,255,0.06))',
          border: '1px solid rgba(109,90,255,0.25)',
          boxShadow: '0 0 20px rgba(109,90,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--accent-hover)] uppercase tracking-wider">
            Cliffhanger Hook
          </span>
        </div>
        <p className="text-xs text-white font-medium leading-relaxed">{episode.cliffhanger_hook}</p>
        {/* Subtle glow orb */}
        <div
          className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(109,90,255,0.15), transparent 70%)' }}
        />
      </div>

      {/* Bottom row: audience target chip + season timing */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <Target className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] text-zinc-400">{episode.audience_target}</span>
          </div>
          {episode.season_timing_suggestion && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-500">{episode.season_timing_suggestion}</span>
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={() => onGenerateEpisode(episode)}
          disabled={generating}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent-hover)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="spinner w-3 h-3" />
              Creating…
            </>
          ) : (
            <>
              <ChevronRight className="w-3 h-3" />
              Generate This Episode
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main workspace ────────────────────────────────────────────────────────────

export function SeriesBibleWorkspace({
  character,
  previousEpisodesSummary,
  existingBible,
}: {
  character: Character
  previousEpisodesSummary?: string
  existingBible?: { id: string; episodes: SeriesBibleEpisode[]; linked_story_ids?: (string | null)[] } | null
}) {
  const router = useRouter()

  const [episodes, setEpisodes] = useState<SeriesBibleEpisode[] | null>(
    existingBible?.episodes ?? null
  )
  const [bibleId, setBibleId] = useState<string | null>(existingBible?.id ?? null)
  const [linkedStoryIds, setLinkedStoryIds] = useState<(string | null)[]>(
    existingBible?.linked_story_ids ?? []
  )
  const [loading, setLoading] = useState(false)
  const [generatingEpisodeIndex, setGeneratingEpisodeIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateArc = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-series-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: character.name,
            age: character.age,
            job: character.job,
            backstory: character.backstory,
            physical_description: character.physical_description,
            visual_dna: character.visual_dna,
          },
          character_id: character.id,
          previous_episodes_summary: previousEpisodesSummary,
          episode_count: 6,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Generation failed')
      }

      const data = await res.json()
      setEpisodes(data.episodes)
      if (data.bible_id) {
        setBibleId(data.bible_id)
        setLinkedStoryIds(new Array(data.episodes.length).fill(null))
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [character, previousEpisodesSummary])

  // Auto-generate on first load if no existing bible
  const [initialized, setInitialized] = useState(false)
  if (!initialized) {
    setInitialized(true)
    if (!episodes) {
      generateArc()
    }
  }

  async function handleGenerateEpisode(episode: SeriesBibleEpisode) {
    setGeneratingEpisodeIndex(episode.episode_number - 1)
    try {
      const res = await fetch('/api/create-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: character.id,
          emotional_tone: episode.emotional_tone,
          preset_hook: episode.premise,
        }),
      })
      const data = await res.json()

      const storyId = data.story_id ?? `new-${Date.now()}`

      // Update linked story IDs in state
      const newLinked = [...linkedStoryIds]
      while (newLinked.length < 6) newLinked.push(null)
      newLinked[episode.episode_number - 1] = storyId
      setLinkedStoryIds(newLinked)

      // Update in DB if we have a bible_id
      if (bibleId) {
        fetch('/api/update-series-bible-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bible_id: bibleId, linked_story_ids: newLinked }),
        }).catch(() => {/* best-effort */})
      }

      router.push(`/story/${storyId}`)
    } catch {
      setGeneratingEpisodeIndex(null)
    }
  }

  function handleExportBible() {
    if (!episodes) return

    const text = episodes
      .map((ep) => {
        const tone = EMOTIONAL_TONES.find((t) => t.value === ep.emotional_tone)
        return [
          `═══════════════════════════`,
          `EPISODE ${ep.episode_number}: ${ep.title}`,
          `Tone: ${tone?.label ?? ep.emotional_tone}`,
          ``,
          `Premise: ${ep.premise}`,
          ``,
          `Turning Point: ${ep.turning_point}`,
          ``,
          `Cliffhanger Hook: ${ep.cliffhanger_hook}`,
          ``,
          `Target Audience: ${ep.audience_target}`,
          ep.season_timing_suggestion ? `Timing: ${ep.season_timing_suggestion}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n\n')

    const fullText = `SERIES BIBLE — ${character.name}\n${'═'.repeat(30)}\n\n${text}`

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={`/characters/${character.id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {character.name}
      </Link>

      {/* Header */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Your 6-Episode Arc</h1>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-sm text-zinc-400">{character.name}</p>
              </div>
              {character.visual_dna && (
                <p className="text-xs text-zinc-600 mt-1 max-w-sm truncate">{character.visual_dna}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportBible}
              disabled={!episodes || loading}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Export Bible
                </>
              )}
            </button>
            <button
              onClick={generateArc}
              disabled={loading}
              className="btn-accent flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Generating…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Arc
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card border-red-500/30 p-4 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Connecting line — hidden on mobile */}
        {!loading && episodes && (
          <div
            className="absolute left-[1.25rem] top-10 bottom-10 w-px hidden md:block"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(109,90,255,0.3) 10%, rgba(109,90,255,0.3) 90%, transparent)',
            }}
          />
        )}

        <div className="space-y-4">
          {loading || !episodes
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : episodes.map((episode, index) => {
                const status = getEpisodeStatus(index, linkedStoryIds)
                return (
                  <div key={episode.episode_number} className="relative md:pl-10">
                    {/* Timeline dot — hidden on mobile */}
                    <div
                      className="absolute left-0 top-6 w-2.5 h-2.5 rounded-full border-2 border-[var(--background)] hidden md:block"
                      style={{ background: 'rgba(109,90,255,0.7)' }}
                    />
                    <EpisodeCard
                      episode={episode}
                      status={status}
                      onGenerateEpisode={handleGenerateEpisode}
                      generating={generatingEpisodeIndex === index}
                    />
                  </div>
                )
              })}
        </div>
      </div>
    </div>
  )
}
