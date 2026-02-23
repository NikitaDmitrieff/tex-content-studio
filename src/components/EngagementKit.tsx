'use client'

import { useState } from 'react'
import { Story, Scene } from '@/lib/types'
import {
  Sparkles,
  Copy,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'

type VoiceCard = {
  phrases: string[]
  vocabulary_notes: string
  emotional_register: string
}

type CommentResponse = {
  comment_type: string
  response: string
}

type CaptionVariant = {
  label: string
  hook: string
  preview: string
}

type EngagementKitData = {
  voice_card: VoiceCard
  comment_responses: CommentResponse[]
  part2_hooks: [string, string, string]
  caption_variants: CaptionVariant[]
}

type SectionKey = 'voice_card' | 'comment_responses' | 'part2_hooks' | 'caption_variants'

type PostCaption = {
  hook: string
  body: string
  cta: string
  hashtags: string
} | null

function SkeletonLine({ width = 'full' }: { width?: string }) {
  return (
    <div
      className={`h-3.5 rounded bg-white/[0.07] animate-pulse w-${width}`}
    />
  )
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i % 3 === 2 ? '3/4' : 'full'} />
      ))}
    </div>
  )
}

export function EngagementKit({
  story,
  scenes,
  existingCaption,
  language,
}: {
  story: Story
  scenes: Scene[]
  existingCaption: PostCaption
  language: 'en' | 'fr'
}) {
  const [kitData, setKitData] = useState<EngagementKitData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingSections, setLoadingSections] = useState<Set<SectionKey>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedHook, setSelectedHook] = useState<number>(0)
  const [selectedVariant, setSelectedVariant] = useState<number>(0)

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function buildRequestBody(sectionOverride?: SectionKey) {
    return {
      character_name: story.character_name,
      character_age: story.character_age,
      character_job: story.character_job,
      character_backstory: story.character_backstory,
      emotional_tone: story.emotional_tone,
      scenes: scenes.map((s) => ({
        description: s.description,
        emotional_beat: s.emotional_beat,
      })),
      language,
      existing_caption: existingCaption,
      ...(sectionOverride ? { section: sectionOverride } : {}),
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setLoadingSections(new Set(['voice_card', 'comment_responses', 'part2_hooks', 'caption_variants']))
    try {
      const res = await fetch('/api/generate-engagement-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody()),
      })
      const data: EngagementKitData = await res.json()
      setKitData(data)
      setSelectedHook(0)
      setSelectedVariant(0)
    } catch (err) {
      console.error('Engagement kit generation failed:', err)
    } finally {
      setGenerating(false)
      setLoadingSections(new Set())
    }
  }

  async function handleRegenerateSection(section: SectionKey) {
    setLoadingSections((prev) => new Set(prev).add(section))
    try {
      const res = await fetch('/api/generate-engagement-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody(section)),
      })
      const data = await res.json()
      if (kitData && data[section]) {
        setKitData({ ...kitData, [section]: data[section] })
      }
    } catch (err) {
      console.error(`Section regeneration failed (${section}):`, err)
    } finally {
      setLoadingSections((prev) => {
        const next = new Set(prev)
        next.delete(section)
        return next
      })
    }
  }

  function buildCopyAllText(): string {
    if (!kitData) return ''
    const lines: string[] = []

    lines.push('=== CHARACTER VOICE CARD ===')
    lines.push('\nSignature Phrases:')
    kitData.voice_card.phrases.forEach((p) => lines.push(`• ${p}`))
    lines.push(`\nVocabulary Notes: ${kitData.voice_card.vocabulary_notes}`)
    lines.push(`Emotional Register: ${kitData.voice_card.emotional_register}`)

    lines.push('\n\n=== COMMENT RESPONSE BANK ===')
    kitData.comment_responses.forEach((r) => {
      lines.push(`\n[${r.comment_type}]`)
      lines.push(r.response)
    })

    lines.push('\n\n=== PART 2 HOOKS ===')
    kitData.part2_hooks.forEach((h, i) => lines.push(`\nHook ${i + 1}: ${h}`))

    lines.push('\n\n=== CAPTION A/B VARIANTS ===')
    kitData.caption_variants.forEach((v) => {
      lines.push(`\nVariant ${v.label}:`)
      lines.push(v.preview)
    })

    return lines.join('\n')
  }

  const isSectionLoading = (section: SectionKey) => loadingSections.has(section)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Generate a full engagement kit — voice profile, comment responses, hooks, and caption
            variants
          </p>
        </div>
        <div className="flex gap-2">
          {kitData && (
            <button
              onClick={() => copyToClipboard(buildCopyAllText(), 'copy-all')}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              {copied === 'copy-all' ? (
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
            onClick={handleGenerate}
            disabled={generating || scenes.length === 0}
            className="btn-accent flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="spinner" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{kitData ? 'Regenerate Kit' : 'Generate Engagement Kit'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!kitData && !generating && (
        <div className="glass-card p-12 text-center">
          <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-sm text-zinc-400 mb-1">Your engagement kit will appear here</p>
          <p className="text-xs text-zinc-600">
            Voice card, comment responses, Part 2 hooks, and caption variants — all in one click
          </p>
        </div>
      )}

      {/* Section 1: Character Voice Card */}
      {(kitData || generating) && (
        <div className="glass-card p-5">
          <SectionHeader
            title="Character Voice Card"
            section="voice_card"
            loading={isSectionLoading('voice_card')}
            onRegenerate={kitData ? () => handleRegenerateSection('voice_card') : undefined}
          />
          {isSectionLoading('voice_card') ? (
            <SectionSkeleton lines={6} />
          ) : kitData ? (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                  Signature Phrases
                </p>
                <div className="space-y-2">
                  {kitData.voice_card.phrases.map((phrase, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5"
                    >
                      <p className="text-sm text-zinc-200 leading-snug flex-1">{phrase}</p>
                      <button
                        onClick={() => copyToClipboard(phrase, `phrase-${i}`)}
                        className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
                      >
                        {copied === `phrase-${i}` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wide">
                    Vocabulary Notes
                  </p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {kitData.voice_card.vocabulary_notes}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wide">
                    Emotional Register
                  </p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {kitData.voice_card.emotional_register}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Section 2: Comment Response Bank */}
      {(kitData || generating) && (
        <div className="glass-card p-5">
          <SectionHeader
            title="Comment Response Bank"
            section="comment_responses"
            loading={isSectionLoading('comment_responses')}
            onRegenerate={kitData ? () => handleRegenerateSection('comment_responses') : undefined}
          />
          {isSectionLoading('comment_responses') ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                  <SectionSkeleton lines={3} />
                </div>
              ))}
            </div>
          ) : kitData ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {kitData.comment_responses.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 flex flex-col gap-2"
                >
                  <p className="text-[11px] text-[var(--accent)] font-medium uppercase tracking-wide">
                    {item.comment_type}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed flex-1">{item.response}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => copyToClipboard(item.response, `comment-${i}`)}
                      className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {copied === `comment-${i}` ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={async () => {
                        setLoadingSections((prev) => new Set(prev).add('comment_responses'))
                        try {
                          const res = await fetch('/api/generate-engagement-kit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(buildRequestBody('comment_responses')),
                          })
                          const data = await res.json()
                          if (kitData && data.comment_responses?.[i]) {
                            const updated = [...kitData.comment_responses]
                            updated[i] = data.comment_responses[i]
                            setKitData({ ...kitData, comment_responses: updated })
                          }
                        } catch (err) {
                          console.error('Comment regeneration failed:', err)
                        } finally {
                          setLoadingSections((prev) => {
                            const next = new Set(prev)
                            next.delete('comment_responses')
                            return next
                          })
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors ml-auto"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Section 3: Part 2 Hook Generator */}
      {(kitData || generating) && (
        <div className="glass-card p-5">
          <SectionHeader
            title="Part 2 Hook Generator"
            section="part2_hooks"
            loading={isSectionLoading('part2_hooks')}
            onRegenerate={kitData ? () => handleRegenerateSection('part2_hooks') : undefined}
          />
          {isSectionLoading('part2_hooks') ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                  <SectionSkeleton lines={2} />
                </div>
              ))}
            </div>
          ) : kitData ? (
            <div className="mt-4 space-y-3">
              {kitData.part2_hooks.map((hook, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedHook(i)}
                  className={`w-full text-left rounded-lg p-3 border transition-all ${
                    selectedHook === i
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5 shadow-[0_0_12px_rgba(109,90,255,0.1)]'
                      : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          selectedHook === i
                            ? 'border-[var(--accent)] bg-[var(--accent)]'
                            : 'border-white/20'
                        }`}
                      >
                        {selectedHook === i && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-200 leading-snug">{hook}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(hook, `hook-${i}`)
                      }}
                      className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
                    >
                      {copied === `hook-${i}` ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Section 4: Caption A/B Variants */}
      {(kitData || generating) && (
        <div className="glass-card p-5">
          <SectionHeader
            title="Caption A/B Variants"
            section="caption_variants"
            loading={isSectionLoading('caption_variants')}
            onRegenerate={kitData ? () => handleRegenerateSection('caption_variants') : undefined}
          />
          {isSectionLoading('caption_variants') ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <SectionSkeleton lines={5} />
                </div>
              ))}
            </div>
          ) : kitData ? (
            <div className="mt-4 space-y-3">
              {kitData.caption_variants.map((variant, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedVariant(i)}
                  className={`w-full text-left rounded-lg p-4 border transition-all ${
                    selectedVariant === i
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5 shadow-[0_0_12px_rgba(109,90,255,0.1)]'
                      : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          selectedVariant === i
                            ? 'border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10'
                            : 'border-white/10 text-zinc-500 bg-white/[0.03]'
                        }`}
                      >
                        {variant.label}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {i === 0 ? 'Question hook' : i === 1 ? 'Statement hook' : 'Confession hook'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(variant.preview, `variant-${i}`)
                      }}
                      className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {copied === `variant-${i}` ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm font-medium text-white mb-2">{variant.hook}</p>
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed">
                    {variant.preview}
                  </pre>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  loading,
  onRegenerate,
}: {
  title: string
  section: SectionKey
  loading: boolean
  onRegenerate?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-[var(--accent)]" />
        <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
      </div>
      {onRegenerate && !loading && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
      )}
      {loading && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <div className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} />
          <span>Generating...</span>
        </div>
      )}
    </div>
  )
}
