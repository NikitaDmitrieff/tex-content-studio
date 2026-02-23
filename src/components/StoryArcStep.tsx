'use client'

import { useState } from 'react'
import { Story, Scene, ScanResult, ScreeningResult, SwipeMomentumResult } from '@/lib/types'
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Trash2,
  PlusCircle,
  Sparkles,
  Pencil,
  X,
  Check,
  Clapperboard,
  Activity,
} from 'lucide-react'
import { AuthenticityScanner } from './AuthenticityScanner'
import { AudienceScreeningRoom } from './AudienceScreeningRoom'
import { SwipeMomentumPanel } from './SwipeMomentumPanel'
import { FormatAdapterPanel } from './FormatAdapterPanel'
import { ArcOverlay } from './ArcOverlay'

export function StoryArcStep({
  story,
  scenes,
  onScenesUpdate,
  onBack,
  onContinue,
  onScreeningComplete,
  onSwipeAnalysisComplete,
}: {
  story: Story
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  onBack: () => void
  onContinue: () => void
  onScreeningComplete?: (result: ScreeningResult) => void
  onSwipeAnalysisComplete?: (result: SwipeMomentumResult | null) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Scene>>({})
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null)
  const [showScreeningRoom, setShowScreeningRoom] = useState(false)
  const [screeningLoading, setScreeningLoading] = useState(false)
  const [swipeMomentumResult, setSwipeMomentumResult] = useState<SwipeMomentumResult | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    try {
      let previousEpisodesSummary: string | undefined

      if (story.character_id) {
        try {
          const prevRes = await fetch(
            `/api/character-episodes?character_id=${story.character_id}&exclude_story_id=${story.id}`
          )
          if (prevRes.ok) {
            const prevData = await prevRes.json()
            previousEpisodesSummary = prevData.summary
          }
        } catch {
          // previous episodes summary is optional — continue without it
        }
      }

      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: story.character_name,
            age: story.character_age,
            job: story.character_job,
            backstory: story.character_backstory,
            physical_description: story.character_physical,
          },
          emotional_tone: story.emotional_tone,
          story_id: story.id,
          character_id: story.character_id ?? undefined,
          previous_episodes_summary: previousEpisodesSummary,
          reality_anchors: story.reality_anchors ?? undefined,
          heartbeat_arc: story.heartbeat_arc ?? undefined,
          arc_template_used: story.arc_template_used ?? undefined,
        }),
      })
      const data = await res.json()

      if (data.scenes && Array.isArray(data.scenes)) {
        const newScenes: Scene[] = data.scenes.map(
          (s: { description: string; emotional_beat: string; visual_prompt: string }, i: number) => ({
            id: `scene-${Date.now()}-${i}`,
            story_id: story.id,
            order_index: i,
            description: s.description,
            emotional_beat: s.emotional_beat,
            visual_prompt: s.visual_prompt,
            image_url: null,
            caption: null,
            created_at: new Date().toISOString(),
          })
        )
        onScenesUpdate(newScenes)

        // Auto-run authenticity scan for reality-grounded stories
        if (story.is_reality_grounded && newScenes.length > 0) {
          try {
            const scanRes = await fetch('/api/scan-authenticity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scenes: newScenes.map((s) => ({
                  description: s.description,
                  emotional_beat: s.emotional_beat,
                })),
                language: 'en',
              }),
            })
            const scanData = await scanRes.json()
            if (scanData.results) {
              setScanResults(scanData.results)
            }
          } catch {
            // auto-scan is optional — ignore errors
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate scenes:', err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleScreenStory() {
    setScreeningLoading(true)
    setShowScreeningRoom(true)
    try {
      const res = await fetch('/api/screen-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenes.map((s) => ({ description: s.description, emotional_beat: s.emotional_beat })),
          character_name: story.character_name,
          character_job: story.character_job,
          character_age: story.character_age,
          emotional_tone: story.emotional_tone,
        }),
      })
      const data = await res.json()
      if (data.personas) {
        setScreeningResult(data)
        onScreeningComplete?.(data)
      }
    } catch (err) {
      console.error('Screening failed:', err)
    } finally {
      setScreeningLoading(false)
    }
  }

  function handleDelete(index: number) {
    const updated = scenes
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order_index: i }))
    onScenesUpdate(updated)
  }

  function handleAdd() {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      story_id: story.id,
      order_index: scenes.length,
      description: '',
      emotional_beat: '',
      visual_prompt: '',
      image_url: null,
      caption: null,
      created_at: new Date().toISOString(),
    }
    onScenesUpdate([...scenes, newScene])
    setEditingIndex(scenes.length)
    setEditForm(newScene)
  }

  function startEdit(index: number) {
    setEditingIndex(index)
    setEditForm({ ...scenes[index] })
  }

  function saveEdit() {
    if (editingIndex === null) return
    const updated = scenes.map((s, i) =>
      i === editingIndex ? { ...s, ...editForm } : s
    )
    onScenesUpdate(updated)
    setEditingIndex(null)
    setEditForm({})
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditForm({})
  }

  function moveScene(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= scenes.length) return
    const updated = [...scenes]
    const temp = updated[fromIndex]
    updated[fromIndex] = updated[toIndex]
    updated[toIndex] = temp
    onScenesUpdate(updated.map((s, i) => ({ ...s, order_index: i })))
  }

  const emotionalBeatColors: Record<string, string> = {
    normal: 'text-zinc-400 bg-zinc-500/10',
    breaking: 'text-red-400 bg-red-500/10',
    discovery: 'text-blue-400 bg-blue-500/10',
    struggle: 'text-amber-400 bg-amber-500/10',
    progress: 'text-emerald-400 bg-emerald-500/10',
    transformation: 'text-purple-400 bg-purple-500/10',
    triumph: 'text-yellow-400 bg-yellow-500/10',
  }

  function getBeatColor(beat: string): string {
    const lower = beat.toLowerCase()
    for (const [key, color] of Object.entries(emotionalBeatColors)) {
      if (lower.includes(key)) return color
    }
    return 'text-zinc-400 bg-zinc-500/10'
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Story Arc</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''} in {story.character_name}&apos;s
            transformation journey
          </p>
          {story.heartbeat_arc && story.heartbeat_arc.scenes.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Activity className="w-3 h-3 text-[var(--accent)]" />
              <span className="text-xs text-[var(--accent)]">
                Heartbeat arc active
                {story.arc_template_used ? ` · ${story.arc_template_used}` : ''}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-accent flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="spinner" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{scenes.length > 0 ? 'Regenerate Scenes' : 'Generate Scenes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Scenes list */}
      {scenes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No scenes yet</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
            Generate a complete story arc based on {story.character_name}&apos;s character
            profile and the selected emotional tone, or add scenes manually.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-accent flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Scenes
            </button>
            <button onClick={handleAdd} className="btn-secondary flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {scenes.map((scene, index) => {
            const isEditing = editingIndex === index

            const scanResult = scanResults.find((r) => r.slide_index === index)

            return (
              <div
                key={scene.id}
                className={`glass-card p-5 transition-all relative ${isEditing ? 'border-[var(--accent)]/30' : ''}`}
              >
                {/* Human Score badge overlay */}
                {scanResult && (
                  <div
                    className={`absolute top-2 right-2 z-10 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      scanResult.human_score >= 80
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : scanResult.human_score >= 60
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {scanResult.human_score >= 80 ? '👤' : scanResult.human_score >= 60 ? '🤔' : '🤖'}{' '}
                    {scanResult.human_score}
                  </div>
                )}
                {isEditing ? (
                  /* Edit mode */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">
                        Editing Scene {index + 1}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={saveEdit}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                      <textarea
                        className="input-dark"
                        rows={3}
                        value={editForm.description ?? ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, description: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Emotional Beat</label>
                        <input
                          className="input-dark"
                          value={editForm.emotional_beat ?? ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, emotional_beat: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Visual Prompt</label>
                        <input
                          className="input-dark"
                          value={editForm.visual_prompt ?? ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, visual_prompt: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex gap-4">
                    {/* Drag handle and scene number */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <button
                        onClick={() => moveScene(index, 'up')}
                        disabled={index === 0}
                        className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:hover:text-zinc-600 transition-colors"
                      >
                        <GripVertical className="w-4 h-4 rotate-180" />
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-zinc-400">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => moveScene(index, 'down')}
                        disabled={index === scenes.length - 1}
                        className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:hover:text-zinc-600 transition-colors"
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-sm text-zinc-200 leading-relaxed">
                          {scene.description}
                        </p>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(index)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getBeatColor(scene.emotional_beat)}`}
                        >
                          {scene.emotional_beat}
                        </span>
                        {scene.visual_prompt && (
                          <span className="text-xs text-zinc-600 truncate max-w-sm">
                            Visual: {scene.visual_prompt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add scene button */}
          <button
            onClick={handleAdd}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Scene
          </button>

          {/* Swipe Momentum Analyzer */}
          <SwipeMomentumPanel
            scenes={scenes}
            storyId={story.id}
            onScenesUpdate={onScenesUpdate}
            initialResult={swipeMomentumResult}
            onResultChange={(r) => {
              setSwipeMomentumResult(r)
              onSwipeAnalysisComplete?.(r)
            }}
          />

          {/* Authenticity Scanner */}
          <AuthenticityScanner
            scenes={scenes}
            onScenesUpdate={onScenesUpdate}
            scanResults={scanResults}
            onScanComplete={setScanResults}
            isRealityGrounded={story.is_reality_grounded}
          />

          {/* Audience Screening Room trigger */}
          <button
            onClick={handleScreenStory}
            disabled={screeningLoading}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-sm font-medium text-zinc-300 hover:text-white hover:border-[var(--accent)]/30 transition-all"
          >
            {screeningLoading ? (
              <>
                <div className="spinner w-4 h-4" />
                <span>Chargement de la salle...</span>
              </>
            ) : (
              <>
                <Clapperboard className="w-4 h-4 text-[var(--accent)]" />
                <span>Tester avec le public 🎬</span>
                {screeningResult && (
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-semibold">
                    Score: {screeningResult.virality_score}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Format DNA Adapter */}
          <FormatAdapterPanel
            story={story}
            scenes={scenes}
            onScenesUpdate={onScenesUpdate}
          />

          {/* Arc Overlay — shows heartbeat alignment after generation */}
          {story.heartbeat_arc && story.heartbeat_arc.scenes.length > 0 && (
            <ArcOverlay heartbeatArc={story.heartbeat_arc} scenes={scenes} />
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Heartbeat
        </button>
        <div className="relative">
          <button
            onClick={onContinue}
            disabled={scenes.length === 0}
            className="btn-accent flex items-center gap-2"
          >
            {screeningResult && (
              <span className="text-xs font-semibold opacity-80">
                Score: {screeningResult.virality_score} →
              </span>
            )}
            Continue to Images
            <ArrowRight className="w-4 h-4" />
          </button>
          {swipeMomentumResult && swipeMomentumResult.overall_score < 70 && (
            <p className="absolute -bottom-5 right-0 text-[10px] text-amber-400 whitespace-nowrap">
              ⚠ Low completion risk detected
            </p>
          )}
        </div>
      </div>

      {/* Audience Screening Room modal */}
      {showScreeningRoom && (
        <AudienceScreeningRoom
          result={screeningResult}
          scenes={scenes}
          onScenesUpdate={onScenesUpdate}
          onContinue={() => {
            setShowScreeningRoom(false)
            onContinue()
          }}
          onClose={() => setShowScreeningRoom(false)}
          onRerun={handleScreenStory}
          isLoading={screeningLoading}
        />
      )}
    </div>
  )
}
