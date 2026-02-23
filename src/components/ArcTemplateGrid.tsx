'use client'

import { HeartbeatScene } from '@/lib/types'

type ArcTemplate = {
  name: string
  intensities: number[]
  bestFor: string
  tiktokSignal: string
  description: string
}

export const ARC_TEMPLATES: ArcTemplate[] = [
  {
    name: 'V-Shape Comeback',
    intensities: [5, 4, 3, 1, 3, 6, 8, 9],
    bestFor: 'Classic underdog, weight-loss transformation',
    tiktokSignal: '+34% completion',
    description: 'Crash to the bottom, then a straight climb to glory',
  },
  {
    name: 'Double Dip',
    intensities: [6, 3, 6, 2, 5, 2, 7, 9],
    bestFor: 'Emotional rollercoaster, multiple setbacks',
    tiktokSignal: '+28% saves',
    description: 'Two devastating setbacks before the final triumph',
  },
  {
    name: 'Slow Burn',
    intensities: [2, 3, 4, 5, 6, 7, 8, 9],
    bestFor: 'Quiet transformation, subtle progress stories',
    tiktokSignal: '+22% shares',
    description: 'Gradual steady rise — no valleys, only upward',
  },
  {
    name: 'Cliff-Drop Opening',
    intensities: [9, 3, 2, 1, 3, 5, 7, 8],
    bestFor: "'You won't believe how far I fell' style",
    tiktokSignal: '+41% hook rate',
    description: 'Starts triumphant, then crashes immediately',
  },
  {
    name: 'Plateau Break',
    intensities: [5, 5, 5, 5, 5, 4, 9, 9],
    bestFor: 'Breakthrough moments, sudden change after stagnation',
    tiktokSignal: '+37% rewatch',
    description: 'Stuck at mediocre for 5 scenes, then sudden breakthrough',
  },
  {
    name: 'Roller Coaster',
    intensities: [7, 2, 8, 2, 7, 2, 8, 9],
    bestFor: 'Unpredictable journeys, keeps audience guessing',
    tiktokSignal: '+31% comments',
    description: 'Alternating highs and lows from start to finish',
  },
  {
    name: 'Hidden Strength',
    intensities: [3, 3, 2, 2, 3, 3, 9, 9],
    bestFor: 'Underestimated hero, silent grinder reveals',
    tiktokSignal: '+44% follows',
    description: 'Looks flat and failing until scene 6, then explosive',
  },
  {
    name: 'Crisis Peak',
    intensities: [3, 5, 7, 10, 7, 5, 3, 4],
    bestFor: 'Maximum tension mid-story, earned peace',
    tiktokSignal: '+29% saves',
    description: 'Builds to maximum crisis at scene 4, then falls into peace',
  },
]

export function buildArcScenes(intensities: number[]): HeartbeatScene[] {
  return intensities.map((intensity, i) => ({ position: i + 1, intensity }))
}

// Mini SVG thumbnail for each template
function MiniCurve({ intensities }: { intensities: number[] }) {
  const W = 120
  const H = 48
  const padX = 8
  const padY = 6
  const pw = W - padX * 2
  const ph = H - padY * 2

  function x(pos: number) {
    return padX + ((pos - 1) / 7) * pw
  }
  function y(v: number) {
    return padY + ((10 - v) / 9) * ph
  }

  const pts = intensities.map((v, i) => ({ x: x(i + 1), y: y(v) }))

  function catmullRom(points: { x: number; y: number }[]): string {
    if (points.length < 2) return ''
    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }

  const pathD = catmullRom(pts)
  const lastPt = pts[pts.length - 1]
  const firstPt = pts[0]
  const fillD = pathD + ` L ${lastPt.x},${H - padY} L ${firstPt.x},${H - padY} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mini-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="mini-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#mini-fill)" />
      <path
        d={pathD}
        fill="none"
        stroke="url(#mini-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill="rgba(255,255,255,0.35)" />
      ))}
    </svg>
  )
}

export function ArcTemplateGrid({
  selectedTemplate,
  onSelect,
}: {
  selectedTemplate?: string
  onSelect: (templateName: string, scenes: HeartbeatScene[]) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ARC_TEMPLATES.map((tpl) => {
        const isSelected = selectedTemplate === tpl.name
        return (
          <button
            key={tpl.name}
            onClick={() => onSelect(tpl.name, buildArcScenes(tpl.intensities))}
            className={`group relative flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_20px_rgba(109,90,255,0.15)]'
                : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
            }`}
            title={`Best for: ${tpl.bestFor}\nTikTok Signal: ${tpl.tiktokSignal}`}
          >
            {/* Mini curve thumbnail */}
            <div className="h-12 w-full rounded-lg overflow-hidden bg-white/[0.03]">
              <MiniCurve intensities={tpl.intensities} />
            </div>

            {/* Name */}
            <span
              className={`text-xs font-semibold leading-tight ${
                isSelected ? 'text-[var(--accent-hover)]' : 'text-zinc-300 group-hover:text-white'
              }`}
            >
              {tpl.name}
            </span>

            {/* TikTok signal badge */}
            <span
              className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                isSelected
                  ? 'bg-[var(--accent)]/20 text-[var(--accent-hover)]'
                  : 'bg-white/[0.06] text-zinc-500 group-hover:text-zinc-400'
              }`}
            >
              {tpl.tiktokSignal}
            </span>

            {/* Tooltip-style description (visible on hover) */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2.5 rounded-lg bg-zinc-800 border border-white/[0.1] text-xs text-zinc-300 shadow-xl z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              <p className="font-medium text-white mb-1">{tpl.name}</p>
              <p className="text-zinc-400 mb-1.5">{tpl.description}</p>
              <p className="text-zinc-500">
                <span className="text-zinc-400">Best for:</span> {tpl.bestFor}
              </p>
              <p className="text-emerald-400 font-medium mt-1">{tpl.tiktokSignal}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
