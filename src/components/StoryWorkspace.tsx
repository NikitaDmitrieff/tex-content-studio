'use client'

import { useState } from 'react'
import { Story, Scene, Character } from '@/lib/types'
import { StepIndicator } from './StepIndicator'
import { CharacterStep } from './CharacterStep'
import { StoryArcStep } from './StoryArcStep'
import { ImageGenerationStep } from './ImageGenerationStep'
import { ExportStep } from './ExportStep'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Character' },
  { number: 2, label: 'Story Arc' },
  { number: 3, label: 'Images' },
  { number: 4, label: 'Export' },
]

export function StoryWorkspace({
  initialStory,
  initialScenes,
  lockedCharacter,
}: {
  initialStory: Story
  initialScenes: Scene[]
  lockedCharacter?: Character | null
}) {
  const [step, setStep] = useState(1)
  const [story, setStory] = useState<Story>(initialStory)
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)

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
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

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
          <StoryArcStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <ImageGenerationStep
            story={story}
            scenes={scenes}
            visualDna={lockedCharacter?.visual_dna}
            onScenesUpdate={handleScenesUpdate}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <ExportStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  )
}
