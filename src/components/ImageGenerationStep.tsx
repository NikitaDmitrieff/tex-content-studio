'use client'

import { useState } from 'react'
import { Story, Scene } from '@/lib/types'
import {
  ImageIcon,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

type GenerationStatus = 'idle' | 'generating' | 'done' | 'error'

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

  async function generateImages(sceneIndices: number[]) {
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

  async function handleRegenerateSingle(index: number) {
    await generateImages([index])
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

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene, index) => {
          const status = statuses[scene.id] || 'idle'

          return (
            <div key={scene.id} className="glass-card overflow-hidden">
              {/* Image preview area */}
              <div className="tiktok-preview relative">
                {scene.image_url ? (
                  <img
                    src={scene.image_url}
                    alt={`Scene ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
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
                        <span className="text-xs text-red-400">Failed</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                        <span className="text-xs text-zinc-600">No image</span>
                      </>
                    )}
                  </div>
                )}

                {/* Text overlay on image — TikTok carousel style */}
                {scene.description && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-5 pt-16">
                    <p className="text-white text-sm font-semibold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {scene.description}
                    </p>
                  </div>
                )}

                {/* Status overlay */}
                {status === 'done' && scene.image_url && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Scene number */}
                <div className="absolute top-3 left-3">
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
                  title="Regenerate this image"
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
