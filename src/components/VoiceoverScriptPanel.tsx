'use client'

import { useState } from 'react'
import { Story, Scene, VoiceoverScript, VoiceoverScriptSlide } from '@/lib/types'
import {
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Download,
  Music,
  Clock,
} from 'lucide-react'

export function VoiceoverScriptPanel({
  story,
  scenes,
}: {
  story: Story
  scenes: Scene[]
}) {
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [script, setScript] = useState<VoiceoverScript | null>(null)
  const [generating, setGenerating] = useState(false)
  const [regeneratingSlide, setRegeneratingSlide] = useState<number | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [editingSlide, setEditingSlide] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})

  async function fetchScript(lang: 'en' | 'fr', bustCache = false) {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-voiceover-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story.id,
          language: lang,
          bust_cache: bustCache,
        }),
      })
      const data = await res.json()
      if (data.script) {
        setScript(data.script)
        setEditValues({})
      }
    } catch (err) {
      console.error('Voiceover script generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleLanguageToggle() {
    const newLang = language === 'en' ? 'fr' : 'en'
    setLanguage(newLang)
    setScript(null)
    await fetchScript(newLang)
  }

  async function handleRegenerateSlide(slideNumber: number) {
    if (!script) return
    setRegeneratingSlide(slideNumber)
    try {
      const res = await fetch('/api/generate-voiceover-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story.id,
          language,
          bust_cache: true,
          single_slide: slideNumber,
        }),
      })
      const data = await res.json()
      if (data.script) {
        // Replace just this slide in current script
        const updatedSlides = script.slides.map((s) =>
          s.slide_number === slideNumber
            ? (data.script.slides.find((ns: VoiceoverScriptSlide) => ns.slide_number === slideNumber) || s)
            : s
        )
        setScript({ ...script, slides: updatedSlides })
        // Clear any edit for this slide
        setEditValues((prev) => {
          const next = { ...prev }
          delete next[slideNumber]
          return next
        })
      }
    } catch (err) {
      console.error('Slide regeneration failed:', err)
    } finally {
      setRegeneratingSlide(null)
    }
  }

  function getSlideNarration(slide: VoiceoverScriptSlide): string {
    return editValues[slide.slide_number] !== undefined
      ? editValues[slide.slide_number]
      : slide.narration
  }

  function buildTeleprompterText(): string {
    if (!script) return ''
    const lines: string[] = []
    lines.push('[TEX FITNESS VOICEOVER SCRIPT]')
    lines.push(`Character: ${story.character_name}, ${story.character_age}, ${story.character_job}`)
    lines.push(`Total Duration: ~${script.total_duration_seconds} seconds`)
    lines.push(`Music Mood: ${script.music_mood}`)
    lines.push('')
    lines.push('--- INTRO HOOK (0-3s) ---')
    lines.push(script.intro_hook)
    lines.push('')
    script.slides.forEach((slide) => {
      lines.push(`--- SLIDE ${slide.slide_number} (${slide.timing_seconds}s) ---`)
      lines.push(getSlideNarration(slide))
      lines.push('')
    })
    lines.push('--- OUTRO (3s) ---')
    lines.push(script.outro_cta)
    return lines.join('\n')
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function downloadTxt() {
    const text = buildTeleprompterText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${story.character_name.replace(/\s+/g, '_')}_voiceover_${language}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const durationColor =
    !script
      ? ''
      : script.total_duration_seconds < 45
      ? 'bg-emerald-500'
      : script.total_duration_seconds <= 60
      ? 'bg-amber-400'
      : 'bg-red-500'

  const durationPct = script
    ? Math.min(100, Math.round((script.total_duration_seconds / 60) * 100))
    : 0

  const scenesWithImages = scenes.filter((s) => s.image_url)

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={handleLanguageToggle}
            disabled={generating}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            title="Toggle language"
          >
            {language === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
          </button>

          {/* Generate / Regenerate */}
          <button
            onClick={() => fetchScript(language, !!script)}
            disabled={generating}
            className="btn-accent flex items-center gap-2 text-xs py-1.5 px-3"
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{script ? 'Regenerate' : 'Generate Script'}</span>
              </>
            )}
          </button>
        </div>

        {/* Export buttons */}
        {script && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(buildTeleprompterText(), 'all')}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              {copied === 'all' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </>
              )}
            </button>
            <button
              onClick={downloadTxt}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download .txt
            </button>
          </div>
        )}
      </div>

      {/* Script content */}
      {!script && !generating && (
        <div className="glass-card p-10 text-center">
          <Music className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-1">Generate a video-ready narration script</p>
          <p className="text-xs text-zinc-600">
            Claude writes in your character&apos;s voice — clipped, honest, no AI clichés
          </p>
        </div>
      )}

      {generating && !script && (
        <div className="glass-card p-10 text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Writing in {story.character_name}&apos;s voice...</p>
        </div>
      )}

      {script && (
        <div className="space-y-4">
          {/* Music mood + duration */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent-hover)]">
              <Music className="w-3 h-3" />
              {script.music_mood}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400">
              <Clock className="w-3 h-3" />
              ~{script.total_duration_seconds}s total
            </span>
          </div>

          {/* Duration bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">
                Estimated duration: ~{script.total_duration_seconds} seconds
              </span>
              <span
                className={`text-xs font-medium ${
                  script.total_duration_seconds < 45
                    ? 'text-emerald-400'
                    : script.total_duration_seconds <= 60
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {script.total_duration_seconds < 45
                  ? 'Good length'
                  : script.total_duration_seconds <= 60
                  ? 'Getting long'
                  : 'Too long — trim slides'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${durationColor}`}
                style={{ width: `${durationPct}%` }}
              />
            </div>
          </div>

          {/* Intro hook */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Intro Hook</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500">0–3s</span>
            </div>
            <p className="text-sm text-white font-mono leading-relaxed">{script.intro_hook}</p>
          </div>

          {/* Per-slide cards */}
          {script.slides.map((slide) => {
            const scene = scenesWithImages.find((s) => s.order_index === slide.slide_number - 1)
              || scenesWithImages[slide.slide_number - 1]
            const isEditing = editingSlide === slide.slide_number
            const narration = getSlideNarration(slide)

            return (
              <div key={slide.slide_number} className="glass-card p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  {scene?.image_url ? (
                    <div className="shrink-0 w-12 h-20 rounded-lg overflow-hidden border border-white/[0.08]">
                      <img
                        src={scene.image_url}
                        alt={`Slide ${slide.slide_number}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 w-12 h-20 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-700 text-xs">
                      {slide.slide_number}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Slide {slide.slide_number}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500">
                        ~{slide.timing_seconds}s
                      </span>
                    </div>

                    {isEditing ? (
                      <textarea
                        className="input-dark text-sm w-full resize-none font-mono leading-relaxed"
                        rows={3}
                        value={narration}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, [slide.slide_number]: e.target.value }))
                        }
                        onBlur={() => setEditingSlide(null)}
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-sm text-zinc-200 font-mono leading-relaxed cursor-text hover:text-white transition-colors"
                        onClick={() => setEditingSlide(slide.slide_number)}
                        title="Click to edit"
                      >
                        {narration}
                      </p>
                    )}
                  </div>

                  {/* Regenerate slide */}
                  <button
                    onClick={() => handleRegenerateSlide(slide.slide_number)}
                    disabled={regeneratingSlide === slide.slide_number}
                    className="shrink-0 w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.08] transition-all disabled:opacity-40"
                    title="Regenerate this slide"
                  >
                    {regeneratingSlide === slide.slide_number ? (
                      <div className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Outro */}
          <div className="glass-card p-4 border-[var(--accent)]/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Outro CTA</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500">3s</span>
            </div>
            <p className="text-sm text-[var(--accent-hover)] font-mono leading-relaxed">{script.outro_cta}</p>
          </div>
        </div>
      )}
    </div>
  )
}
