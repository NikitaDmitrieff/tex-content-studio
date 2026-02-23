'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Scene, HookWithScoring, SwipeMomentumResult } from '@/lib/types'
import { LiveCommentsOverlay } from './LiveCommentsOverlay'
import { Heart, MessageCircle, Bookmark, Share2, Music } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getSceneGradient(emotionalBeat: string, index: number): string {
  const hash = hashString(emotionalBeat || `scene-${index}`)
  const h1 = hash % 360
  const h2 = (hash * 7) % 360
  return `linear-gradient(135deg, hsl(${h1}, 70%, 18%) 0%, hsl(${h2}, 60%, 8%) 100%)`
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function deriveEngagementNumbers(index: number, swipeScore?: number): {
  likes: number
  comments: number
  saves: number
  shares: number
} {
  const base = 1200 + (index * 317 + 841) % 7200
  const multiplier = swipeScore ? 0.5 + swipeScore : 1
  return {
    likes: Math.round(base * multiplier),
    comments: Math.round(base * 0.12 * multiplier),
    saves: Math.round(base * 0.08 * multiplier),
    shares: Math.round(base * 0.05 * multiplier),
  }
}

// ── Animated view counter ──────────────────────────────────────────────────────

function AnimatedViewCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1800
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return <span>{formatCount(count)}</span>
}

// ── Spinning disc ─────────────────────────────────────────────────────────────

function SpinningDisc({ soundName }: { soundName: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #222, #444)',
          border: '3px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'spin 3s linear infinite',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#111',
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        />
      </div>
      <p
        style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.7)',
          width: 44,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {soundName}
      </p>
    </div>
  )
}

// ── Scrolling marquee caption ─────────────────────────────────────────────────

function MarqueeText({ text, maxWidth }: { text: string; maxWidth: number }) {
  const isLong = text.length > 120
  if (!isLong) {
    return <span style={{ fontSize: 12, color: 'white', lineHeight: '1.4' }}>{text}</span>
  }
  return (
    <div style={{ overflow: 'hidden', width: maxWidth }}>
      <span
        style={{
          fontSize: 12,
          color: 'white',
          whiteSpace: 'nowrap',
          display: 'inline-block',
          animation: 'marquee 12s linear infinite',
        }}
      >
        {text}&nbsp;&nbsp;&nbsp;&nbsp;{text}
      </span>
    </div>
  )
}

// ── Ken Burns animated slide ──────────────────────────────────────────────────

function GradientSlide({
  gradient,
  description,
  isActive,
}: {
  gradient: string
  description: string
  isActive: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ken Burns zoom layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: gradient,
          animation: isActive ? 'kenBurns 4s ease-in-out infinite alternate' : 'none',
        }}
      />
      {/* Description text overlay */}
      <p
        style={{
          position: 'relative',
          zIndex: 2,
          fontSize: 16,
          fontStyle: 'italic',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.88)',
          textAlign: 'center',
          padding: '0 20px',
          lineHeight: 1.5,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          maxWidth: '85%',
        }}
      >
        &ldquo;{description}&rdquo;
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface TikTokFeedViewProps {
  scenes: Scene[]
  currentSlide: number
  onSlideChange: (index: number) => void
  activeHookCaption?: string | null
  showComments: boolean
  commentSeeds?: import('@/lib/types').CommentSeedKit | null
  soundName?: string
  characterName: string
  characterJob: string
  swipeMomentumResult?: SwipeMomentumResult | null
}

