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
  MessageSquare,
  Sparkles,
  Globe,
  Video,
  Zap,
  Music,
} from 'lucide-react'
import { EngagementKit } from './EngagementKit'
import { VoiceoverScriptPanel } from './VoiceoverScriptPanel'
import { RealityAnchorCard } from './RealityAnchorCard'
import { MultiPlatformAmplifier } from './MultiPlatformAmplifier'
import { HookLab } from './HookLab'
import { CommentStormEngine } from './CommentStormEngine'
import { AudioBriefPanel } from './AudioBriefPanel'
import { CommentSeedLab } from './CommentSeedLab'
import { RealityAnchors, ScreeningResult, AudioBrief } from '@/lib/types'

type ActiveTab = 'export' | 'hooklab' | 'engagement' | 'seeds' | 'voiceover' | 'reality' | 'amplify' | 'audio'

type PostCaption = {
  hook: string
  body: string
  cta: string
  hashtags: string
}

const SUGGESTED_HASHTAGS = [
  '#transformation',
  '#fitness',
  '#glow',
  '#realpeople',
  '#fitover40',
  '#fitover50',
  '#motivation',
  '#fyp',
  '#viral',
  '#nevertooolate',
  '#weightloss',
  '#realresults',
]

export function ExportStep({
  story,
  scenes,
  onScenesUpdate,
  onBack,
  screeningResult,
}: {
  story: Story
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  onBack: () => void
  screeningResult?: ScreeningResult | null
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('export')
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [caption, setCaption] = useState<PostCaption | null>(null)
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [showCommentStorm, setShowCommentStorm] = useState(false)
  const [audioBrief, setAudioBrief] = useState<AudioBrief | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scenesWithImages = scenes.filter((s) => s.image_url)

  function updateCaption(sceneId: string, captionText: string) {
    const updated = scenes.map((s) => (s.id === sceneId ? { ...s, caption: captionText } : s))
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
        body: JSON.stringify({
          story_id: story.id,
          scenes: scenesWithImages,
          audio_brief: audioBrief ?? undefined,
        }),
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

  async function handleGenerateCaption() {
    setGeneratingCaption(true)
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: story.character_name,
          character_age: story.character_age,
          character_job: story.character_job,
          emotional_tone: story.emotional_tone,
          scenes: scenes.map((s) => ({
            description: s.description,
            emotional_beat: s.emotional_beat,
          })),
        }),
      })
      const data = await res.json()
      if (data.caption) {
        setCaption(data.caption)
      }
    } catch (err) {
      console.error('Caption generation failed:', err)
    } finally {
      setGeneratingCaption(false)
    }
  }

  function getFullCaption(): string {
    if (!caption) return ''
    return `${caption.hook}\n\n${caption.body}\n\n${caption.cta}\n\n${caption.hashtags}`
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

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const voiceoverScript = generateVoiceoverScript()

  return (
    <div className="space-y-6">
      {/* Comment Storm Engine overlay */}
      {showCommentStorm && (
        <CommentStormEngine story={story} onClose={() => setShowCommentStorm(false)} />
      )}
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Preview carousel, generate post caption, and download
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage((l) => (l === 'en' ? 'fr' : 'en'))}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            title="Toggle language"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'en' ? 'EN' : 'FR'}
          </button>
          {activeTab === 'export' && (
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
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.08]">
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'export'
              ? 'border-[var(--accent)] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Export &amp; Caption
        </button>
        <button
          onClick={() => setActiveTab('hooklab')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'hooklab'
              ? 'border-[var(--accent)] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xs">🎣</span>
          Hook Lab
        </button>
        <button
          onClick={() => setActiveTab('engagement')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'engagement'
              ? 'border-[var(--accent)] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Engagement Kit
        </button>
        <button
          onClick={() => setActiveTab('seeds')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'seeds'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xs">🌱</span>
          Graines
        </button>
        {story.status === 'complete' && (
          <button
            onClick={() => setActiveTab('voiceover')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'voiceover'
                ? 'border-[var(--accent)] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Voiceover Script
          </button>
        )}
        <button
          onClick={() => setActiveTab('amplify')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'amplify'
              ? 'border-[var(--accent)] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Amplify
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent-hover)] border border-[var(--accent)]/20 leading-none">
            5 platforms
          </span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'audio'
              ? 'border-[var(--accent)] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          Audio Brief
        </button>
        {story.is_reality_grounded && story.reality_anchors && (
          <button
            onClick={() => setActiveTab('reality')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'reality'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🟢 Reality Anchors
          </button>
        )}
      </div>

      {/* Hook Lab tab */}
      {activeTab === 'hooklab' && (
        <>
          <HookLab
            story={story}
            scenes={scenes}
            screeningResult={screeningResult ?? null}
            onUseHook={(hookText) => {
              const scenesWithImages = scenes.filter((s) => s.image_url)
              if (scenesWithImages.length > 0) {
                const updated = scenes.map((s) =>
                  s.id === scenesWithImages[0].id ? { ...s, caption: hookText } : s
                )
                onScenesUpdate(updated)
              }
            }}
          />
          <div className="flex justify-between mt-6">
            <button onClick={onBack} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Images
            </button>
          </div>
        </>
      )}

      {/* Engagement Kit tab */}
      {activeTab === 'engagement' && (
        <EngagementKit
          story={story}
          scenes={scenes}
          existingCaption={caption}
          language={language}
        />
      )}

      {/* Comment Seed Lab tab */}
      {activeTab === 'seeds' && (
        <CommentSeedLab storyId={story.id} emotionalTone={story.emotional_tone} />
      )}

      {/* Voiceover Script tab */}
      {activeTab === 'voiceover' && (
        <VoiceoverScriptPanel story={story} scenes={scenes} />
      )}

      {/* Amplify tab */}
      {activeTab === 'amplify' && (
        <>
          <MultiPlatformAmplifier story={story} scenes={scenes} language={language} />
          <div className="flex justify-between">
            <button onClick={onBack} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Images
            </button>
          </div>
        </>
      )}

      {/* Audio Brief tab */}
      {activeTab === 'audio' && (
        <>
          <AudioBriefPanel story={story} scenes={scenes} onBriefGenerated={setAudioBrief} />
          <div className="flex justify-between mt-6">
            <button onClick={onBack} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Images
            </button>
          </div>
        </>
      )}

      {/* Reality Anchors tab */}
      {activeTab === 'reality' && story.reality_anchors && (
        <>
          <div className="glass-card p-6">
            <RealityAnchorCard realityAnchors={story.reality_anchors as RealityAnchors} />
          </div>
          <div className="flex justify-between">
            <button onClick={onBack} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Images
            </button>
          </div>
        </>
      )}

      {/* Export & Caption tab */}
      {activeTab === 'export' && (<>

      {/* Post Caption — PRIMARY section */}
      <div className="glass-card p-6 border-[var(--accent)]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
            TikTok Post Caption
          </h3>
          <div className="flex gap-2">
            {caption && (
              <button
                onClick={() => copyToClipboard(getFullCaption(), 'caption')}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                {copied === 'caption' ? (
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
            )}
            <button
              onClick={handleGenerateCaption}
              disabled={generatingCaption || scenes.length === 0}
              className="btn-accent flex items-center gap-2 text-xs py-1.5 px-3"
            >
              {generatingCaption ? (
                <>
                  <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>Writing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{caption ? 'Regenerate' : 'Generate Caption'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {caption ? (
          <div className="space-y-3">
            {/* Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-500">Hook (first line people see)</label>
                <button
                  onClick={() => copyToClipboard(caption.hook, 'hook')}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {copied === 'hook' ? 'copied' : 'copy'}
                </button>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-sm text-white font-medium">{caption.hook}</p>
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-500">Body</label>
                <button
                  onClick={() => copyToClipboard(caption.body, 'body')}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {copied === 'body' ? 'copied' : 'copy'}
                </button>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-sm text-zinc-300 whitespace-pre-line">{caption.body}</p>
              </div>
            </div>

            {/* CTA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-500">CTA (the soft app drop)</label>
                <button
                  onClick={() => copyToClipboard(caption.cta, 'cta')}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {copied === 'cta' ? 'copied' : 'copy'}
                </button>
              </div>
              <div className="bg-white/[0.03] border border-[var(--accent)]/10 rounded-lg p-3">
                <p className="text-sm text-[var(--accent-hover)]">{caption.cta}</p>
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-500">Hashtags</label>
                <button
                  onClick={() => copyToClipboard(caption.hashtags, 'hashtags')}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {copied === 'hashtags' ? 'copied' : 'copy'}
                </button>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-sm text-zinc-400">{caption.hashtags}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-1">
              Generate the TikTok post text — hook, body, soft CTA, and hashtags
            </p>
            <p className="text-xs text-zinc-600">
              This is where the app gets mentioned subtly (not in the carousel itself)
            </p>
          </div>
        )}
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
                    Slide {currentSlide + 1} overlay text
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
                onClick={() => copyToClipboard(voiceoverScript, 'voiceover')}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                {copied === 'voiceover' ? (
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

          {/* Quick hashtags */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4" />
              Quick Hashtags
            </h3>
            <div className="glass-card p-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => copyToClipboard(tag, tag)}
                    className={`px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs transition-all ${
                      copied === tag
                        ? 'text-emerald-400 border-emerald-500/30'
                        : 'text-zinc-400 hover:text-[var(--accent)] hover:border-[var(--accent)]/30'
                    }`}
                  >
                    {copied === tag ? 'copied' : tag}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(SUGGESTED_HASHTAGS.join(' '), 'all-tags')}
                className="mt-3 text-xs text-[var(--accent)] hover:underline"
              >
                {copied === 'all-tags' ? 'copied!' : 'Copy all hashtags'}
              </button>
            </div>
          </div>

          {/* All captions editor */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Slide Overlay Text</h3>
            <div className="glass-card p-4 space-y-3">
              {scenesWithImages.map((scene, i) => (
                <div key={scene.id}>
                  <label className="text-xs text-zinc-500 mb-1 block">Slide {i + 1}</label>
                  <input
                    type="text"
                    className="input-dark text-sm"
                    value={scene.caption || ''}
                    onChange={(e) => updateCaption(scene.id, e.target.value)}
                    placeholder={`Overlay text for slide ${i + 1}...`}
                  />
                </div>
              ))}
              {scenesWithImages.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">
                  Generate images first to add overlay text
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Images
        </button>
        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-500">
            {scenesWithImages.length} slide{scenesWithImages.length !== 1 ? 's' : ''} ready for
            export
          </div>
          <button
            onClick={() => setShowCommentStorm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #8B5CF6)',
              color: 'white',
              boxShadow: '0 0 20px rgba(139,92,246,0.3)',
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Créer la Suite
          </button>
        </div>
      </div>
      </>)}

      {/* Navigation shown on engagement tab too */}
      {activeTab === 'engagement' && (
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Images
          </button>
        </div>
      )}

      {/* Navigation shown on seeds tab */}
      {activeTab === 'seeds' && (
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Images
          </button>
        </div>
      )}

      {/* Navigation shown on voiceover tab */}
      {activeTab === 'voiceover' && (
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Images
          </button>
        </div>
      )}
    </div>
  )
}
