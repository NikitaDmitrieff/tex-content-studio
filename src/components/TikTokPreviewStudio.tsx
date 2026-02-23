'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Images,
  Download,
  Share2,
  Music2,
  MessageSquare,
  Zap,
  BarChart2,
  Eye,
} from 'lucide-react'
import { Story, Scene, HookWithScoring, CommentSeedKit, AudioBrief, SwipeMomentumResult, EMOTIONAL_TONES } from '@/lib/types'
import { PhoneMockupFrame } from './preview/PhoneMockupFrame'
import { TikTokFeedView } from './preview/TikTokFeedView'
import { HookSwitcherPanel } from './preview/HookSwitcherPanel'
import { SwipeScoreHUD } from './preview/SwipeScoreHUD'
import { SharePreviewModal } from './preview/SharePreviewModal'

type ControlTab = 'overview' | 'hooks' | 'comments' | 'sound' | 'scores'

interface TikTokPreviewStudioProps {
  story: Story
  scenes: Scene[]
  hookVariants?: HookWithScoring[] | null
  commentSeeds?: CommentSeedKit | null
  audioBrief?: AudioBrief | null
  swipeMomentumResult?: SwipeMomentumResult | null
}

export function TikTokPreviewStudio({
  story,
  scenes,
  hookVariants,
  commentSeeds,
  audioBrief,
  swipeMomentumResult,
}: TikTokPreviewStudioProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeHookIndex, setActiveHookIndex] = useState<number>(0)
  const [showComments, setShowComments] = useState(false)
  const [activeTab, setActiveTab] = useState<ControlTab>('overview')
  const [showShareModal, setShowShareModal] = useState(false)

  const emotionConfig = EMOTIONAL_TONES.find((t) => t.value === story.emotional_tone)
  const hasImages = scenes.some((s) => s.image_url)
  const soundName = audioBrief?.song_suggestions?.[0]
    ? `${audioBrief.song_suggestions[0].track} — ${audioBrief.song_suggestions[0].artist}`
    : undefined

  const activeHookCaption =
    hookVariants && hookVariants[activeHookIndex]
      ? hookVariants[activeHookIndex].hook.variant
      : null

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  // Build tab list based on available data
  const tabs: { id: ControlTab; label: string; icon: React.ReactNode; available: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: <Eye className="w-3.5 h-3.5" />, available: true },
    { id: 'hooks', label: 'Hooks', icon: <span style={{ fontSize: 12 }}>🎣</span>, available: !!hookVariants?.length },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-3.5 h-3.5" />, available: !!commentSeeds?.seeds?.length },
    { id: 'sound', label: 'Sound', icon: <Music2 className="w-3.5 h-3.5" />, available: !!audioBrief },
    { id: 'scores', label: 'Scores', icon: <BarChart2 className="w-3.5 h-3.5" />, available: !!swipeMomentumResult },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href={`/story/${story.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            fontSize: 13,
          }}
          className="hover:text-white transition-colors"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Back to story
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'white',
            }}
          >
            Cinematic Preview
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 20,
              background: 'rgba(109,90,255,0.15)',
              border: '1px solid rgba(109,90,255,0.3)',
              color: '#8577ff',
            }}
          >
            {story.character_name}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-secondary"
            style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Share2 style={{ width: 13, height: 13 }} />
            Share Preview
          </button>
          {hasImages ? (
            <Link
              href={`/story/${story.id}`}
              className="btn-secondary"
              style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download style={{ width: 13, height: 13 }} />
              Export Story
            </Link>
          ) : (
            <Link
              href={`/story/${story.id}`}
              className="btn-accent"
              style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Images style={{ width: 13, height: 13 }} />
              Generate Images
            </Link>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
        }}
        className="responsive-studio"
      >
        {/* ── Left: Phone mockup (45%) ─────────────────────────────── */}
        <div
          style={{
            width: '45%',
            minWidth: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            background: 'radial-gradient(ellipse at center, rgba(109,90,255,0.06) 0%, transparent 70%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <PhoneMockupFrame>
            <TikTokFeedView
              scenes={scenes}
              currentSlide={currentSlide}
              onSlideChange={handleSlideChange}
              activeHookCaption={activeHookCaption}
              showComments={showComments}
              commentSeeds={commentSeeds}
              soundName={soundName}
              characterName={story.character_name}
              characterJob={story.character_job}
              swipeMomentumResult={swipeMomentumResult}
            />
          </PhoneMockupFrame>
        </div>

        {/* ── Right: Control panel (55%) ───────────────────────────── */}
        <div
          style={{
            flex: 1,
            padding: '24px 28px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* Tab navigation */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 20,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              paddingBottom: 12,
            }}
          >
            {tabs.filter((t) => t.available).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  background: activeTab === tab.id ? 'rgba(109,90,255,0.18)' : 'transparent',
                  color: activeTab === tab.id ? '#8577ff' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1 }}>
            {/* ── Overview panel ──────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5 fade-in">
                {/* Character info */}
                <div className="glass-card p-5">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 12 }}>
                    Story Overview
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'white',
                        background: 'rgba(255,255,255,0.08)',
                        padding: '4px 10px',
                        borderRadius: 8,
                      }}
                    >
                      {story.character_name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {story.character_age}yo
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {story.character_job}
                    </span>
                    {emotionConfig && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#8577ff',
                          background: 'rgba(109,90,255,0.12)',
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(109,90,255,0.2)',
                        }}
                      >
                        {emotionConfig.emoji} {emotionConfig.label}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 12,
                    }}
                  >
                    <span>{scenes.length} slides</span>
                    <span>·</span>
                    <span>{hasImages ? `${scenes.filter((s) => s.image_url).length} images ready` : 'No images yet'}</span>
                  </div>
                </div>

                {/* Navigation tip */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Use <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>←</kbd>{' '}
                    <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>→</kbd>{' '}
                    keys or swipe on the phone to navigate slides. Click bars in the Scores panel to jump to a slide.
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {!hasImages && (
                    <Link
                      href={`/story/${story.id}`}
                      className="btn-accent"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        textDecoration: 'none',
                      }}
                    >
                      <Images style={{ width: 16, height: 16 }} />
                      Generate Images
                    </Link>
                  )}
                  {hasImages && (
                    <Link
                      href={`/story/${story.id}`}
                      className="btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        textDecoration: 'none',
                      }}
                    >
                      <Download style={{ width: 16, height: 16 }} />
                      Export Story
                    </Link>
                  )}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Share2 style={{ width: 16, height: 16 }} />
                    Share Preview
                  </button>
                </div>
              </div>
            )}

            {/* ── Hook Switcher panel ──────────────────────────────── */}
            {activeTab === 'hooks' && hookVariants && hookVariants.length > 0 && (
              <div className="glass-card p-5 fade-in">
                <HookSwitcherPanel
                  hookVariants={hookVariants}
                  activeIndex={activeHookIndex}
                  onSelect={(i) => {
                    setActiveHookIndex(i)
                    setCurrentSlide(0)
                  }}
                />
              </div>
            )}

            {/* ── Comments panel ───────────────────────────────────── */}
            {activeTab === 'comments' && commentSeeds && (
              <div className="space-y-4 fade-in">
                <div className="glass-card p-5">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                        French Comment Stream
                      </h3>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        Live comment simulation using your Comment Seeds
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => setShowComments((v) => !v)}
                      style={{
                        position: 'relative',
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: showComments ? '#6d5aff' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: showComments ? 22 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'white',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                      />
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    {showComments
                      ? 'Comments streaming on the phone — new comment every 2.5s'
                      : 'Toggle ON to see simulated French comments on the preview'}
                  </p>
                </div>

                {/* Comment preview list */}
                <div className="glass-card p-5">
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                    Seed Comments Preview
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {commentSeeds.seeds.slice(0, 5).map((seed, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 10,
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 10,
                              color: 'rgba(255,255,255,0.35)',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '1px 6px',
                              borderRadius: 6,
                            }}
                          >
                            {seed.archetype.replace(/_/g, ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: seed.controversy_level === 'hot_take' ? '#fbbf24' : 'rgba(255,255,255,0.25)',
                            }}
                          >
                            {seed.controversy_level}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                          {seed.comment_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Sound & Vibe panel ───────────────────────────────── */}
            {activeTab === 'sound' && audioBrief && (
              <div className="space-y-4 fade-in">
                <div className="glass-card p-5">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 14 }}>
                    Sound & Vibe
                  </h3>

                  {/* BPM */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'rgba(109,90,255,0.15)',
                        border: '1px solid rgba(109,90,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        animation: 'bpmPulse 0.6s ease-in-out infinite',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#8577ff' }}>BPM</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{audioBrief.bpm_range}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{audioBrief.mood_arc}</p>
                    </div>
                  </div>

                  {/* Genre tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {audioBrief.genre_tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '3px 8px',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Tooltip */}
                  <div
                    style={{
                      background: 'rgba(109,90,255,0.08)',
                      border: '1px solid rgba(109,90,255,0.2)',
                      borderRadius: 10,
                      padding: '8px 12px',
                    }}
                  >
                    <p style={{ fontSize: 11, color: '#8577ff' }}>
                      This sound syncs your story&apos;s emotional arc
                    </p>
                  </div>
                </div>

                {/* Top song */}
                {audioBrief.song_suggestions[0] && (
                  <div className="glass-card p-5">
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                      Top Recommendation
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #6d5aff, #8577ff)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'spin 3s linear infinite',
                        }}
                      >
                        <Music2 style={{ width: 20, height: 20, color: 'white' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                          {audioBrief.song_suggestions[0].track}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                          {audioBrief.song_suggestions[0].artist}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 1.5 }}>
                      {audioBrief.song_suggestions[0].why_it_fits}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Swipe Score HUD panel ────────────────────────────── */}
            {activeTab === 'scores' && swipeMomentumResult && (
              <div className="glass-card p-5 fade-in">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 14 }}>
                  Swipe Score
                </h3>
                <SwipeScoreHUD
                  result={swipeMomentumResult}
                  currentSlide={currentSlide}
                  onBarHover={handleSlideChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <SharePreviewModal
          storyId={story.id}
          currentSlide={currentSlide}
          captionVariant={activeHookCaption}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <style>{`
        @keyframes bpmPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .responsive-studio {
            flex-direction: column !important;
          }
          .responsive-studio > div:first-child {
            width: 100% !important;
            min-width: unset !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
        }
      `}</style>
    </div>
  )
}
