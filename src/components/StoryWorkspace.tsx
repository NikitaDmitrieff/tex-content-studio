'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Story, Scene, Character, ScreeningResult, SwipeMomentumResult, AudioBrief } from '@/lib/types'
import { CharacterStep } from './CharacterStep'
import { StoryArcStep } from './StoryArcStep'
import { ImageGenerationStep } from './ImageGenerationStep'
import { ExportStep } from './ExportStep'
import { ArcOverlay } from './ArcOverlay'
import { ProToolsDrawer } from './ProToolsDrawer'
import Link from 'next/link'
import { ArrowLeft, Eye, Sparkles, Zap } from 'lucide-react'
import { buildArcScenes } from './ArcTemplateGrid'

const DEFAULT_HEARTBEAT_INTENSITIES = [5, 4, 3, 1, 3, 6, 8, 9]

const SAVE_DEBOUNCE_MS = 1500

export function StoryWorkspace({
  initialStory,
  initialScenes,
  lockedCharacter,
}: {
  initialStory: Story
  initialScenes: Scene[]
  lockedCharacter?: Character | null
}) {
  const [story, setStory] = useState<Story>(initialStory)
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null)
  const [swipeMomentumResult, setSwipeMomentumResult] = useState<SwipeMomentumResult | null>(null)
  const [audioBrief, setAudioBrief] = useState<AudioBrief | null>(null)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [postCaption, setPostCaption] = useState<{ hook: string; body: string; cta: string; hashtags: string } | null>(null)

  // One-click pipeline state
  type PipelineStage = 'idle' | 'story' | 'images' | 'caption' | 'done' | 'error'
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle')
  const [pipelineError, setPipelineError] = useState<string | null>(null)

  // Auto-save logic (preserved from original)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(JSON.stringify(initialStory))
  const storyRef = useRef(story)
  storyRef.current = story

  const saveStory = useCallback(async (storyToSave: Story) => {
    if (storyToSave.id.startsWith('demo-') || storyToSave.id.startsWith('new-')) return
    const serialized = JSON.stringify(storyToSave)
    if (serialized === lastSavedRef.current) return
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/stories/${storyToSave.id}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: storyToSave.character_name,
          character_age: storyToSave.character_age,
          character_job: storyToSave.character_job,
          character_backstory: storyToSave.character_backstory,
          character_physical: storyToSave.character_physical,
          visual_dna: storyToSave.visual_dna,
          emotional_tone: storyToSave.emotional_tone,
          heartbeat_arc: storyToSave.heartbeat_arc,
          arc_template_used: storyToSave.arc_template_used,
        }),
      })
      if (res.ok) {
        lastSavedRef.current = serialized
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }, [])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveStory(storyRef.current)
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [story, saveStory])

  useEffect(() => {
    function handleBeforeUnload() {
      const s = storyRef.current
      if (s.id.startsWith('demo-') || s.id.startsWith('new-')) return
      const serialized = JSON.stringify(s)
      if (serialized === lastSavedRef.current) return
      navigator.sendBeacon(
        `/api/stories/${s.id}/save`,
        new Blob(
          [JSON.stringify({
            character_name: s.character_name,
            character_age: s.character_age,
            character_job: s.character_job,
            character_backstory: s.character_backstory,
            character_physical: s.character_physical,
            visual_dna: s.visual_dna,
            emotional_tone: s.emotional_tone,
            heartbeat_arc: s.heartbeat_arc,
            arc_template_used: s.arc_template_used,
          })],
          { type: 'application/json' }
        )
      )
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  function handleStoryUpdate(updates: Partial<Story>) {
    setStory((prev) => ({ ...prev, ...updates }))
  }

  function handleScenesUpdate(newScenes: Scene[]) {
    setScenes(newScenes)
  }

  // Generate story — applies default heartbeat if none set
  async function handleGenerateStory() {
    setGeneratingStory(true)

    // Apply default heartbeat arc if user hasn't customized one via Pro Tools
    let heartbeatArc = story.heartbeat_arc
    let arcTemplateUsed = story.arc_template_used
    if (!heartbeatArc || heartbeatArc.scenes.length === 0) {
      heartbeatArc = { scenes: buildArcScenes(DEFAULT_HEARTBEAT_INTENSITIES) }
      arcTemplateUsed = 'V-Shape Comeback'
      handleStoryUpdate({ heartbeat_arc: heartbeatArc, arc_template_used: arcTemplateUsed })
    }

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
          // optional
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
          heartbeat_arc: heartbeatArc ?? undefined,
          arc_template_used: arcTemplateUsed ?? undefined,
        }),
      })
      const data = await res.json()

      if (data.scenes && Array.isArray(data.scenes)) {
        const newScenes: Scene[] = data.scenes.map(
          (s: { description: string; emotional_beat: string; visual_prompt: string }, i: number) => ({
            id: data.scene_ids?.[i] || `scene-${Date.now()}-${i}`,
            story_id: story.id,
            order_index: i,
            description: s.description,
            emotional_beat: s.emotional_beat,
            visual_prompt: s.visual_prompt,
            image_url: null,
            caption: s.description, // Auto-populate overlay text from description
            created_at: new Date().toISOString(),
          })
        )
        setScenes(newScenes)
        return newScenes // Return for pipeline chaining
      }
    } catch (err) {
      console.error('Failed to generate scenes:', err)
    } finally {
      setGeneratingStory(false)
    }
    return null
  }

  // ── Pipeline helpers ──────────────────────────────────────────────────────

  async function generateImagesForScenes(targetScenes: Scene[]): Promise<Scene[] | null> {
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visual_prompts: targetScenes.map((s) => s.visual_prompt),
          character_physical: story.character_physical,
          scene_ids: targetScenes.map((s) => s.id),
          ...(lockedCharacter?.visual_dna ? { visual_dna: lockedCharacter.visual_dna } : story.visual_dna ? { visual_dna: story.visual_dna } : {}),
        }),
      })
      const data = await res.json()
      if (data.images && Array.isArray(data.images)) {
        const updated = targetScenes.map((scene) => {
          const img = data.images.find((i: { scene_id: string; image_url: string | null }) => i.scene_id === scene.id)
          return img?.image_url ? { ...scene, image_url: img.image_url } : scene
        })
        setScenes(updated)
        return updated
      }
    } catch (err) {
      console.error('Image generation failed:', err)
    }
    return null
  }

  async function generatePostCaption(targetScenes: Scene[]): Promise<void> {
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: story.character_name,
          character_age: story.character_age,
          character_job: story.character_job,
          emotional_tone: story.emotional_tone,
          scenes: targetScenes.map((s) => ({
            description: s.description,
            emotional_beat: s.emotional_beat,
          })),
        }),
      })
      const data = await res.json()
      if (data.caption) {
        setPostCaption(data.caption)
      }
    } catch (err) {
      console.error('Caption generation failed:', err)
    }
  }

  // ── One-Click Pipeline ─────────────────────────────────────────────────────

  async function handleGenerateEverything() {
    setPipelineStage('story')
    setPipelineError(null)

    // Stage 1: Generate story
    const newScenes = await handleGenerateStory()
    if (!newScenes || newScenes.length === 0) {
      setPipelineStage('error')
      setPipelineError('Story generation failed')
      return
    }

    // Stage 2: Generate images
    setPipelineStage('images')
    const withImages = await generateImagesForScenes(newScenes)
    if (!withImages || !withImages.some((s) => s.image_url)) {
      setPipelineStage('error')
      setPipelineError('Image generation failed')
      return
    }

    // Stage 3: Generate post caption
    setPipelineStage('caption')
    await generatePostCaption(withImages)

    setPipelineStage('done')
    setTimeout(() => setPipelineStage('idle'), 3000)
  }

  const canGenerate =
    story.character_name &&
    story.character_age &&
    story.character_job &&
    story.character_backstory &&
    story.character_physical &&
    story.emotional_tone

  const isPipelineRunning = pipelineStage !== 'idle' && pipelineStage !== 'done' && pipelineStage !== 'error'
  const hasScenes = scenes.length > 0
  const hasImages = scenes.some((s) => s.image_url)
  const backHref = lockedCharacter ? `/characters/${lockedCharacter.id}` : '/'
  const backLabel = lockedCharacter ? `Back to ${lockedCharacter.name}` : 'Back to dashboard'

  return (
    <div className="fade-in space-y-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-3">
          {saveStatus !== 'idle' && (
            <span
              className={`text-xs transition-all duration-300 ${
                saveStatus === 'saving'
                  ? 'text-zinc-600'
                  : saveStatus === 'saved'
                    ? 'text-emerald-500/60'
                    : 'text-red-400/60'
              }`}
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Save failed'}
            </span>
          )}

          {hasScenes && !story.id.startsWith('demo-') && !story.id.startsWith('new-') && (
            <Link
              href={`/stories/${story.id}/preview`}
              className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition-all bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-hover)] hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/30"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Link>
          )}
        </div>
      </div>

      {/* ① CHARACTER */}
      <div className="section-reveal">
        <CharacterStep
          story={story}
          onUpdate={handleStoryUpdate}
          lockedCharacter={lockedCharacter}
        />
      </div>

      {/* Generate buttons */}
      {canGenerate && (
        <div className="section-reveal space-y-5">
          <div className="flex flex-col items-center gap-3">
            {/* One-Click Pipeline — hero action */}
            <button
              onClick={handleGenerateEverything}
              disabled={isPipelineRunning || generatingStory}
              className="btn-hero flex items-center gap-2.5"
            >
              {isPipelineRunning ? (
                <>
                  <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }} />
                  <span>
                    {pipelineStage === 'story' && 'Writing story...'}
                    {pipelineStage === 'images' && 'Generating images...'}
                    {pipelineStage === 'caption' && 'Writing caption...'}
                  </span>
                </>
              ) : pipelineStage === 'done' ? (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Done! Scroll down to export</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>{hasScenes ? 'Regenerate Everything' : 'Generate Everything'}</span>
                </>
              )}
            </button>

            {/* Story-only — tertiary */}
            <button
              onClick={() => handleGenerateStory()}
              disabled={generatingStory || isPipelineRunning}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              {generatingStory && !isPipelineRunning ? (
                <>
                  <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>or generate story only</span>
                </>
              )}
            </button>
          </div>

          {/* Pipeline progress bar */}
          {isPipelineRunning && (
            <div className="max-w-sm mx-auto glass-card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                {(['story', 'images', 'caption'] as const).map((stage, i) => {
                  const stageIndex = ['story', 'images', 'caption'].indexOf(pipelineStage)
                  const isDone = stageIndex > i
                  const isActive = pipelineStage === stage
                  return (
                    <div key={stage} className="flex-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-700 ${
                          isActive
                            ? 'bg-[var(--accent)] pulse-glow'
                            : isDone
                              ? 'bg-emerald-500'
                              : 'bg-white/[0.06]'
                        }`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] font-medium px-0.5">
                {(['story', 'images', 'caption'] as const).map((stage, i) => {
                  const stageIndex = ['story', 'images', 'caption'].indexOf(pipelineStage)
                  const isDone = stageIndex > i
                  const isActive = pipelineStage === stage
                  const labels = ['Story', 'Images', 'Caption']
                  return (
                    <span
                      key={stage}
                      className={
                        isActive ? 'text-[var(--accent)]' : isDone ? 'text-emerald-500/70' : 'text-zinc-600'
                      }
                    >
                      {isDone ? '\u2713 ' : ''}{labels[i]}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pipeline error */}
          {pipelineStage === 'error' && pipelineError && (
            <div className="max-w-sm mx-auto glass-card p-4 border-red-500/20 text-center">
              <p className="text-sm text-red-400">{pipelineError}</p>
              <button
                onClick={() => { setPipelineStage('idle'); setPipelineError(null) }}
                className="text-xs text-zinc-500 hover:text-zinc-300 mt-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* ② SCENES */}
      {hasScenes && (
        <div className="section-reveal">
          <div className="section-divider mb-8" />
          <StoryArcStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
          />

          {/* Arc Overlay — shows heartbeat alignment */}
          {story.heartbeat_arc && story.heartbeat_arc.scenes.length > 0 && (
            <div className="mt-6">
              <ArcOverlay heartbeatArc={story.heartbeat_arc} scenes={scenes} />
            </div>
          )}
        </div>
      )}

      {/* ③ IMAGES */}
      {hasScenes && (
        <div className="section-reveal">
          <div className="section-divider mb-8" />
          <ImageGenerationStep
            story={story}
            scenes={scenes}
            visualDna={lockedCharacter?.visual_dna}
            onScenesUpdate={handleScenesUpdate}
            swipeScore={swipeMomentumResult?.overall_score ?? null}
          />
        </div>
      )}

      {/* ④ EXPORT */}
      {hasImages && (
        <div className="section-reveal">
          <div className="section-divider mb-8" />
          <ExportStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
            audioBrief={audioBrief}
            postCaption={postCaption}
            onPostCaptionChange={setPostCaption}
          />
        </div>
      )}

      {/* Pro Tools Drawer */}
      {hasScenes && (
        <div className="section-reveal">
          <div className="section-divider mb-8" />
          <ProToolsDrawer
            story={story}
            scenes={scenes}
            onStoryUpdate={handleStoryUpdate}
            onScenesUpdate={handleScenesUpdate}
            screeningResult={screeningResult}
            onScreeningComplete={setScreeningResult}
            swipeMomentumResult={swipeMomentumResult}
            onSwipeAnalysisComplete={setSwipeMomentumResult}
            onAudioBriefGenerated={setAudioBrief}
          />
        </div>
      )}
    </div>
  )
}
