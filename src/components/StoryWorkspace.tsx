'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Story, Scene, Character, ScreeningResult, SwipeMomentumResult } from '@/lib/types'
import { StepIndicator } from './StepIndicator'
import { CharacterStep } from './CharacterStep'
import { HeartbeatStep } from './HeartbeatStep'
import { StoryArcStep } from './StoryArcStep'
import { ImageGenerationStep } from './ImageGenerationStep'
import { ExportStep } from './ExportStep'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Character' },
  { number: 2, label: 'Heartbeat' },
  { number: 3, label: 'Story Arc' },
  { number: 4, label: 'Images' },
  { number: 5, label: 'Export' },
]

function inferInitialStep(story: Story, scenes: Scene[]): number {
  if (story.status === 'complete') return 5
  const hasImages = scenes.some((s) => s.image_url)
  if (hasImages) return 5
  if (story.status === 'images_generating') return 4
  if (scenes.length > 0) return 3
  if (story.heartbeat_arc) return 3
  return 1
}

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
  const [step, setStep] = useState(() => inferInitialStep(initialStory, initialScenes))
  const [story, setStory] = useState<Story>(initialStory)
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null)
  const [swipeMomentumResult, setSwipeMomentumResult] = useState<SwipeMomentumResult | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Auto-save: debounce story changes to Supabase
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(JSON.stringify(initialStory))
  const storyRef = useRef(story)
  storyRef.current = story

  const saveStory = useCallback(async (storyToSave: Story) => {
    // Don't save demo/temp stories
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

  // Save immediately on page unload
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

  const backHref = lockedCharacter ? `/characters/${lockedCharacter.id}` : '/'
  const backLabel = lockedCharacter ? `Back to ${lockedCharacter.name}` : 'Back to dashboard'

  return (
    <div className="fade-in">
      {/* Back navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
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

          {/* Preview button — shown once story arc is generated (step 3+) */}
          {step >= 3 && scenes.length > 0 && !story.id.startsWith('demo-') && !story.id.startsWith('new-') && (
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

      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {/* Step content */}
      <div className="fade-in" key={step}>
        {step === 1 && (
          <CharacterStep
            story={story}
            onUpdate={handleStoryUpdate}
            onContinue={() => setStep(2)}
            lockedCharacter={lockedCharacter}
          />
        )}
        {step === 2 && (
          <HeartbeatStep
            story={story}
            onUpdate={handleStoryUpdate}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StoryArcStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
            onScreeningComplete={setScreeningResult}
            onSwipeAnalysisComplete={setSwipeMomentumResult}
          />
        )}
        {step === 4 && (
          <ImageGenerationStep
            story={story}
            scenes={scenes}
            visualDna={lockedCharacter?.visual_dna}
            onScenesUpdate={handleScenesUpdate}
            onBack={() => setStep(3)}
            onContinue={() => setStep(5)}
            swipeScore={swipeMomentumResult?.overall_score ?? null}
          />
        )}
        {step === 5 && (
          <ExportStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
            onBack={() => setStep(4)}
            screeningResult={screeningResult}
          />
        )}
      </div>
    </div>
  )
}
