'use client'

import { useState } from 'react'
import { Story, EmotionalTone, EMOTIONAL_TONES, Character } from '@/lib/types'
import { RefreshCw, ArrowRight, User, Briefcase, Calendar, BookOpen, Eye, Lock } from 'lucide-react'

export function CharacterStep({
  story,
  onUpdate,
  onContinue,
  lockedCharacter,
}: {
  story: Story
  onUpdate: (updates: Partial<Story>) => void
  onContinue: () => void
  lockedCharacter?: Character | null
}) {
  const [generating, setGenerating] = useState(false)
  const isLocked = Boolean(lockedCharacter)

  async function handleRegenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-character', { method: 'POST' })
      const data = await res.json()

      if (data.character) {
        onUpdate({
          character_name: data.character.name,
          character_age: data.character.age,
          character_job: data.character.job,
          character_backstory: data.character.backstory,
          character_physical: data.character.physical_description,
        })
      }
    } catch (err) {
      console.error('Failed to generate character:', err)
    } finally {
      setGenerating(false)
    }
  }

  const canContinue =
    story.character_name &&
    story.character_age &&
    story.character_job &&
    story.character_backstory &&
    story.character_physical &&
    story.emotional_tone

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Character Profile</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {isLocked
              ? 'Character fields are locked — loaded from your Characters library'
              : 'Create a relatable, everyday character for the transformation story'}
          </p>
        </div>
        {!isLocked && (
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="btn-secondary flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="spinner" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Character</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Locked character badge */}
      {isLocked && lockedCharacter && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
          <Lock className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-sm text-[var(--accent-hover)]">
            Loaded from Character: <span className="font-semibold">{lockedCharacter.name}</span>
          </span>
        </div>
      )}

      {/* Character card */}
      <div className={`glass-card p-6 space-y-5 ${isLocked ? 'opacity-70' : ''}`}>
        {/* Name and basics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
              <User className="w-3.5 h-3.5" />
              Character Name
            </label>
            <input
              type="text"
              className="input-dark"
              value={story.character_name}
              onChange={(e) => !isLocked && onUpdate({ character_name: e.target.value })}
              readOnly={isLocked}
              placeholder="e.g. Frank Delgado"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Age
            </label>
            <input
              type="number"
              className="input-dark"
              value={story.character_age || ''}
              onChange={(e) => !isLocked && onUpdate({ character_age: parseInt(e.target.value) || 0 })}
              readOnly={isLocked}
              placeholder="30-65"
              min={18}
              max={80}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              Job
            </label>
            <input
              type="text"
              className="input-dark"
              value={story.character_job}
              onChange={(e) => !isLocked && onUpdate({ character_job: e.target.value })}
              readOnly={isLocked}
              placeholder="e.g. Long-haul trucker"
            />
          </div>
        </div>

        {/* Backstory */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Backstory
          </label>
          <textarea
            className="input-dark"
            rows={4}
            value={story.character_backstory}
            onChange={(e) => !isLocked && onUpdate({ character_backstory: e.target.value })}
            readOnly={isLocked}
            placeholder="Why have they never exercised? What's their daily life like? What's the emotional weight they carry?"
          />
        </div>

        {/* Physical description */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <Eye className="w-3.5 h-3.5" />
            Physical Description
          </label>
          <textarea
            className="input-dark"
            rows={3}
            value={story.character_physical}
            onChange={(e) => !isLocked && onUpdate({ character_physical: e.target.value })}
            readOnly={isLocked}
            placeholder="Body type, distinguishing features, typical clothing, general appearance..."
          />
        </div>
      </div>

      {/* Emotional tone selector */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Story Tone</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {EMOTIONAL_TONES.map((tone) => {
            const isSelected = story.emotional_tone === tone.value
            return (
              <button
                key={tone.value}
                onClick={() => onUpdate({ emotional_tone: tone.value as EmotionalTone })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_20px_rgba(109,90,255,0.15)]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className="text-xl mb-1">{tone.emoji}</div>
                <div
                  className={`text-xs font-medium ${isSelected ? 'text-[var(--accent-hover)]' : 'text-zinc-400'}`}
                >
                  {tone.label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="btn-accent flex items-center gap-2"
        >
          <span>Continue to Story Arc</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
