'use client'

import { useState } from 'react'
import { Story, HeartbeatArc, HeartbeatScene } from '@/lib/types'
import { ArrowLeft, ArrowRight, Activity } from 'lucide-react'
import { HeartbeatEditor, SCENE_POSITION_LABELS } from './HeartbeatEditor'
import { ArcTemplateGrid, buildArcScenes } from './ArcTemplateGrid'

const DEFAULT_INTENSITIES = [5, 4, 3, 1, 3, 6, 8, 9]

function buildDefaultArc(): HeartbeatArc {
  return { scenes: buildArcScenes(DEFAULT_INTENSITIES) }
}

export function HeartbeatStep({
  story,
  onUpdate,
  onBack,
  onContinue,
}: {
  story: Story
  onUpdate: (updates: Partial<Story>) => void
  onBack: () => void
  onContinue: () => void
}) {
  const [arc, setArc] = useState<HeartbeatArc>(
    story.heartbeat_arc ?? buildDefaultArc()
  )
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(
    story.arc_template_used ?? 'V-Shape Comeback'
  )

  function handleTemplateSelect(templateName: string, scenes: HeartbeatScene[]) {
    const newArc = { scenes }
    setArc(newArc)
    setSelectedTemplate(templateName)
  }

  function handleCurveScenesChange(scenes: HeartbeatScene[]) {
    setArc({ scenes })
    // If user manually edits, deselect template (arc is now custom)
    // We keep the template name so they know what they started from
  }

  function handleContinue() {
    onUpdate({ heartbeat_arc: arc, arc_template_used: selectedTemplate ?? null })
    onContinue()
  }

  const lowestScene = arc.scenes.reduce((a, b) => (a.intensity < b.intensity ? a : b))
  const highestScene = arc.scenes.reduce((a, b) => (a.intensity > b.intensity ? a : b))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-2xl font-bold">Story Heartbeat</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Design the emotional arc before a single scene is written. Drag the dots or pick a
            template.
          </p>
        </div>

        {/* Arc summary badges */}
        <div className="flex gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
            Scene {lowestScene.position} rock bottom: {lowestScene.intensity}/10
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
            Scene {highestScene.position} peak: {highestScene.intensity}/10
          </div>
        </div>
      </div>

      {/* Template grid */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300">Pre-Built Arc Templates</h3>
        <ArcTemplateGrid selectedTemplate={selectedTemplate} onSelect={handleTemplateSelect} />
      </div>

      {/* Curve editor */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">Customize Your Arc</h3>
          <span className="text-xs text-zinc-500">
            {selectedTemplate ? (
              <>
                Starting from{' '}
                <span className="text-zinc-400 font-medium">{selectedTemplate}</span> — drag dots
                to customise
              </>
            ) : (
              'Drag the dots up/down to set emotional intensity'
            )}
          </span>
        </div>
        <HeartbeatEditor scenes={arc.scenes} onChange={handleCurveScenesChange} />

        {/* Scene-by-scene intensity summary */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2">
          {arc.scenes.map((s) => {
            const color =
              s.intensity <= 3
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : s.intensity <= 6
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            return (
              <div
                key={s.position}
                className={`rounded-lg border px-2 py-1.5 text-center ${color}`}
              >
                <div className="text-[10px] text-zinc-500 mb-0.5">
                  {SCENE_POSITION_LABELS[s.position - 1].split(' ')[0]}
                </div>
                <div className="text-sm font-bold">{s.intensity}</div>
                {s.label && (
                  <div className="text-[9px] text-zinc-500 truncate mt-0.5">{s.label}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Info callout */}
      <div className="px-4 py-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/15 text-xs text-zinc-400">
        <span className="text-zinc-300 font-medium">How this works:</span> The intensity values
        you set here will be injected as strict constraints into the story generation prompt.
        Claude will be instructed to match each scene&apos;s emotional level exactly.
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Character
        </button>
        <button onClick={handleContinue} className="btn-accent flex items-center gap-2">
          Continue to Story Arc
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
