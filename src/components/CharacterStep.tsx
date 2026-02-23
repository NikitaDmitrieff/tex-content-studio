'use client'

import { useState } from 'react'
import { Story, EmotionalTone, EMOTIONAL_TONES, Character } from '@/lib/types'
import { RefreshCw, ArrowRight, User, Briefcase, Calendar, BookOpen, Eye, Lock, Camera, Upload } from 'lucide-react'
import { PhotoUploadZone } from './PhotoUploadZone'
import { PhotoAnalysis } from '@/app/api/analyze-photo/route'

type ExtractedField = 'character_physical' | 'visual_dna' | 'character_name' | 'character_job' | 'character_backstory'

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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [extractedFields, setExtractedFields] = useState<Set<ExtractedField>>(new Set())
  const isLocked = Boolean(lockedCharacter)

  async function handleRegenerate() {
    setGenerating(true)
    setExtractedFields(new Set())
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

  async function handleAnalyzePhoto(base64: string, mimeType: 'image/jpeg' | 'image/png') {
    setAnalyzing(true)
    setPhotoError(null)
    try {
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          image_type: mimeType,
          has_name: Boolean(story.character_name),
          has_job: Boolean(story.character_job),
          has_backstory: Boolean(story.character_backstory),
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Analysis failed')
      }

      const analysis: PhotoAnalysis = data.analysis

      const physicalParts = [
        `${analysis.body_type.charAt(0).toUpperCase() + analysis.body_type.slice(1)} build`,
        `approximately ${analysis.estimated_age} years old`,
        `${analysis.gender_presentation} presentation`,
        `${analysis.skin_tone} skin tone`,
        `${analysis.hair.color} ${analysis.hair.length} ${analysis.hair.texture} hair`,
        ...(analysis.notable_features.length > 0 ? [analysis.notable_features.join(', ')] : []),
        analysis.lifestyle_cues,
      ]
      const physicalDesc = physicalParts.filter(Boolean).join('. ')

      const newExtracted = new Set<ExtractedField>(['character_physical', 'visual_dna'])
      const updates: Partial<Story> = {
        character_physical: physicalDesc,
        visual_dna: analysis.visual_dna_prefix,
      }

      if (!story.character_name && analysis.suggested_name) {
        updates.character_name = analysis.suggested_name
        newExtracted.add('character_name')
      }
      if (!story.character_job && analysis.suggested_job) {
        updates.character_job = analysis.suggested_job
        newExtracted.add('character_job')
      }
      if (!story.character_backstory && analysis.suggested_backstory) {
        updates.character_backstory = analysis.suggested_backstory
        newExtracted.add('character_backstory')
      }

      onUpdate(updates)
      setExtractedFields(newExtracted)
      setShowPhotoUpload(false)
    } catch (err) {
      console.error('Photo analysis failed:', err)
      setPhotoError(
        err instanceof Error ? err.message : 'Failed to analyze photo. Please try again or fill in manually.'
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const canContinue =
    story.character_name &&
    story.character_age &&
    story.character_job &&
    story.character_backstory &&
    story.character_physical &&
    story.emotional_tone

  function ExtractedBadge() {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium ml-1">
        <Camera className="w-3 h-3" />
        From photo
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Character Profile</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {isLocked
              ? 'Character fields are locked — loaded from your Characters library'
              : 'Create a relatable, everyday character for the transformation story'}
          </p>
        </div>
        {!isLocked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowPhotoUpload((v) => !v)
                setPhotoError(null)
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>From Photo</span>
            </button>
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
          </div>
        )}
      </div>

      {/* Photo upload zone */}
      {!isLocked && showPhotoUpload && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--accent)]" />
            Extract Character DNA from Photo
          </h3>
          <PhotoUploadZone onAnalyze={handleAnalyzePhoto} analyzing={analyzing} />
          {photoError && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-xs text-red-400">{photoError}</span>
            </div>
          )}
        </div>
      )}

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
              {extractedFields.has('character_name') && <ExtractedBadge />}
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
              {extractedFields.has('character_job') && <ExtractedBadge />}
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
            {extractedFields.has('character_backstory') && <ExtractedBadge />}
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
            {extractedFields.has('character_physical') && <ExtractedBadge />}
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

        {/* Visual DNA — shown when a value exists */}
        {(story.visual_dna || extractedFields.has('visual_dna')) && (
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
              <Camera className="w-3.5 h-3.5" />
              Visual DNA
              {extractedFields.has('visual_dna') && <ExtractedBadge />}
            </label>
            <textarea
              className="input-dark"
              rows={2}
              value={story.visual_dna || ''}
              onChange={(e) => !isLocked && onUpdate({ visual_dna: e.target.value })}
              readOnly={isLocked}
              placeholder="Image consistency prompt for Leonardo.AI..."
            />
          </div>
        )}
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
