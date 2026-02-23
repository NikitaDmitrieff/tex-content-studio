'use client'

import { useState, useRef } from 'react'
import { Story, Scene } from '@/lib/types'
import {
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Hash,
  Mic,
  FileText,
} from 'lucide-react'

const SUGGESTED_HASHTAGS = [
  '#TexFitness',
  '#FitnessTransformation',
  '#GlowUp',
  '#FitnessJourney',
  '#MotivationStory',
  '#TransformationTuesday',
  '#FitOver40',
  '#FitOver50',
  '#NeverTooLate',
  '#FitnessMotivation',
  '#RealPeople',
  '#RealResults',
  '#BodyTransformation',
  '#WeightLossJourney',
  '#TikTokFitness',
]

export function ExportStep({
  story,
  scenes,
  onScenesUpdate,
  onBack,
}: {
  story: Story
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  onBack: () => void
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scenesWithImages = scenes.filter((s) => s.image_url)

  function updateCaption(sceneId: string, caption: string) {
    const updated = scenes.map((s) => (s.id === sceneId ? { ...s, caption } : s))
    onScenesUpdate(updated)
  }

  function nextSlide() {
    if (currentSlide < scenesWithImages.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  async function handleDownloadAll() {
    setDownloading(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: story.id, scenes: scenesWithImages }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${story.character_name.replace(/\s+/g, '_')}_carousel.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  function generateVoiceoverScript(): string {
    const lines: string[] = []
    lines.push(`[VOICEOVER SCRIPT: ${story.character_name}'s Story — First Person]\n`)
    lines.push(`Tone: ${story.emotional_tone.replace(/_/g, ' ')}\n`)
    lines.push(`Note: Read as the character speaking directly to camera.\n`)

    scenesWithImages.forEach((scene, i) => {
      lines.push(`--- Slide ${i + 1} ---`)
      lines.push(scene.description)
      if (scene.caption) {
        lines.push(`[On-screen text: "${scene.caption}"]`)
      }
      lines.push('')
    })

    lines.push('---')
    lines.push(
      `Suggested CTA: "Follow for more real stories. Link in bio."`
    )

    return lines.join('\n')
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const voiceoverScript = generateVoiceoverScript()

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Preview, caption, and download your TikTok carousel
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloading || scenesWithImages.length === 0}
          className="btn-accent flex items-center gap-2"
        >
          {downloading ? (
            <>
              <div className="spinner" />
              <span>Packaging...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download All</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carousel preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Carousel Preview
          </h3>

          <div className="glass-card p-6">
            {scenesWithImages.length > 0 ? (
              <>
                {/* Main preview */}
                <div className="relative mx-auto" style={{ maxWidth: '270px' }}>
                  <div className="tiktok-preview">
                    <img
                      src={scenesWithImages[currentSlide]?.image_url || ''}
                      alt={`Slide ${currentSlide + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Caption overlay */}
                    {scenesWithImages[currentSlide]?.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-sm font-medium text-center">
                          {scenesWithImages[currentSlide].caption}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Nav arrows */}
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="absolute left-[-2.5rem] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === scenesWithImages.length - 1}
                    className="absolute right-[-2.5rem] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Slide indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {scenesWithImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentSlide
                          ? 'bg-[var(--accent)] w-6'
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                {/* Caption editor for current slide */}
                <div className="mt-4">
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Slide {currentSlide + 1} Caption
                  </label>
                  <input
                    type="text"
                    className="input-dark text-sm"
                    value={scenesWithImages[currentSlide]?.caption || ''}
                    onChange={(e) =>
                      updateCaption(scenesWithImages[currentSlide].id, e.target.value)
                    }
                    placeholder="Add overlay text for this slide..."
                  />
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">
                  No images generated yet. Go back to generate images first.
                </p>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {scenesWithImages.length > 0 && (
            <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2">
              {scenesWithImages.map((scene, i) => (
                <button
                  key={scene.id}
                  onClick={() => setCurrentSlide(i)}
                  className={`shrink-0 w-14 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentSlide
                      ? 'border-[var(--accent)] shadow-[0_0_12px_rgba(109,90,255,0.3)]'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img
                    src={scene.image_url || ''}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: voiceover + hashtags */}
        <div className="space-y-6">
          {/* Voiceover script */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voiceover Script
              </h3>
              <button
                onClick={() => copyToClipboard(voiceoverScript)}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="glass-card p-4">
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                {voiceoverScript}
              </pre>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4" />
              Suggested Hashtags
            </h3>
            <div className="glass-card p-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => copyToClipboard(tag)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(SUGGESTED_HASHTAGS.join(' '))}
                className="mt-3 text-xs text-[var(--accent)] hover:underline"
              >
                Copy all hashtags
              </button>
            </div>
          </div>

          {/* All captions editor */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">All Slide Captions</h3>
            <div className="glass-card p-4 space-y-3">
              {scenesWithImages.map((scene, i) => (
                <div key={scene.id}>
                  <label className="text-xs text-zinc-500 mb-1 block">Slide {i + 1}</label>
                  <input
                    type="text"
                    className="input-dark text-sm"
                    value={scene.caption || ''}
                    onChange={(e) => updateCaption(scene.id, e.target.value)}
                    placeholder={`Caption for slide ${i + 1}...`}
                  />
                </div>
              ))}
              {scenesWithImages.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">
                  Generate images first to add captions
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Images
        </button>
        <div className="text-sm text-zinc-500">
          {scenesWithImages.length} slide{scenesWithImages.length !== 1 ? 's' : ''} ready for
          export
        </div>
      </div>
    </div>
  )
}
