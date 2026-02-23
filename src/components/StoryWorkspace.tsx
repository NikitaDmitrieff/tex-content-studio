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
import { ArrowLeft, Eye, Sparkles } from 'lucide-react'
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
        setScenes(newScenes)
      }
    } catch (err) {
      console.error('Failed to generate scenes:', err)
    } finally {
      setGeneratingStory(false)
    }
  }

  const canGenerate =
    story.character_name &&
    story.character_age &&
    story.character_job &&
    story.character_backstory &&
    story.character_physical &&
    story.emotional_tone

  const hasScenes = scenes.length > 0
  const hasImages = scenes.some((s) => s.image_url)
  const backHref = lockedCharacter ? `/characters/${lockedCharacter.id}` : '/'
  const backLabel = lockedCharacter ? `Back to ${lockedCharacter.name}` : 'Back to dashboard'

  return (
    <div className="fade-in space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-3">
          {saveStatus !== 'idle' && (
            <span
              className={`text-xs transition-opacity ${
                saveStatus === 'saving'
                  ? 'text-zinc-500'
                  : saveStatus === 'saved'
                    ? 'text-emerald-500/70'
                    : 'text-red-400/70'
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
              className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition-colors"
              style={{
                background: 'rgba(109,90,255,0.12)',
                border: '1px solid rgba(109,90,255,0.3)',
                color: '#8577ff',
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Link>
          )}
        </div>
      </div>

      {/* ① CHARACTER */}
      <CharacterStep
        story={story}
        onUpdate={handleStoryUpdate}
        lockedCharacter={lockedCharacter}
      />

      {/* Generate Story button */}
      {canGenerate && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerateStory}
            disabled={generatingStory}
            className="btn-accent flex items-center gap-2 px-6 py-3 text-base"
          >
            {generatingStory ? (
              <>
                <div className="spinner" />
                <span>Generating Story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{hasScenes ? 'Regenerate Story' : 'Generate Story'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ② SCENES */}
      {hasScenes && (
        <>
          <StoryArcStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
          />

          {/* Arc Overlay — shows heartbeat alignment */}
          {story.heartbeat_arc && story.heartbeat_arc.scenes.length > 0 && (
            <ArcOverlay heartbeatArc={story.heartbeat_arc} scenes={scenes} />
          )}
        </>
      )}

      {/* ③ IMAGES */}
      {hasScenes && (
        <ImageGenerationStep
          story={story}
          scenes={scenes}
          visualDna={lockedCharacter?.visual_dna}
          onScenesUpdate={handleScenesUpdate}
          swipeScore={swipeMomentumResult?.overall_score ?? null}
        />
      )}

      {/* ④ EXPORT */}
      {hasImages && (
        <ExportStep
          story={story}
          scenes={scenes}
          onScenesUpdate={handleScenesUpdate}
          audioBrief={audioBrief}
        />
      )}

      {/* Pro Tools Drawer */}
      {hasScenes && (
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
      )}
    </div>
  )
}
