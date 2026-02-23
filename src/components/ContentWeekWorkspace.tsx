'use client'

import { useState, useRef, useCallback } from 'react'
import { EmotionalTone, EMOTIONAL_TONES } from '@/lib/types'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Zap,
  Download,
  RefreshCw,
  Trash2,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToneMix = 'varied' | 'emotional_only' | 'light'

type CardStatus =
  | 'idle'
  | 'character_pending'
  | 'character_done'
  | 'story_pending'
  | 'ready'
  | 'error'

type CharacterData = {
  name: string
  age: number
  job: string
  backstory: string
  physical_description: string
  personality_traits: string[]
  reason_never_exercised: string
}

type SceneData = {
  description: string
  emotional_beat: string
  visual_prompt: string
}

type StoryCard = {
  id: string
  dayIndex: number
  status: CardStatus
  character: CharacterData | null
  storyId: string | null
  sceneCount: number
  emotionalTone: EmotionalTone
  progress: number
  error: string | null
  scenes: SceneData[] | null
  sceneIds: string[]
  imageUrls: (string | null)[]
  imageGenerating: boolean
}

type WorkspacePhase = 'configuring' | 'generating' | 'reviewing' | 'imaging'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const TONE_EMOJI: Record<EmotionalTone, string> = {
  comeback: '🔥',
  revenge: '💪',
  quiet_transformation: '🌅',
  rock_bottom: '⬇️',
  against_all_odds: '🏆',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assignTones(toneMix: ToneMix, count: number): EmotionalTone[] {
  const pools: Record<ToneMix, EmotionalTone[]> = {
    varied: ['comeback', 'revenge', 'quiet_transformation', 'rock_bottom', 'against_all_odds'],
    emotional_only: ['rock_bottom', 'against_all_odds'],
    light: ['comeback', 'quiet_transformation'],
  }
  const pool = pools[toneMix]
  return Array.from({ length: count }, (_, i) => pool[i % pool.length])
}

function cardProgress(status: CardStatus): number {
  switch (status) {
    case 'idle': return 0
    case 'character_pending': return 25
    case 'character_done': return 50
    case 'story_pending': return 75
    case 'ready': return 100
    case 'error': return 0
    default: return 0
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToneDiversityRow({ cards }: { cards: StoryCard[] }) {
  const tonesPresent = Array.from(new Set(cards.map((c) => c.emotionalTone)))
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500">This week:</span>
      {EMOTIONAL_TONES.map((t) => {
        const present = tonesPresent.includes(t.value)
        return (
          <span
            key={t.value}
            title={t.label}
            className={`text-lg transition-opacity ${present ? 'opacity-100' : 'opacity-20'}`}
          >
            {t.emoji}
          </span>
        )
      })}
    </div>
  )
}

function StoryCardView({
  card,
  dayLabel,
  phase,
  onDelete,
  onReplace,
  onRetry,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  card: StoryCard
  dayLabel: string
  phase: WorkspacePhase
  onDelete: () => void
  onReplace: () => void
  onRetry: () => void
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  const isReviewing = phase === 'reviewing'
  const isImaging = phase === 'imaging'
  const progress = cardProgress(card.status)
  const allImagesReady = card.imageUrls.length > 0 && card.imageUrls.every((u) => u !== null)

  return (
    <div
      draggable={isReviewing}
      onDragStart={isReviewing ? onDragStart : undefined}
      onDragOver={isReviewing ? onDragOver : undefined}
      onDrop={isReviewing ? onDrop : undefined}
      className={`glass-card p-4 flex flex-col gap-3 transition-all ${isDragging ? 'opacity-40 scale-95' : ''} ${isReviewing ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isReviewing && (
            <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />
          )}
          <span className="text-sm font-semibold text-zinc-200">{dayLabel}</span>
        </div>
        <span
          className="status-badge text-[10px]"
          style={{
            background: `${getToneColor(card.emotionalTone)}20`,
            color: getToneColor(card.emotionalTone),
            borderColor: `${getToneColor(card.emotionalTone)}40`,
          }}
        >
          {TONE_EMOJI[card.emotionalTone]} {card.emotionalTone.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Status body */}
      {card.status === 'idle' && (
        <div className="h-16 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-zinc-800 animate-pulse" />
        </div>
      )}

      {card.status === 'character_pending' && (
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-zinc-800 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-zinc-800 animate-pulse" />
          <p className="text-[11px] text-zinc-500 mt-1">Generating character...</p>
        </div>
      )}

      {(card.status === 'character_done' || card.status === 'story_pending') && card.character && (
        <div className="space-y-1">
          <p className="font-semibold text-white text-sm">{card.character.name}</p>
          <p className="text-xs text-zinc-400">{card.character.age}yo · {card.character.job}</p>
          {card.status === 'story_pending' && (
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating scenes...
            </p>
          )}
        </div>
      )}

      {card.status === 'ready' && card.character && (
        <div className="space-y-1">
          <p className="font-semibold text-white text-sm">{card.character.name}</p>
          <p className="text-xs text-zinc-400">{card.character.age}yo · {card.character.job}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="status-badge bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
              {card.sceneCount} scenes
            </span>
            {(isImaging || allImagesReady) && (
              <span className={`status-badge text-[10px] ${allImagesReady ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                {allImagesReady ? '✓ Images ready' : card.imageGenerating ? 'Generating...' : `${card.imageUrls.filter(Boolean).length}/${card.sceneCount} images`}
              </span>
            )}
          </div>
          {card.imageGenerating && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating images...
            </div>
          )}
        </div>
      )}

      {card.status === 'error' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{card.error || 'Generation failed'}</p>
          </div>
          <button
            onClick={onRetry}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry this card
          </button>
        </div>
      )}

      {/* Progress bar */}
      {card.status !== 'error' && (
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background:
                card.status === 'ready' ? '#22c55e' : 'var(--accent)',
            }}
          />
        </div>
      )}

      {/* Reviewing actions */}
      {isReviewing && card.status === 'ready' && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={onReplace}
            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 flex-1"
          >
            <RefreshCw className="w-3 h-3" />
            Replace
          </button>
          <button
            onClick={onDelete}
            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function getToneColor(tone: EmotionalTone): string {
  const colors: Record<EmotionalTone, string> = {
    comeback: '#f97316',
    revenge: '#a855f7',
    quiet_transformation: '#06b6d4',
    rock_bottom: '#ef4444',
    against_all_odds: '#eab308',
  }
  return colors[tone] || '#6d5aff'
}

// ─── Main Workspace ───────────────────────────────────────────────────────────

export function ContentWeekWorkspace() {
  const [phase, setPhase] = useState<WorkspacePhase>('configuring')
  const [count, setCount] = useState<3 | 5 | 7>(5)
  const [toneMix, setToneMix] = useState<ToneMix>('varied')
  const [avoidRepeatJobs, setAvoidRepeatJobs] = useState(true)
  const [cards, setCards] = useState<StoryCard[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [allImagesComplete, setAllImagesComplete] = useState(false)

  const updateCard = useCallback((id: string, updates: Partial<StoryCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  // ── Step 2: Generation ────────────────────────────────────────────────────

  async function generateSingleCard(cardId: string, tone: EmotionalTone): Promise<void> {
    updateCard(cardId, { status: 'character_pending', progress: 25, error: null })

    let character: CharacterData | null = null
    let storyId: string | null = null

    try {
      const charRes = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      })
      const charData = await charRes.json()

      if (!charRes.ok) throw new Error(charData.error || 'Character generation failed')

      character = charData.character as CharacterData
      storyId = charData.id as string

      updateCard(cardId, {
        character,
        storyId,
        status: 'character_done',
        progress: 50,
      })
    } catch (err) {
      updateCard(cardId, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Character generation failed',
        progress: 0,
      })
      return
    }

    updateCard(cardId, { status: 'story_pending', progress: 75 })

    try {
      const storyRes = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          emotional_tone: tone,
          story_id: storyId,
        }),
      })
      const storyData = await storyRes.json()

      if (!storyRes.ok) throw new Error(storyData.error || 'Story generation failed')

      const scenes: SceneData[] = storyData.scenes || []
      const sceneIds: string[] = storyData.scene_ids || []

      updateCard(cardId, {
        status: 'ready',
        progress: 100,
        scenes,
        sceneCount: scenes.length,
        sceneIds,
      })
    } catch (err) {
      updateCard(cardId, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Story generation failed',
        progress: 0,
      })
    }
  }

  async function handleGenerate() {
    const tones = assignTones(toneMix, count)

    const initCards: StoryCard[] = tones.map((tone, i) => ({
      id: `card-${i}-${Date.now()}`,
      dayIndex: i,
      status: 'idle',
      character: null,
      storyId: null,
      sceneCount: 0,
      emotionalTone: tone,
      progress: 0,
      error: null,
      scenes: null,
      sceneIds: [],
      imageUrls: [],
      imageGenerating: false,
    }))

    setCards(initCards)
    setPhase('generating')
    setAllImagesComplete(false)

    // Phase A: all character generations concurrently
    const charPromises = initCards.map(async (card) => {
      updateCard(card.id, { status: 'character_pending', progress: 25 })

      try {
        const res = await fetch('/api/generate-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tone: card.emotionalTone }),
        })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error || 'Failed')

        updateCard(card.id, {
          character: data.character as CharacterData,
          storyId: data.id as string,
          status: 'character_done',
          progress: 50,
        })

        return { cardId: card.id, character: data.character as CharacterData, storyId: data.id as string, ok: true }
      } catch (err) {
        updateCard(card.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Character generation failed',
          progress: 0,
        })
        return { cardId: card.id, ok: false }
      }
    })

    const charResults = await Promise.allSettled(charPromises)

    // Phase B: all story arc generations concurrently (only for successful characters)
    const storyPromises = charResults.map(async (settled, i) => {
      if (settled.status === 'rejected') return
      const result = await settled.value
      if (!result.ok) return

      const card = initCards[i]
      updateCard(card.id, { status: 'story_pending', progress: 75 })

      try {
        const res = await fetch('/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: result.character,
            emotional_tone: card.emotionalTone,
            story_id: result.storyId,
          }),
        })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error || 'Failed')

        const scenes: SceneData[] = data.scenes || []
        const sceneIds: string[] = data.scene_ids || []

        updateCard(card.id, {
          status: 'ready',
          progress: 100,
          scenes,
          sceneCount: scenes.length,
          sceneIds,
        })
      } catch (err) {
        updateCard(card.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Story generation failed',
          progress: 0,
        })
      }
    })

    await Promise.allSettled(storyPromises)

    // Transition to reviewing if at least one card succeeded
    setCards((prev) => {
      const hasReady = prev.some((c) => c.status === 'ready')
      if (hasReady) {
        setPhase('reviewing')
      }
      return prev
    })
  }

  // ── Step 2: Replace card ──────────────────────────────────────────────────

  async function handleReplaceCard(cardId: string) {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    updateCard(cardId, {
      character: null,
      storyId: null,
      scenes: null,
      sceneIds: [],
      sceneCount: 0,
      imageUrls: [],
      imageGenerating: false,
      error: null,
    })

    await generateSingleCard(cardId, card.emotionalTone)
  }

  // ── Drag to swap ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, cardId: string) {
    e.dataTransfer.setData('cardId', cardId)
    setDraggedId(cardId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('cardId')
    if (!sourceId || sourceId === targetId) {
      setDraggedId(null)
      return
    }

    setCards((prev) => {
      const srcIdx = prev.findIndex((c) => c.id === sourceId)
      const tgtIdx = prev.findIndex((c) => c.id === targetId)
      if (srcIdx === -1 || tgtIdx === -1) return prev

      const next = [...prev]
      // Swap dayIndex values
      const srcDay = next[srcIdx].dayIndex
      next[srcIdx] = { ...next[srcIdx], dayIndex: next[tgtIdx].dayIndex }
      next[tgtIdx] = { ...next[tgtIdx], dayIndex: srcDay }

      // Re-sort by dayIndex
      return [...next].sort((a, b) => a.dayIndex - b.dayIndex)
    })

    setDraggedId(null)
  }

  function handleDeleteCard(cardId: string) {
    setCards((prev) => {
      const filtered = prev.filter((c) => c.id !== cardId)
      // Re-index dayIndex
      return filtered.map((c, i) => ({ ...c, dayIndex: i }))
    })
  }

  // ── Step 4: Generate all images ────────────────────────────────────────────

  async function handleGenerateAllImages() {
    setPhase('imaging')

    const readyCards = cards.filter(
      (c) => c.status === 'ready' && c.scenes && c.sceneIds.length > 0
    )

    if (readyCards.length === 0) {
      // No scene IDs — skip image generation
      setAllImagesComplete(true)
      return
    }

    await Promise.allSettled(
      readyCards.map(async (card) => {
        updateCard(card.id, { imageGenerating: true })

        try {
          const visualPrompts = card.scenes!.map((s) => s.visual_prompt)
          const res = await fetch('/api/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visual_prompts: visualPrompts,
              character_physical: card.character?.physical_description || '',
              scene_ids: card.sceneIds,
            }),
          })
          const data = await res.json()

          if (!res.ok) throw new Error(data.error || 'Image generation failed')

          const urls: (string | null)[] = (data.images || []).map(
            (img: { image_url: string | null }) => img.image_url
          )

          updateCard(card.id, { imageUrls: urls, imageGenerating: false })
        } catch {
          updateCard(card.id, { imageGenerating: false })
        }
      })
    )

    setAllImagesComplete(true)
  }

  // ── Download week pack ────────────────────────────────────────────────────

  async function handleDownloadPack() {
    setIsDownloading(true)

    const storiesPayload = cards
      .filter((c) => c.status === 'ready' && c.character)
      .map((c, i) => ({
        dayLabel: DAYS[c.dayIndex] || DAYS[i],
        characterName: c.character!.name,
        characterAge: c.character!.age,
        characterJob: c.character!.job,
        emotionalTone: c.emotionalTone,
        scenes: c.scenes || [],
        imageUrls: c.imageUrls.filter((u): u is string => u !== null),
      }))

    try {
      const res = await fetch('/api/export-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories: storiesPayload }),
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `content_week_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const readyCards = cards.filter((c) => c.status === 'ready')
  const errorCards = cards.filter((c) => c.status === 'error')
  const allReady = cards.length > 0 && cards.every((c) => c.status === 'ready' || c.status === 'error')
  const hasSceneIds = readyCards.some((c) => c.sceneIds.length > 0)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fade-in">
      {/* Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Page header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Content Week Generator</h1>
        </div>
        <p className="text-zinc-400 text-sm ml-[3.25rem]">
          Generate a full week of UGC stories in one batch. Parallel generation, drag-to-reorder, and one-click image export.
        </p>
      </header>

      {/* ── Step 1: Config ── */}
      {phase === 'configuring' && (
        <div className="glass-card p-6 max-w-xl fade-in">
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent/20 text-[var(--accent)] text-xs flex items-center justify-center font-bold">1</span>
            Week Configuration
          </h2>

          {/* Count selector */}
          <div className="mb-5">
            <label className="text-sm text-zinc-400 mb-2 block">Number of stories</label>
            <div className="flex gap-2">
              {([3, 5, 7] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    count === n
                      ? 'bg-accent/20 border-[var(--accent)] text-white'
                      : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Tone mix */}
          <div className="mb-5">
            <label className="text-sm text-zinc-400 mb-2 block">Tone mix strategy</label>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: 'varied', label: 'Varied', desc: 'Auto-mix all 5 emotional tones' },
                  { value: 'emotional_only', label: 'Emotional only', desc: 'Rock Bottom + Against All Odds' },
                  { value: 'light', label: 'Light', desc: 'Comeback + Quiet Transformation' },
                ] as { value: ToneMix; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setToneMix(opt.value)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all text-left ${
                    toneMix === opt.value
                      ? 'bg-accent/20 border-[var(--accent)] text-white'
                      : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-zinc-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Job diversity */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setAvoidRepeatJobs((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  avoidRepeatJobs ? 'bg-[var(--accent)]' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    avoidRepeatJobs ? 'translate-x-5' : ''
                  }`}
                />
              </div>
              <span className="text-sm text-zinc-300">Avoid repeating professions</span>
            </label>
          </div>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            className="btn-accent flex items-center gap-2 w-full justify-center"
          >
            <Zap className="w-4 h-4" />
            Generate {count} Stories
          </button>
        </div>
      )}

      {/* ── Steps 2 & 3: Kanban board (generating + reviewing) ── */}
      {(phase === 'generating' || phase === 'reviewing' || phase === 'imaging') && cards.length > 0 && (
        <div className="fade-in">
          {/* Phase header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold">
                {phase === 'generating' && 'Generating stories...'}
                {phase === 'reviewing' && 'Review your week'}
                {phase === 'imaging' && 'Generating images...'}
              </h2>
              {phase === 'reviewing' && (
                <p className="text-xs text-zinc-500 mt-0.5">Drag to reorder days · Delete or replace individual stories</p>
              )}
            </div>

            {/* Tone diversity indicator (reviewing / imaging) */}
            {(phase === 'reviewing' || phase === 'imaging') && (
              <ToneDiversityRow cards={readyCards} />
            )}
          </div>

          {/* Error summary */}
          {phase === 'generating' && errorCards.length > 0 && (
            <div className="glass-card p-3 mb-4 flex items-center gap-2 border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{errorCards.length} card(s) failed. Use &quot;Retry this card&quot; on each.</p>
            </div>
          )}

          {/* Kanban board */}
          <div className="overflow-x-auto pb-4">
            {/* Desktop: horizontal columns */}
            <div className="hidden md:grid gap-4" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(200px, 1fr))` }}>
              {cards.map((card) => (
                <StoryCardView
                  key={card.id}
                  card={card}
                  dayLabel={DAYS[card.dayIndex] || `Day ${card.dayIndex + 1}`}
                  phase={phase}
                  onDelete={() => handleDeleteCard(card.id)}
                  onReplace={() => handleReplaceCard(card.id)}
                  onRetry={() => handleReplaceCard(card.id)}
                  isDragging={draggedId === card.id}
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, card.id)}
                />
              ))}
            </div>

            {/* Mobile: vertical list with reorder handles on right */}
            <div className="flex md:hidden flex-col gap-3">
              {cards.map((card) => (
                <div key={card.id} className="relative">
                  <StoryCardView
                    card={card}
                    dayLabel={DAYS[card.dayIndex] || `Day ${card.dayIndex + 1}`}
                    phase={phase}
                    onDelete={() => handleDeleteCard(card.id)}
                    onReplace={() => handleReplaceCard(card.id)}
                    onRetry={() => handleReplaceCard(card.id)}
                    isDragging={draggedId === card.id}
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, card.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Step 3 actions ── */}
          {phase === 'reviewing' && readyCards.length > 0 && (
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGenerateAllImages}
                className="btn-accent flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Generate All Images ({readyCards.length} stories)
              </button>
              {!hasSceneIds && (
                <p className="text-xs text-zinc-500">Note: scene IDs unavailable — image generation requires Supabase</p>
              )}
            </div>
          )}

          {/* ── Generating: transition to review when all done ── */}
          {phase === 'generating' && allReady && readyCards.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setPhase('reviewing')}
                className="btn-accent flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Review Week ({readyCards.length} ready)
              </button>
            </div>
          )}

          {/* ── Step 4: Download pack ── */}
          {phase === 'imaging' && allImagesComplete && (
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <button
                onClick={handleDownloadPack}
                disabled={isDownloading}
                className="btn-accent flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Packaging...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Week Pack
                  </>
                )}
              </button>
              <p className="text-xs text-zinc-500">
                ZIP with one folder per day, images + caption.txt
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
