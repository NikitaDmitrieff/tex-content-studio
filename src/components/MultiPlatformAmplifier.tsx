'use client'

import { useState } from 'react'
import { Story, Scene, RealityAnchors } from '@/lib/types'
import {
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { PlatformPack } from '@/app/api/generate-multiplatform-pack/route'

type PlatformKey = 'twitter' | 'youtube' | 'pinterest' | 'facebook' | 'instagram'

type PlatformConfig = {
  key: PlatformKey
  name: string
  icon: string
  description: string
}

const PLATFORMS: PlatformConfig[] = [
  { key: 'twitter', name: 'Twitter / X', icon: '𝕏', description: 'Thread · 270 chars/tweet' },
  { key: 'youtube', name: 'YouTube Shorts', icon: '▶', description: 'Script · ~55 sec' },
  { key: 'pinterest', name: 'Pinterest', icon: '📌', description: 'Caption · SEO-optimized' },
  { key: 'facebook', name: 'Facebook', icon: 'f', description: 'Post · Community tone' },
  { key: 'instagram', name: 'Instagram', icon: '◉', description: 'Reels caption' },
]

function getPlatformContent(pack: PlatformPack, key: PlatformKey): string {
  switch (key) {
    case 'twitter':
      return pack.twitter_thread.join('\n\n')
    case 'youtube':
      return pack.youtube_shorts_script
    case 'pinterest':
      return pack.pinterest_caption
    case 'facebook':
      return pack.facebook_post
    case 'instagram':
      return pack.instagram_caption
  }
}

export function MultiPlatformAmplifier({
  story,
  scenes,
  language,
}: {
  story: Story
  scenes: Scene[]
  language: 'en' | 'fr'
}) {
  const [platformData, setPlatformData] = useState<PlatformPack | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPlatform, setLoadingPlatform] = useState<PlatformKey | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedPlatform, setExpandedPlatform] = useState<PlatformKey | null>(null)

  async function generateAll() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-multiplatform-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          reality_anchors: story.is_reality_grounded ? story.reality_anchors : null,
        }),
      })
      const data = await res.json()
      if (data.pack) {
        setPlatformData(data.pack)
        setExpandedPlatform(null)
      }
    } catch (err) {
      console.error('Platform pack generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function regeneratePlatform(key: PlatformKey) {
    setLoadingPlatform(key)
    try {
      const res = await fetch('/api/generate-multiplatform-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          platform: key,
          reality_anchors: story.is_reality_grounded ? story.reality_anchors : null,
        }),
      })
      const data = await res.json()
      if (data.pack && platformData) {
        setPlatformData({ ...platformData, ...data.pack })
      }
    } catch (err) {
      console.error('Platform regeneration failed:', err)
    } finally {
      setLoadingPlatform(null)
    }
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function downloadPack() {
    if (!platformData) return
    const sections = [
      `=== TWITTER / X THREAD ===\n${platformData.twitter_thread.join('\n\n')}`,
      `=== YOUTUBE SHORTS SCRIPT ===\n${platformData.youtube_shorts_script}`,
      `=== PINTEREST CAPTION ===\n${platformData.pinterest_caption}`,
      `=== FACEBOOK POST ===\n${platformData.facebook_post}`,
      `=== INSTAGRAM CAPTION ===\n${platformData.instagram_caption}`,
    ]
    const text = sections.join('\n\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${story.character_name.replace(/\s+/g, '_')}_multiplatform_pack.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function getTwitterTweetCount(): number {
    return platformData?.twitter_thread.length ?? 0
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Cross-Platform Pack</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Same story, adapted for every channel
          </p>
        </div>
        <div className="flex items-center gap-2">
          {platformData && (
            <button
              onClick={downloadPack}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download Pack
            </button>
          )}
          <button
            onClick={generateAll}
            disabled={loading || scenes.length === 0}
            className="btn-accent flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{platformData ? 'Regenerate All' : 'Generate All Platforms'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!platformData && !loading && (
        <div className="glass-card p-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            {PLATFORMS.map((p) => (
              <div
                key={p.key}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg text-zinc-500"
              >
                {p.icon}
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-400 mb-1">
            Generate platform-ready content for all 5 channels at once
          </p>
          <p className="text-xs text-zinc-600">
            Twitter thread, YouTube Shorts script, Pinterest caption, Facebook post, Instagram reels
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((p, i) => (
            <div
              key={p.key}
              className="glass-card p-5 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
                <div>
                  <div className="h-3 w-24 bg-white/[0.06] rounded mb-1.5" />
                  <div className="h-2 w-32 bg-white/[0.04] rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-white/[0.04] rounded" />
                <div className="h-2 w-4/5 bg-white/[0.04] rounded" />
                <div className="h-2 w-3/5 bg-white/[0.04] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform cards */}
      {platformData && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform, i) => {
            const isExpanded = expandedPlatform === platform.key
            const isRegenerating = loadingPlatform === platform.key
            const content = getPlatformContent(platformData, platform.key)

            return (
              <div
                key={platform.key}
                className="glass-card p-5 transition-all"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animation: 'fadeIn 0.3s ease forwards',
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-zinc-300">
                      {platform.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{platform.name}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                        {platform.description}
                        {platform.key === 'twitter' && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500">
                            {getTwitterTweetCount()} tweets
                          </span>
                        )}
                        {platform.key === 'youtube' && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500">
                            ~55 sec
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Ready
                    </span>
                  </div>
                </div>

                {/* Expand/collapse toggle */}
                <button
                  onClick={() =>
                    setExpandedPlatform(isExpanded ? null : platform.key)
                  }
                  className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1.5 mb-2"
                >
                  <span>{isExpanded ? 'Hide preview' : 'Show preview'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Preview content */}
                {isExpanded && (
                  <div className="mb-3">
                    {platform.key === 'twitter' ? (
                      <div className="space-y-2">
                        {platformData.twitter_thread.map((tweet, idx) => (
                          <div
                            key={idx}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs text-zinc-300 leading-relaxed flex-1">{tweet}</p>
                              <button
                                onClick={() => copyToClipboard(tweet, `tweet-${idx}`)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300"
                                title="Copy this tweet"
                              >
                                {copied === `tweet-${idx}` ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="mt-1.5 text-right">
                              <span
                                className={`text-xs ${
                                  tweet.length > 270
                                    ? 'text-red-400'
                                    : tweet.length > 240
                                    ? 'text-amber-400'
                                    : 'text-zinc-600'
                                }`}
                              >
                                {tweet.length}/270
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : platform.key === 'youtube' ? (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                          {platformData.youtube_shorts_script
                            .split('\n')
                            .map((line, idx) => {
                              const isTimecode = /^\[[\d:]+/.test(line.trim())
                              return (
                                <span
                                  key={idx}
                                  className={isTimecode ? 'text-[var(--accent-hover)]' : ''}
                                >
                                  {line}
                                  {'\n'}
                                </span>
                              )
                            })}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                          {content}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(content, platform.key)}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 flex-1"
                  >
                    {copied === platform.key ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => regeneratePlatform(platform.key)}
                    disabled={isRegenerating}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.08] transition-all disabled:opacity-40"
                    title="Regenerate this platform"
                  >
                    {isRegenerating ? (
                      <div className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
