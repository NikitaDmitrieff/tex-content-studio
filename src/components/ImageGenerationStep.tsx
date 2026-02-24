'use client'

import { useState, useRef, useCallback } from 'react'
import { Story, Scene } from '@/lib/types'
import {
  ImageIcon,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
  Send,
  Type,
  GripVertical,
} from 'lucide-react'

type GenerationStatus = 'idle' | 'generating' | 'done' | 'error'

const DEFAULT_TEXT_POSITION = 85 // percentage from top

export function ImageGenerationStep({
  story,
  scenes,
  visualDna,
  onScenesUpdate,
  swipeScore,
}: {
  story: Story
  scenes: Scene[]
  visualDna?: string | null
  onScenesUpdate: (scenes: Scene[]) => void
  swipeScore?: number | null
}) {
  const [statuses, setStatuses] = useState<Record<string, GenerationStatus>>(() => {
    const initial: Record<string, GenerationStatus> = {}
    scenes.forEach((s) => {
      initial[s.id] = s.image_url ? 'done' : 'idle'
    })
    return initial
  })
  const [generatingAll, setGeneratingAll] = useState(false)
  const [warningDismissed, setWarningDismissed] = useState(false)
  const [directingIndex, setDirectingIndex] = useState<number | null>(null)
  const [customDirection, setCustomDirection] = useState('')
  const [draggingSceneId, setDraggingSceneId] = useState<string | null>(null)

  async function generateImages(sceneIndices: number[], directions?: (string | null)[]) {
    const scenesToGenerate = sceneIndices.map((i) => scenes[i])

    const newStatuses = { ...statuses }
    scenesToGenerate.forEach((s) => {
      newStatuses[s.id] = 'generating'
    })
    setStatuses(newStatuses)

    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visual_prompts: scenesToGenerate.map((s) => s.visual_prompt),
          character_physical: story.character_physical,
          scene_ids: scenesToGenerate.map((s) => s.id),
          ...(visualDna ? { visual_dna: visualDna } : {}),
          ...(directions ? { custom_directions: directions } : {}),
        }),
      })
      const data = await res.json()

      if (data.images && Array.isArray(data.images)) {
        const updatedScenes = [...scenes]
        const updatedStatuses = { ...newStatuses }

        data.images.forEach(
          (img: { scene_id: string; image_url: string | null; error?: string }) => {
            const sceneIdx = updatedScenes.findIndex((s) => s.id === img.scene_id)
            if (sceneIdx !== -1) {
              if (img.image_url) {
                updatedScenes[sceneIdx] = {
                  ...updatedScenes[sceneIdx],
                  image_url: img.image_url,
                }
                updatedStatuses[img.scene_id] = 'done'
              } else {
                updatedStatuses[img.scene_id] = 'error'
              }
            }
          }
        )

        onScenesUpdate(updatedScenes)
        setStatuses(updatedStatuses)
      } else {
        const updatedStatuses = { ...newStatuses }
        scenesToGenerate.forEach((s) => {
          updatedStatuses[s.id] = 'error'
        })
        setStatuses(updatedStatuses)
      }
    } catch (err) {
      console.error('Failed to generate images:', err)
      const updatedStatuses = { ...newStatuses }
      scenesToGenerate.forEach((s) => {
        updatedStatuses[s.id] = 'error'
      })
      setStatuses(updatedStatuses)
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true)
    const indices = scenes.map((_, i) => i)
    await generateImages(indices)
    setGeneratingAll(false)
  }

  async function handleRegenerateSingle(index: number, direction?: string) {
    await generateImages([index], direction ? [direction] : undefined)
  }

  function handleImageClick(index: number) {
    setDirectingIndex(index)
    setCustomDirection('')
  }

  function handleDirectSubmit() {
    if (directingIndex === null) return
    const dir = customDirection.trim() || undefined
    handleRegenerateSingle(directingIndex, dir)
    setDirectingIndex(null)
    setCustomDirection('')
  }

  function handleDirectCancel() {
    setDirectingIndex(null)
    setCustomDirection('')
  }

  function updateTextPosition(sceneIndex: number, position: number) {
    const updated = [...scenes]
    updated[sceneIndex] = { ...updated[sceneIndex], text_position: position }
    onScenesUpdate(updated)
  }

  const allDone = scenes.every((s) => statuses[s.id] === 'done')
  const anyGenerating = Object.values(statuses).some((s) => s === 'generating')
  const doneCount = Object.values(statuses).filter((s) => s === 'done').length

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Image Generation</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {doneCount}/{scenes.length} images generated
            {' '}<span className="text-zinc-600">— drag text to reposition, click image to re-roll</span>
          </p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generatingAll || anyGenerating}
          className="btn-accent flex items-center gap-2"
        >
          {generatingAll ? (
            <>
              <div className="spinner" />
              <span>Generating All...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{allDone ? 'Regenerate All' : 'Generate All Images'}</span>
            </>
          )}
        </button>
      </div>

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

      {/* Progress bar */}
      {anyGenerating && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Generation progress</span>
            <span className="text-xs text-[var(--accent)]">
              {doneCount}/{scenes.length}
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 pulse-glow"
              style={{ width: `${(doneCount / scenes.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Direction modal */}
      {directingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Re-generate Scene {directingIndex + 1}
              </h3>
              <button onClick={handleDirectCancel} className="p-1 rounded-lg hover:bg-white/10 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current image preview — full view, scrollable if tall */}
            {scenes[directingIndex]?.image_url && (
              <div className="rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                <img
                  src={scenes[directingIndex].image_url!}
                  alt={`Scene ${directingIndex + 1}`}
                  className="w-full h-auto"
                />
              </div>
            )}

            <p className="text-sm text-zinc-400">
              {scenes[directingIndex]?.visual_prompt}
            </p>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Custom direction (optional)</label>
              <textarea
                value={customDirection}
                onChange={(e) => setCustomDirection(e.target.value)}
                placeholder="e.g. &quot;darker room, more tired expression&quot; or &quot;standing outside, nighttime&quot;..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--accent)]/50 resize-none"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleDirectSubmit()
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDirectSubmit}
                className="btn-accent flex-1 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {customDirection.trim() ? 'Regenerate with direction' : 'Regenerate'}
              </button>
              <button
                onClick={handleDirectCancel}
                className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene, index) => {
          const status = statuses[scene.id] || 'idle'
          const textPos = scene.text_position ?? DEFAULT_TEXT_POSITION

          return (
            <div key={scene.id} className="glass-card overflow-hidden">
              {/* Image preview area */}
              <div
                className="tiktok-preview relative cursor-pointer group"
                onClick={(e) => {
                  // Don't trigger image click if user clicked the overlay controls
                  if ((e.target as HTMLElement).closest('[data-overlay-control]')) return
                  if (status !== 'generating') handleImageClick(index)
                }}
              >
                {scene.image_url ? (
                  <>
                    <img
                      src={scene.image_url}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    {status !== 'generating' && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                          <RefreshCw className="w-4 h-4 text-white" />
                          <span className="text-sm text-white font-medium">Click to re-direct</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    {status === 'generating' ? (
                      <>
                        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
                        <span className="text-xs text-zinc-500">Generating...</span>
                      </>
                    ) : status === 'error' ? (
                      <>
                        <ImageIcon className="w-8 h-8 text-red-500/50" />
                        <span className="text-xs text-red-400">Failed — click to retry</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                        <span className="text-xs text-zinc-600">Click to generate</span>
                      </>
                    )}
                  </div>
                )}

                {/* Draggable text overlay */}
                {scene.description && (
                  <DraggableTextOverlay
                    text={scene.description}
                    position={textPos}
                    isDragging={draggingSceneId === scene.id}
                    onDragStart={() => setDraggingSceneId(scene.id)}
                    onDragEnd={() => setDraggingSceneId(null)}
                    onPositionChange={(pos) => updateTextPosition(index, pos)}
                    onRegenerateText={(e) => {
                      e.stopPropagation()
                      handleRegenerateSingle(index)
                    }}
                  />
                )}

                {/* Status overlay */}
                {status === 'done' && scene.image_url && (
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Scene number */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Scene meta */}
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-zinc-600">{scene.emotional_beat}</span>
                <button
                  onClick={() => handleRegenerateSingle(index)}
                  disabled={status === 'generating'}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
                  title="Quick regenerate (no direction)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${status === 'generating' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

// ── Draggable text overlay component ──────────────────────────────────────────

function DraggableTextOverlay({
  text,
  position,
  isDragging,
  onDragStart,
  onDragEnd,
  onPositionChange,
  onRegenerateText,
}: {
  text: string
  position: number // 0-100
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onPositionChange: (pos: number) => void
  onRegenerateText: (e: React.MouseEvent) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number>(0)
  const dragStartPos = useRef<number>(0)

  const clampPosition = (pos: number) => Math.max(10, Math.min(95, pos))

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current?.parentElement
      if (!container) return

      dragStartY.current = e.clientY
      dragStartPos.current = position

      onDragStart()

      const handlePointerMove = (ev: PointerEvent) => {
        const rect = container.getBoundingClientRect()
        const deltaY = ev.clientY - dragStartY.current
        const deltaPct = (deltaY / rect.height) * 100
        const newPos = clampPosition(dragStartPos.current + deltaPct)
        onPositionChange(Math.round(newPos))
      }

      const handlePointerUp = () => {
        onDragEnd()
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [position, onDragStart, onDragEnd, onPositionChange]
  )

  // Calculate gradient position based on text position
  const gradTop = Math.max(0, position - 20)

  return (
    <div ref={containerRef} data-overlay-control>
      {/* Gradient background that follows the text */}
      <div
        className="absolute inset-x-0 pointer-events-none transition-all duration-100"
        style={{
          top: `${gradTop}%`,
          bottom: 0,
          background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.8) 100%)`,
          maxHeight: `${100 - gradTop}%`,
        }}
      />

      {/* Text + controls */}
      <div
        className="absolute inset-x-0 flex items-start gap-1.5 px-3 transition-all duration-100"
        style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
        data-overlay-control
      >
        {/* Drag handle */}
        <button
          className={`shrink-0 mt-0.5 p-0.5 rounded cursor-grab active:cursor-grabbing touch-none ${
            isDragging
              ? 'text-white/80 bg-white/10'
              : 'text-white/30 hover:text-white/60'
          }`}
          onPointerDown={handlePointerDown}
          data-overlay-control
          title="Drag to reposition text"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Text */}
        <p className="flex-1 text-white text-sm font-semibold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {text}
        </p>

        {/* Regenerate text button */}
        <button
          className="shrink-0 mt-0.5 p-1 rounded-md text-white/30 hover:text-white/80 hover:bg-white/10 transition-colors"
          onClick={onRegenerateText}
          data-overlay-control
          title="Regenerate text"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
