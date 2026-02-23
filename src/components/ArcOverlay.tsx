'use client'

import { HeartbeatArc } from '@/lib/types'
import { Scene } from '@/lib/types'
import { SCENE_POSITION_LABELS } from './HeartbeatEditor'

// Estimate emotional intensity from emotional_beat text keywords
function estimateIntensity(emotionalBeat: string): number {
  const lower = emotionalBeat.toLowerCase()

  const highKeywords = ['triumph', 'breakthrough', 'victory', 'transformation', 'transcendence', 'peak', 'climax', 'glory', 'success', 'winning', 'achieved', 'triumphant']
  const medHighKeywords = ['progress', 'rising', 'shift', 'turning', 'hope', 'momentum', 'growing', 'improving', 'builds']
  const medKeywords = ['discovery', 'start', 'beginning', 'neutral', 'quiet', 'routine', 'mundane', 'normal', 'first step', 'small wins', 'early']
  const medLowKeywords = ['struggle', 'doubt', 'setback', 'embarrassment', 'difficult', 'hard', 'challenging', 'low point', 'stumble', 'fall']
  const lowKeywords = ['rock bottom', 'crisis', 'failure', 'shame', 'despair', 'breaking', 'hopeless', 'worst', 'bottom', 'crash', 'collapse', 'devastat']

  if (lowKeywords.some((k) => lower.includes(k))) return Math.round(1 + Math.random() * 2)
  if (medLowKeywords.some((k) => lower.includes(k))) return Math.round(3 + Math.random() * 2)
  if (highKeywords.some((k) => lower.includes(k))) return Math.round(8 + Math.random() * 2)
  if (medHighKeywords.some((k) => lower.includes(k))) return Math.round(7 + Math.random())
  if (medKeywords.some((k) => lower.includes(k))) return Math.round(4 + Math.random() * 2)

  return 5
}

function matchBadge(target: number, actual: number): { label: string; color: string } {
  const diff = Math.abs(target - actual)
  if (diff <= 1) return { label: 'On target', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
  if (diff <= 3) return { label: 'Close', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
  return { label: 'Off arc', color: 'text-red-400 bg-red-500/15 border-red-500/30' }
}

function intensityColor(v: number): string {
  if (v <= 3) return '#3b82f6'
  if (v <= 6) return '#f97316'
  return '#f59e0b'
}

// Minimal curve path for the overlay thumbnail
const OVL_W = 680
const OVL_H = 120
const PAD = { top: 12, right: 16, bottom: 16, left: 30 }
const PW = OVL_W - PAD.left - PAD.right
const PH = OVL_H - PAD.top - PAD.bottom

function ovlX(position: number) {
  return PAD.left + ((position - 1) / 7) * PW
}
function ovlY(intensity: number) {
  return PAD.top + ((10 - intensity) / 9) * PH
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

export function ArcOverlay({
  heartbeatArc,
  scenes,
}: {
  heartbeatArc: HeartbeatArc
  scenes: Scene[]
}) {
  const targetPts = heartbeatArc.scenes.map((s) => ({ x: ovlX(s.position), y: ovlY(s.intensity) }))
  const targetPath = catmullRomPath(targetPts)

  // Map generated scenes to their target positions (limit to 8)
  const sceneMatches = heartbeatArc.scenes.map((hs, i) => {
    const scene = scenes[i] ?? null
    const actualIntensity = scene ? estimateIntensity(scene.emotional_beat) : null
    return { target: hs, scene, actualIntensity }
  })

  const actualPts = sceneMatches
    .filter((m) => m.actualIntensity !== null)
    .map((m) => ({ x: ovlX(m.target.position), y: ovlY(m.actualIntensity!) }))

  const actualPath = catmullRomPath(actualPts)

  const avgDeviation =
    sceneMatches
      .filter((m) => m.actualIntensity !== null)
      .reduce((sum, m) => sum + Math.abs(m.target.intensity - m.actualIntensity!), 0) /
    (sceneMatches.filter((m) => m.actualIntensity !== null).length || 1)

  const matchScore = Math.max(0, Math.round(100 - avgDeviation * 10))

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Arc Alignment Check</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Designed arc vs. actual scene intensity
          </p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-xl border text-sm font-bold ${
            matchScore >= 80
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : matchScore >= 60
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          {matchScore}% arc match
        </div>
      </div>

      {/* Overlay curve */}
      <div className="rounded-xl bg-white/[0.02] overflow-hidden">
        <svg
          viewBox={`0 0 ${OVL_W} ${OVL_H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="ovl-target-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[1, 4, 7, 10].map((v) => (
            <line
              key={v}
              x1={PAD.left}
              y1={ovlY(v)}
              x2={PAD.left + PW}
              y2={ovlY(v)}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Target arc (designed) */}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              stroke="url(#ovl-target-grad)"
              strokeWidth="2"
              strokeDasharray="5,3"
              strokeLinecap="round"
              opacity="0.7"
            />
          )}

          {/* Actual arc (estimated from emotional beats) */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Target control points */}
          {heartbeatArc.scenes.map((s) => (
            <circle
              key={s.position}
              cx={ovlX(s.position)}
              cy={ovlY(s.intensity)}
              r="4"
              fill={intensityColor(s.intensity)}
              opacity="0.7"
            />
          ))}

          {/* Actual dots */}
          {sceneMatches.map((m) =>
            m.actualIntensity !== null ? (
              <circle
                key={m.target.position}
                cx={ovlX(m.target.position)}
                cy={ovlY(m.actualIntensity)}
                r="3"
                fill="rgba(255,255,255,0.5)"
              />
            ) : null
          )}

          {/* X-axis scene labels */}
          {heartbeatArc.scenes.map((s) => (
            <text
              key={s.position}
              x={ovlX(s.position)}
              y={OVL_H - 2}
              textAnchor="middle"
              fill="rgba(255,255,255,0.2)"
              fontSize="8"
              fontFamily="system-ui, sans-serif"
            >
              {SCENE_POSITION_LABELS[s.position - 1].split(' ')[0]}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,2" opacity="0.7" />
          </svg>
          <span className="text-zinc-500">Designed arc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          </svg>
          <span className="text-zinc-500">Estimated actual</span>
        </div>
      </div>

      {/* Per-scene match table */}
      <div className="space-y-2">
        {sceneMatches.map((m, i) => {
          if (!m.scene) return null
          const badge = m.actualIntensity !== null ? matchBadge(m.target.intensity, m.actualIntensity) : null
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              {/* Scene number */}
              <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 mt-0.5">
                {m.target.position}
              </div>

              {/* Target intensity dot */}
              <div className="flex items-center gap-1.5 shrink-0 mt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: intensityColor(m.target.intensity) }}
                />
                <span className="text-xs text-zinc-500">
                  Target: <span className="text-zinc-300 font-medium">{m.target.intensity}</span>
                </span>
                {m.target.label && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-500">
                    {m.target.label}
                  </span>
                )}
              </div>

              {/* Scene description */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {m.scene.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-zinc-500">
                    {m.scene.emotional_beat}
                  </span>
                  {badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
