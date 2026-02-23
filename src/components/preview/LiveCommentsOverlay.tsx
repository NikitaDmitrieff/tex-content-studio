'use client'

import { useState, useEffect } from 'react'
import { CommentSeed } from '@/lib/types'

const ARCHETYPE_COLORS: Record<CommentSeed['archetype'], string> = {
  gentle_skeptic: 'rgba(160,160,160,0.9)',
  personal_echo: '#f9a8d4',
  soft_provocateur: '#fcd34d',
  curiosity_magnet: '#93c5fd',
  shock_amplifier: '#86efac',
}

interface CommentItem {
  id: number
  seed: CommentSeed
  name: string
  initial: string
}

const FRENCH_NAMES = [
  'Marie', 'Pierre', 'Sophie', 'Louis', 'Camille', 'Antoine', 'Léa', 'Thomas',
  'Chloé', 'Nicolas', 'Emma', 'Alexandre', 'Manon', 'Hugo', 'Inès', 'Maxime',
]

function getRandomName(seed: number): string {
  return FRENCH_NAMES[seed % FRENCH_NAMES.length]
}

interface LiveCommentsOverlayProps {
  seeds: CommentSeed[]
}

export function LiveCommentsOverlay({ seeds }: LiveCommentsOverlayProps) {
  const [visibleComments, setVisibleComments] = useState<CommentItem[]>([])
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    if (seeds.length === 0) return

    const interval = setInterval(() => {
      setCounter((prev) => {
        const idx = prev % seeds.length
        const seed = seeds[idx]
        const name = getRandomName(prev * 7 + 3)
        const newComment: CommentItem = {
          id: prev,
          seed,
          name,
          initial: name[0].toUpperCase(),
        }

        setVisibleComments((existing) => {
          const next = [...existing, newComment]
          // Keep max 5 visible
          return next.slice(-5)
        })

        return prev + 1
      })
    }, 2500)

    return () => clearInterval(interval)
  }, [seeds])

  if (visibleComments.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 100,
        right: 52,
        width: 180,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      {visibleComments.map((c, i) => {
        const opacity = i === 0 ? 0.4 : i === 1 ? 0.6 : 0.85
        return (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              opacity,
              animation: 'commentSlideIn 0.4s ease-out',
              transition: 'opacity 0.5s ease',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: ARCHETYPE_COLORS[c.seed.archetype],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#000',
                flexShrink: 0,
              }}
            >
              {c.initial}
            </div>

            {/* Comment bubble */}
            <div
              style={{
                background: 'rgba(0,0,0,0.65)',
                borderRadius: 10,
                padding: '4px 8px',
                flex: 1,
              }}
            >
              <p style={{ fontSize: 9, color: ARCHETYPE_COLORS[c.seed.archetype], fontWeight: 700, marginBottom: 1 }}>
                {c.name}
              </p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                {c.seed.comment_text.slice(0, 60)}{c.seed.comment_text.length > 60 ? '…' : ''}
              </p>
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes commentSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
