'use client'

import { useRef, useState } from 'react'
import { HeartbeatScene } from '@/lib/types'

export const SCENE_POSITION_LABELS = [
  'Opening',
  'Setup',
  'First Crack',
  'Collapse',
  'Turning Point',
  'Rising',
  'Climax',
  'Resolution',
] as const

// SVG viewport constants
const VB_W = 760
const VB_H = 280
const PAD = { top: 28, right: 24, bottom: 80, left: 52 }
const PW = VB_W - PAD.left - PAD.right  // 684
const PH = VB_H - PAD.top - PAD.bottom  // 172

function sceneX(position: number): number {
  return PAD.left + ((position - 1) / 7) * PW
}

function intensityY(intensity: number): number {
  return PAD.top + ((10 - intensity) / 9) * PH
}

function yToIntensity(svgY: number): number {
  const raw = 10 - ((svgY - PAD.top) / PH) * 9
  return Math.max(1, Math.min(10, Math.round(raw)))
}

function catmullRomPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

function intensityColor(v: number): string {
  if (v <= 3) return '#3b82f6'
  if (v <= 6) return '#f97316'
  return '#f59e0b'
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export function HeartbeatEditor({
  scenes,
  onChange,
}: {
  scenes: HeartbeatScene[]
  onChange: (scenes: HeartbeatScene[]) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const pts = scenes.map((s) => ({ x: sceneX(s.position), y: intensityY(s.intensity) }))
  const pathD = catmullRomPath(pts)

  function getSvgY(clientY: number): number {
    if (!svgRef.current) return PAD.top
    const rect = svgRef.current.getBoundingClientRect()
    return (clientY - rect.top) * (VB_H / rect.height)
  }

  function handlePointerDown(e: React.PointerEvent<SVGCircleElement>, idx: number) {
    e.preventDefault()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setDragging(idx)
    setSelected(idx)
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (dragging === null) return
    const newIntensity = yToIntensity(getSvgY(e.clientY))
    if (newIntensity !== scenes[dragging].intensity) {
      onChange(scenes.map((s, i) => (i === dragging ? { ...s, intensity: newIntensity } : s)))
    }
  }

  function handlePointerUp() {
    setDragging(null)
  }

  function adjustIntensity(idx: number, delta: number) {
    onChange(
      scenes.map((s, i) =>
        i === idx ? { ...s, intensity: Math.max(1, Math.min(10, s.intensity + delta)) } : s
      )
    )
  }

  function updateLabel(idx: number, label: string) {
    onChange(scenes.map((s, i) => (i === idx ? { ...s, label: label || undefined } : s)))
  }

  const gradientTopY = PAD.top
  const gradientBottomY = PAD.top + PH

  return (
    <div className="w-full space-y-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ touchAction: 'none', cursor: dragging !== null ? 'ns-resize' : 'default' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          <linearGradient
            id="hb-curve-grad"
            x1="0"
            y1={gradientTopY}
            x2="0"
            y2={gradientBottomY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient
            id="hb-fill-grad"
            x1="0"
            y1={gradientTopY}
            x2="0"
            y2={gradientBottomY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
          <line
            key={v}
            x1={PAD.left}
            y1={intensityY(v)}
            x2={PAD.left + PW}
            y2={intensityY(v)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Y axis tick labels */}
        {[1, 4, 7, 10].map((v) => (
          <text
            key={v}
            x={PAD.left - 8}
            y={intensityY(v) + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.25)"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
          >
            {v}
          </text>
        ))}

        {/* Y axis extreme labels */}
        <text
          x={PAD.left - 10}
          y={intensityY(10) - 4}
          textAnchor="end"
          fill="rgba(245,158,11,0.55)"
          fontSize="9"
          fontFamily="system-ui, sans-serif"
        >
          Triumphant
        </text>
        <text
          x={PAD.left - 10}
          y={intensityY(1) + 14}
          textAnchor="end"
          fill="rgba(59,130,246,0.55)"
          fontSize="9"
          fontFamily="system-ui, sans-serif"
        >
          Bottomed Out
        </text>

        {/* Area fill under curve */}
        {pathD && pts.length > 0 && (
          <path
            d={`${pathD} L ${pts[pts.length - 1].x},${gradientBottomY} L ${pts[0].x},${gradientBottomY} Z`}
            fill="url(#hb-fill-grad)"
          />
        )}

        {/* Smooth curve */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#hb-curve-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* X axis ticks and labels */}
        {scenes.map((s, i) => {
          const x = sceneX(s.position)
          const isSelectedPt = selected === i
          return (
            <g key={i}>
              <line
                x1={x}
                y1={gradientBottomY}
                x2={x}
                y2={gradientBottomY + 6}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={gradientBottomY + 20}
                textAnchor="middle"
                fill={isSelectedPt ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}
                fontSize="10"
                fontFamily="system-ui, sans-serif"
              >
                {SCENE_POSITION_LABELS[i]}
              </text>
              {/* Scene label chip — shown when label exists */}
              {s.label && (
                <>
                  <rect
                    x={x - 36}
                    y={gradientBottomY + 28}
                    width="72"
                    height="16"
                    rx="4"
                    fill="rgba(255,255,255,0.07)"
                  />
                  <text
                    x={x}
                    y={gradientBottomY + 39}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="9"
                    fontFamily="system-ui, sans-serif"
                  >
                    {truncate(s.label, 12)}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* Control points */}
        {scenes.map((s, i) => {
          const x = sceneX(s.position)
          const y = intensityY(s.intensity)
          const isSelected = selected === i
          const isDragging = dragging === i
          const color = intensityColor(s.intensity)

          return (
            <g key={i}>
              {/* Invisible large touch target (44px diameter) */}
              <circle
                cx={x}
                cy={y}
                r={22}
                fill="transparent"
                style={{ cursor: 'ns-resize' }}
                onPointerDown={(e) => handlePointerDown(e, i)}
              />

              {/* Selection ring */}
              {(isSelected || isDragging) && (
                <circle
                  cx={x}
                  cy={y}
                  r={15}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity="0.45"
                />
              )}

              {/* Main dot */}
              <circle
                cx={x}
                cy={y}
                r={isDragging ? 11 : 8}
                fill={color}
                stroke={isDragging || isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)'}
                strokeWidth={isDragging ? 2 : 1.5}
                style={{
                  cursor: 'ns-resize',
                  filter: isDragging ? `drop-shadow(0 0 8px ${color})` : isSelected ? `drop-shadow(0 0 4px ${color})` : undefined,
                  transition: 'r 0.1s',
                }}
                onPointerDown={(e) => handlePointerDown(e, i)}
              />

              {/* Intensity value above dot */}
              <text
                x={x}
                y={y - (isDragging ? 16 : 13)}
                textAnchor="middle"
                fill={isSelected || isDragging ? 'white' : 'rgba(255,255,255,0.55)'}
                fontSize={isSelected ? '12' : '11'}
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {s.intensity}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Selected point editor panel */}
      {selected !== null && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: intensityColor(scenes[selected].intensity) }}
            />
            <span className="text-xs font-medium text-zinc-300">
              {SCENE_POSITION_LABELS[selected]}
            </span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-400">
              Intensity:{' '}
              <span className="text-white font-bold">{scenes[selected].intensity}/10</span>
            </span>
          </div>

          {/* +/- buttons for mobile-friendly adjustment */}
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => adjustIntensity(selected, 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-bold text-sm flex items-center justify-center transition-colors"
              aria-label="Increase intensity"
            >
              +
            </button>
            <button
              onClick={() => adjustIntensity(selected, -1)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-bold text-sm flex items-center justify-center transition-colors"
              aria-label="Decrease intensity"
            >
              −
            </button>
          </div>

          {/* Label input */}
          <input
            className="flex-1 min-w-[160px] text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 placeholder-zinc-600 outline-none focus:border-white/20 transition-colors"
            placeholder="Emotional label (e.g. 'moment of shame')…"
            value={scenes[selected].label ?? ''}
            onChange={(e) => updateLabel(selected, e.target.value)}
          />

          <button
            onClick={() => setSelected(null)}
            className="text-zinc-600 hover:text-zinc-400 text-xs shrink-0 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