export function TikTokFeedView({
  scenes,
  currentSlide,
  onSlideChange,
  activeHookCaption,
  showComments,
  commentSeeds,
  soundName,
  characterName,
  characterJob,
  swipeMomentumResult,
}: TikTokFeedViewProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const FRAME_WIDTH = 296 // inner screen width (320 - 24px for bezels)

  // Derived data
  const slideCount = scenes.length
  const viewTarget = 12000 + (currentSlide * 3700) % 85000
  const username = '@' + characterName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + characterJob.toLowerCase().replace(/\s+/g, '_').slice(0, 12)
  const initials = characterName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const engagement = deriveEngagementNumbers(
    currentSlide,
    swipeMomentumResult?.slide_scores?.[currentSlide]?.swipe_probability
  )

  // Caption for current slide (hook variant overrides slide 0)
  function getCaptionForSlide(idx: number): string | null {
    if (idx === 0 && activeHookCaption) return activeHookCaption
    return scenes[idx]?.caption ?? null
  }

  // Hashtags derived from emotional tone / description
  const hashtags = ['#transformation', '#realpeople', '#motivation']

  // ── Touch / drag navigation ───────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true)
    dragStartX.current = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return
    const delta = e.clientX - dragStartX.current
    setDragOffset(delta)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging) return
    setIsDragging(false)
    const delta = e.clientX - dragStartX.current
    const threshold = FRAME_WIDTH * 0.25
    if (delta < -threshold && currentSlide < slideCount - 1) {
      onSlideChange(currentSlide + 1)
    } else if (delta > threshold && currentSlide > 0) {
      onSlideChange(currentSlide - 1)
    }
    setDragOffset(0)
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentSlide < slideCount - 1) onSlideChange(currentSlide + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentSlide > 0) onSlideChange(currentSlide - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentSlide, slideCount, onSlideChange])

  if (slideCount === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', padding: 20 }}>
          Generate a story arc to preview your carousel
        </p>
      </div>
    )
  }

  // Render slides
  const visibleIndices = [currentSlide - 1, currentSlide, currentSlide + 1].filter(
    (i) => i >= 0 && i < slideCount
  )

  const caption = getCaptionForSlide(currentSlide)

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── Slides carousel ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          transform: `translateX(calc(${-currentSlide * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {scenes.map((scene, idx) => {
          const gradient = getSceneGradient(scene.emotional_beat, idx)
          const isActive = idx === currentSlide
          const slideCaption = getCaptionForSlide(idx)

          return (
            <div
              key={scene.id}
              style={{ position: 'relative', width: '100%', flexShrink: 0, height: '100%' }}
            >
              {scene.image_url ? (
                <img
                  src={scene.image_url}
                  alt={`Slide ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <GradientSlide
                  gradient={gradient}
                  description={scene.description}
                  isActive={isActive}
                />
              )}

              {/* Caption overlay on each slide */}
              {slideCaption && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 80,
                    left: 0,
                    right: 56,
                    padding: '8px 12px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'white',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      lineHeight: 1.4,
                    }}
                  >
                    {slideCaption}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Previous slide peek ──────────────────────────────────────── */}
      {currentSlide > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 15,
            background: 'rgba(255,255,255,0.06)',
            zIndex: 10,
          }}
        />
      )}
      {currentSlide < slideCount - 1 && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 15,
            background: 'rgba(255,255,255,0.06)',
            zIndex: 10,
          }}
        />
      )}

      {/* ── Top gradient overlay ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* ── Bottom gradient overlay ──────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* ── Top HUD ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            top: -42,
            left: 10,
            right: 10,
            height: 2,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 1,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((currentSlide + 1) / slideCount) * 100}%`,
              background: 'white',
              borderRadius: 1,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* View counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 12,
            padding: '3px 8px',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>LIVE</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
            <AnimatedViewCounter target={viewTarget} />
          </span>
        </div>

        {/* Slide counter */}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: 10 }}>
          {currentSlide + 1}/{slideCount}
        </span>
      </div>

      {/* ── Right sidebar ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          right: 8,
          bottom: 90,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6d5aff, #8577ff)',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {initials}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fe2c55',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'white',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            +
          </div>
        </div>

        {/* Like */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Heart style={{ width: 28, height: 28, color: 'white', fill: 'white' }} />
          <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{formatCount(engagement.likes)}</span>
        </div>

        {/* Comment */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <MessageCircle style={{ width: 28, height: 28, color: 'white', fill: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{formatCount(engagement.comments)}</span>
        </div>

        {/* Bookmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Bookmark style={{ width: 28, height: 28, color: 'white', fill: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{formatCount(engagement.saves)}</span>
        </div>

        {/* Share */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Share2 style={{ width: 26, height: 26, color: 'white' }} />
          <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{formatCount(engagement.shares)}</span>
        </div>

        {/* Spinning disc */}
        <SpinningDisc soundName={soundName ?? 'Original sound'} />
      </div>

      {/* ── Bottom caption zone ──────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 10,
          right: 56,
          zIndex: 30,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {username}
        </p>

        {caption && (
          <div style={{ marginBottom: 6 }}>
            <MarqueeText text={caption} maxWidth={220} />
          </div>
        )}

        {/* Hashtags */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
          {hashtags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                color: '#69c1ff',
                background: 'rgba(105,193,255,0.12)',
                padding: '1px 6px',
                borderRadius: 10,
                border: '1px solid rgba(105,193,255,0.2)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Sound name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Music style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.7)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
            {soundName ? `${soundName} — trending` : 'Original sound'}
          </span>
        </div>
      </div>

      {/* ── Slide progress dots ──────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 8,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {scenes.map((_, i) => (
          <div
            key={i}
            onClick={() => onSlideChange(i)}
            style={{
              width: i === currentSlide ? 5 : 4,
              height: i === currentSlide ? 5 : 4,
              borderRadius: '50%',
              background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      {/* ── Live comment stream (right edge) ────────────────────────── */}
      {showComments && commentSeeds && (
        <LiveCommentsOverlay seeds={commentSeeds.seeds} />
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes kenBurns {
          from { transform: scale(1.0); }
          to { transform: scale(1.05); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
