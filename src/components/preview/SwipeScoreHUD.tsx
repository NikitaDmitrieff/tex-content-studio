'use client'

import { SwipeMomentumResult } from '@/lib/types'
import { AlertTriangle } from 'lucide-react'

interface SwipeScoreHUDProps {
  result: SwipeMomentumResult
  currentSlide: number
  onBarHover: (index: number) => void
}

const MOMENTUM_COLORS: Record<string, string> = {
  strong: '#34d399',
  building: '#60a5fa',
  flat: '#fbbf24',
  drop: '#f87171',
}

export function SwipeScoreHUD({ result, currentSlide, onBarHover }: SwipeScoreHUDProps) {
  const maxScore = Math.max(...result.slide_scores.map((s) => s.swipe_probability), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Swipe Likelihood</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color:
              result.grade === 'A' ? '#34d399' :
              result.grade === 'B' ? '#60a5fa' :
              result.grade === 'C' ? '#fbbf24' : '#f87171',
          }}
        >
          {result.grade} · {result.overall_score}/100
        </span>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 60,
          paddingBottom: 2,
        }}
      >
        {result.slide_scores.map((slide, i) => {
          const height = Math.max(6, (slide.swipe_probability / maxScore) * 56)
          const isActive = i === currentSlide
          const isBelowThreshold = slide.swipe_probability < 0.6
          const color = isActive ? '#6d5aff' : MOMENTUM_COLORS[slide.momentum_type] ?? '#60a5fa'

          return (
            <div
              key={i}
              title={`Slide ${i + 1}: ${Math.round(slide.swipe_probability * 100)}% swipe`}
              onClick={() => onBarHover(i)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
              }}
            >
              {isBelowThreshold && !isActive && (
                <AlertTriangle style={{ width: 8, height: 8, color: '#fbbf24', flexShrink: 0 }} />
              )}
              <div
                style={{
                  width: '100%',
                  height,
                  background: isActive
                    ? 'linear-gradient(to top, #6d5aff, #8577ff)'
                    : color,
                  borderRadius: 3,
                  transition: 'height 0.3s ease, background 0.2s ease',
                  opacity: isActive ? 1 : 0.7,
                  boxShadow: isActive ? '0 0 8px rgba(109,90,255,0.5)' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: 8,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.3)',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {i + 1}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          Drop-off at slide {result.drop_off_slide + 1}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          ~{result.completion_rate_estimate} complete
        </span>
      </div>

      {result.critical_fixes.length > 0 && (
        <div
          style={{
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          <p style={{ fontSize: 10, color: '#fbbf24' }}>
            Fix slides: {result.critical_fixes.map((i) => i + 1).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
