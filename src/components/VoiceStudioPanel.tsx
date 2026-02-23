'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Story, Scene, SlideVoice } from '@/lib/types'
import {
  Mic,
  Play,
  Pause,
  Download,
  Sparkles,
  Volume2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

// ── Emotion mapping ─────────────────────────────────────────────────────────
// Maps emotional beats (from scene generation) to Fish Audio emotion tags.
// Fish Audio supports 50+ emotion markers; we map the beats most common in
// this app's fitness-transformation stories.

const BEAT_TO_EMOTION: Record<string, string> = {
  normal: '',
  breaking: '(sad)(moved)',
  rock_bottom: '(sad)(tired)',
  rock: '(sad)(tired)',
  bottom: '(sad)(tired)',
  discovery: '(surprised)',
  struggle: '(nervous)',
  progress: '(determined)',
  determination: '(determined)',
  transformation: '(moved)(proud)',
  triumph: '(excited)(joyful)',
  victory: '(excited)(joyful)',
  comeback: '(determined)(proud)',
  revenge: '(confident)(angry)',
  quiet: '(calm)(gentle)',
  hope: '(moved)(hopeful)',
  despair: '(sad)(whispering)',
  resolve: '(determined)',
  awakening: '(surprised)(excited)',
}

function mapEmotionTag(emotionalBeat: string, intensity?: number): string {
  const lower = emotionalBeat.toLowerCase()

  // Check each keyword
  for (const [key, tag] of Object.entries(BEAT_TO_EMOTION)) {
    if (lower.includes(key)) return tag
  }

  // Fall back to intensity-based mapping if we have heartbeat data
  if (intensity !== undefined) {
    if (intensity <= 2) return '(whispering)(sad)'
    if (intensity <= 4) return '(calm)'
    if (intensity <= 6) return '(neutral)'
    if (intensity <= 8) return '(determined)(confident)'
    return '(excited)(joyful)'
  }

  return ''
}

// ── Waveform visualization ──────────────────────────────────────────────────

function Waveform({ playing, barCount = 20 }: { playing: boolean; barCount?: number }) {
  // Generate deterministic but varied bar heights
  const bars = Array.from({ length: barCount }, (_, i) => {
    const seed = Math.sin(i * 9.1 + 3.7) * 0.5 + 0.5
    return 0.15 + seed * 0.85
  })

  return (
    <div className="flex items-end gap-[2px] h-6">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-150"
          style={{
            height: playing ? `${h * 100}%` : '20%',
            backgroundColor: playing ? '#f59e0b' : 'rgba(255,255,255,0.08)',
            animationName: playing ? 'waveformPulse' : 'none',
            animationDuration: `${0.4 + (i % 3) * 0.15}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${(i % 5) * 0.07}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function VoiceStudioPanel({
  story,
  scenes,
}: {
  story: Story
  scenes: Scene[]
}) {
  const [slides, setSlides] = useState<SlideVoice[]>(() =>
    scenes.map((s, i) => ({
      slide_number: i + 1,
      text: s.description,
      emotion_tag: mapEmotionTag(
        s.emotional_beat,
        story.heartbeat_arc?.scenes?.[i]?.intensity
      ),
      audio_url: null,
      duration_seconds: null,
      status: 'idle' as const,
    }))
  )
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [playingSlide, setPlayingSlide] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Keep slides in sync with scenes
  useEffect(() => {
    setSlides(prev => {
      if (prev.length === scenes.length) return prev
      return scenes.map((s, i) => prev[i] ?? {
        slide_number: i + 1,
        text: s.description,
        emotion_tag: mapEmotionTag(
          s.emotional_beat,
          story.heartbeat_arc?.scenes?.[i]?.intensity
        ),
        audio_url: null,
        duration_seconds: null,
        status: 'idle' as const,
      })
    })
  }, [scenes, story.heartbeat_arc])

  const generateSlide = useCallback(async (slideIndex: number, currentSlides: SlideVoice[]) => {
    const slide = currentSlides[slideIndex]
    if (!slide) return

    setSlides(prev => prev.map((s, i) =>
      i === slideIndex ? { ...s, status: 'generating' } : s
    ))

    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: slide.text,
          emotion: slide.emotion_tag,
          language: 'fr',
        }),
      })
      const data = await res.json()

      if (data.demo) {
        // Demo mode — no actual audio, but show as ready with estimated duration
        setSlides(prev => prev.map((s, i) =>
          i === slideIndex
            ? { ...s, duration_seconds: data.duration_seconds, status: 'ready' }
            : s
        ))
        return
      }

      if (data.audio_base64) {
        const audioBytes = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0))
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)

        setSlides(prev => prev.map((s, i) =>
          i === slideIndex
            ? { ...s, audio_url: audioUrl, duration_seconds: data.duration_seconds, status: 'ready' }
            : s
        ))
      } else {
        throw new Error(data.error || 'No audio returned')
      }
    } catch (err) {
      console.error('Voice generation failed for slide', slideIndex + 1, err)
      setSlides(prev => prev.map((s, i) =>
        i === slideIndex ? { ...s, status: 'error' } : s
      ))
    }
  }, [])

  async function handleGenerateAll() {
    setGenerating(true)
    setProgress(0)

    const currentSlides = slides
    for (let i = 0; i < currentSlides.length; i++) {
      setProgress(i + 1)
      await generateSlide(i, currentSlides)
    }

    setGenerating(false)
  }

  function handlePlay(slideIndex: number) {
    const slide = slides[slideIndex]
    if (!slide.audio_url) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingSlide === slideIndex) {
      setPlayingSlide(null)
      return
    }

    const audio = new Audio(slide.audio_url)
    audio.onended = () => setPlayingSlide(null)
    audio.play()
    audioRef.current = audio
    setPlayingSlide(slideIndex)
  }

  function handleDownloadAll() {
    slides.forEach(slide => {
      if (!slide.audio_url) return
      const a = document.createElement('a')
      a.href = slide.audio_url
      a.download = `${story.character_name.replace(/\s+/g, '_')}_scene_${slide.slide_number}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
  }

  const readyCount = slides.filter(s => s.status === 'ready').length
  const hasAudio = slides.some(s => s.audio_url !== null)
  const totalDuration = slides.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  const isDemo = readyCount > 0 && !hasAudio

  return (
    <div className="space-y-5">
      {/* Inject waveform keyframes */}
      <style>{`
        @keyframes waveformPulse {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-medium text-zinc-200">AI Voice Studio</span>
          {readyCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              {readyCount}/{slides.length} ready
              {totalDuration > 0 && ` · ${Math.round(totalDuration)}s`}
            </span>
          )}
          {isDemo && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-500">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasAudio && (
            <button
              onClick={handleDownloadAll}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download All
            </button>
          )}
          <button
            onClick={handleGenerateAll}
            disabled={generating || scenes.length === 0}
            className="btn-accent flex items-center gap-2 text-xs py-1.5 px-3"
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Scene {progress}/{slides.length}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{readyCount > 0 ? 'Regenerate All' : 'Generate Voices'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {readyCount === 0 && !generating && (
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-7 h-7 text-amber-400/40" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">
            Generate AI voiceover for every scene
          </p>
          <p className="text-xs text-zinc-600">
            Fish Audio turns your script into natural French speech with scene-matched emotions
          </p>
          <p className="text-[10px] text-zinc-700 mt-3">
            Requires FISH_AUDIO_API_KEY · Free tier: ~7 min/month
          </p>
        </div>
      )}

      {/* Progress bar */}
      {generating && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">
              Generating scene {progress} of {slides.length}
            </span>
            <span className="text-xs text-amber-400 font-medium">
              {Math.round((progress / slides.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
              style={{ width: `${(progress / slides.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Scene audio cards */}
      {(generating || readyCount > 0) && (
        <div className="space-y-2">
          {slides.map((slide, i) => {
            const scene = scenes[i]
            const isPlaying = playingSlide === i

            return (
              <div
                key={i}
                className={`glass-card p-4 transition-all ${
                  isPlaying ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.06)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Scene number badge */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    slide.status === 'ready'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      : slide.status === 'error'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-white/[0.04] border border-white/[0.06] text-zinc-500'
                  }`}>
                    {slide.slide_number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">
                      {slide.text.slice(0, 90)}{slide.text.length > 90 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {slide.emotion_tag && (
                        <span className="text-[11px] text-amber-400/60 font-mono">
                          {slide.emotion_tag}
                        </span>
                      )}
                      {scene?.emotional_beat && !slide.emotion_tag && (
                        <span className="text-[11px] text-zinc-600">
                          {scene.emotional_beat}
                        </span>
                      )}
                      {slide.duration_seconds !== null && (
                        <span className="text-[11px] text-zinc-600">
                          {slide.duration_seconds}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Waveform (visible when playing) */}
                  {slide.status === 'ready' && (
                    <div className="hidden sm:block shrink-0 w-24">
                      <Waveform playing={isPlaying} />
                    </div>
                  )}

                  {/* Play / Status button */}
                  <div className="shrink-0">
                    {slide.status === 'generating' && (
                      <div className="w-9 h-9 flex items-center justify-center">
                        <div className="spinner" style={{ width: '1.125rem', height: '1.125rem' }} />
                      </div>
                    )}
                    {slide.status === 'ready' && slide.audio_url && (
                      <button
                        onClick={() => handlePlay(i)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-amber-400 text-black shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                    )}
                    {slide.status === 'ready' && !slide.audio_url && (
                      <div
                        className="w-9 h-9 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-400/30"
                        title="Demo mode — no audio file generated"
                      >
                        <Volume2 className="w-4 h-4" />
                      </div>
                    )}
                    {slide.status === 'error' && (
                      <button
                        onClick={() => generateSlide(i, slides)}
                        className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    {slide.status === 'idle' && (
                      <div className="w-9 h-9 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-zinc-700">
                        <Volume2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Demo mode notice */}
      {isDemo && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <AlertCircle className="w-4 h-4 text-amber-400/60 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400/60 leading-relaxed">
            Demo mode — voice generation simulated. Add <code className="text-amber-300/80 font-mono">FISH_AUDIO_API_KEY</code> to
            your environment to generate real audio. Free tier includes ~7 minutes/month.
          </p>
        </div>
      )}
    </div>
  )
}
