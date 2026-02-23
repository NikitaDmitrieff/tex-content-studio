'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, Bookmark, Share2, Pencil } from 'lucide-react'
import { ScreeningResult, SceneScore, PersonaReaction, Scene } from '@/lib/types'

// ────────────────────────────────────────────────────────────
// Virality gauge (SVG arc, 0-180°)
// ────────────────────────────────────────────────────────────
function ViralityGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const radius = 48
  const cx = 60
  const cy = 60
  // Arc goes from left (180°) to right (0°), i.e. a half circle
  const startAngle = 180
  const endAngle = startAngle - (animatedScore / 100) * 180
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + radius * Math.cos(toRad(startAngle))
  const y1 = cy + radius * Math.sin(toRad(startAngle))
  const x2 = cx + radius * Math.cos(toRad(endAngle))
  const y2 = cy + radius * Math.sin(toRad(endAngle))
  const largeArc = animatedScore > 50 ? 1 : 0
  // Sweep direction: counter-clockwise for left→right top arc
  const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`

  const color =
    animatedScore >= 75 ? '#22c55e' : animatedScore >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="68" viewBox="0 0 120 68">
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={animatedScore > 0 ? pathD : ''}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          style={{ transition: 'all 0.8s ease-out' }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {animatedScore}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
          fontFamily="system-ui"
        >
          / 100
        </text>
      </svg>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Verdict badge
// ────────────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: ScreeningResult['verdict'] }) {
  const map = {
    ready: { label: 'Prêt à tourner ✅', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    needs_work: { label: 'Améliorer d\'abord ⚠️', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    reshoot: { label: 'À refaire ❌', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  const { label, cls } = map[verdict]
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

// ────────────────────────────────────────────────────────────
// Persona card
// ────────────────────────────────────────────────────────────
function PersonaCard({ persona }: { persona: PersonaReaction }) {
  const completionPct = Math.round(persona.completion_likelihood * 100)
  const isHighCompletion = completionPct >= 75

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 border"
      style={{
        background: '#1a1a2e',
        borderColor: isHighCompletion ? 'rgba(109, 90, 255, 0.35)' : 'rgba(255,255,255,0.08)',
        boxShadow: isHighCompletion ? '0 0 20px rgba(109,90,255,0.12)' : 'none',
      }}
    >
      {/* Avatar + identity */}
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none">{persona.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{persona.name}</p>
          <p className="text-xs text-zinc-400">{persona.age} ans</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/60 text-zinc-300">{persona.job}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/60 text-zinc-300">{persona.city}</span>
          </div>
        </div>
      </div>

      {/* Completion bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-zinc-500">Complétion</span>
          <span
            className={`text-xs font-bold ${completionPct >= 75 ? 'text-emerald-400' : completionPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}
          >
            {completionPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${completionPct}%`,
              background:
                completionPct >= 75 ? '#22c55e' : completionPct >= 50 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* Comment bubble */}
      <div
        className="rounded-xl px-3 py-2.5 text-xs italic leading-relaxed"
        style={{ background: 'rgba(253, 224, 71, 0.08)', color: '#fde047', fontFamily: 'system-ui' }}
      >
        &ldquo;{persona.predicted_comment}&rdquo;
      </div>

      {/* Save / Share icons */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs ${persona.would_save ? 'text-amber-400' : 'text-zinc-600'}`}>
          <Bookmark className={`w-3.5 h-3.5 ${persona.would_save ? 'fill-amber-400' : ''}`} />
          <span>{persona.would_save ? 'Sauvegarde' : 'Passe'}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${persona.would_share ? 'text-blue-400' : 'text-zinc-600'}`}>
          <Share2 className={`w-3.5 h-3.5 ${persona.would_share ? 'fill-blue-400' : ''}`} />
          <span>{persona.would_share ? 'Partage' : 'Ne partage pas'}</span>
        </div>
      </div>

      {/* Emotional reaction */}
      <p className="text-xs text-zinc-400 border-t border-white/[0.06] pt-2">
        {persona.emotional_reaction}
      </p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Scene engagement bar
// ────────────────────────────────────────────────────────────
function SceneBar({
  sceneScore,
  onApplyRewrite,
}: {
  sceneScore: SceneScore
  onApplyRewrite: (sceneIndex: number, rewrite: string) => void
}) {
  const [showNote, setShowNote] = useState(false)
  const { engagement_score, danger_zone, note, rewrite_suggestion, scene_index } = sceneScore

  const barColor = danger_zone
    ? '#ef4444'
    : engagement_score >= 75
    ? '#22c55e'
    : '#f59e0b'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-1">
        <span className="text-xs text-zinc-500 w-5 shrink-0 text-right">{scene_index + 1}</span>
        <button
          className="flex-1 relative group"
          onClick={() => setShowNote((v) => !v)}
        >
          <div
            className="rounded-sm w-full transition-all duration-500"
            style={{
              height: `${Math.max(8, (engagement_score / 100) * 80)}px`,
              background: barColor,
              opacity: 0.85,
              outline: danger_zone ? `2px solid ${barColor}` : 'none',
              animation: danger_zone ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
            }}
          />
          <span
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: barColor }}
          >
            {engagement_score}
          </span>
        </button>
      </div>
      {showNote && (
        <div
          className="rounded-xl p-3 text-xs space-y-2 fade-in"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-zinc-300">{note}</p>
          {rewrite_suggestion && (
            <div className="space-y-1.5">
              <p className="text-zinc-500 italic">&ldquo;{rewrite_suggestion}&rdquo;</p>
              <button
                onClick={() => onApplyRewrite(scene_index, rewrite_suggestion)}
                className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                Appliquer cette réécriture
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
export function AudienceScreeningRoom({
  result,
  scenes,
  onScenesUpdate,
  onContinue,
  onClose,
  onRerun,
  isLoading,
}: {
  result: ScreeningResult | null
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  onContinue: () => void
  onClose: () => void
  onRerun: () => void
  isLoading: boolean
}) {
  function applyRewrite(sceneIndex: number, rewrite: string) {
    const updated = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, description: rewrite } : s
    )
    onScenesUpdate(updated)
  }

  function applyAllRewrites() {
    if (!result) return
    const updated = scenes.map((s, i) => {
      const score = result.scene_scores.find((sc) => sc.scene_index === i)
      if (score?.danger_zone && score.rewrite_suggestion) {
        return { ...s, description: score.rewrite_suggestion }
      }
      return s
    })
    onScenesUpdate(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Dark backdrop with film grain */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-4xl mx-4 my-6 rounded-2xl overflow-hidden"
        style={{
          background: '#0d0d1a',
          border: '1px solid rgba(255,255,255,0.08)',
          // CSS film grain via SVG noise filter
        }}
      >
        {/* Film grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundSize: '128px 128px',
          }}
        />

        {/* ── HEADER ── */}
        <div
          className="relative z-20 flex items-center justify-between gap-4 px-6 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-lg font-bold">Salle de Projection 🎬</h2>
            {result && (
              <>
                <ViralityGauge score={result.virality_score} />
                <VerdictBadge verdict={result.verdict} />
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="relative z-20 p-6 space-y-8">
          {isLoading ? (
            /* Loading state */
            <div className="space-y-6">
              <p className="text-center text-zinc-400 text-sm">
                🎬 Les spectateurs regardent votre histoire...
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 space-y-3 animate-pulse"
                    style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded bg-white/[0.06] w-3/4" />
                        <div className="h-2 rounded bg-white/[0.04] w-1/2" />
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06]" />
                    <div className="h-12 rounded-xl bg-white/[0.04]" />
                    <div className="h-2 rounded bg-white/[0.04] w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : result ? (
            <>
              {/* Section 1: Persona Reactions */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Réactions du public
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.personas.map((persona) => (
                    <PersonaCard key={persona.name} persona={persona} />
                  ))}
                </div>
              </section>

              {/* Section 2: Scene Engagement Timeline */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Engagement par scène
                </h3>
                <div
                  className="rounded-2xl p-5"
                  style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-end gap-2 min-h-[100px]">
                    {result.scene_scores.map((sc) => (
                      <div key={sc.scene_index} className="flex-1">
                        <SceneBar
                          sceneScore={sc}
                          onApplyRewrite={applyRewrite}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Zone sûre (75+)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <div className="w-3 h-3 rounded-sm bg-amber-500" /> Fragile (50–74)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <div className="w-3 h-3 rounded-sm bg-red-500" /> Danger (&lt;50)
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Improvements */}
              {result.key_improvements.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                      Améliorations clés
                    </h3>
                    {result.scene_scores.some((sc) => sc.danger_zone && sc.rewrite_suggestion) && (
                      <button
                        onClick={applyAllRewrites}
                        className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
                      >
                        <Pencil className="w-3 h-3" />
                        Appliquer toutes les suggestions
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {result.key_improvements.map((improvement, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl px-4 py-3"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[var(--accent)] mt-0.5 shrink-0" />
                        <p className="text-sm text-zinc-300">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>

        {/* ── FOOTER CTAs ── */}
        <div
          className="relative z-20 flex items-center justify-between gap-3 px-6 py-4 border-t flex-wrap"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">
              Ignorer et continuer
            </button>
            <button
              onClick={onRerun}
              disabled={isLoading}
              className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Relancer le dépistage
            </button>
          </div>
          <button
            onClick={onContinue}
            disabled={result?.verdict === 'reshoot' || isLoading}
            className="btn-accent text-sm flex items-center gap-2"
          >
            Lancer la production 🎬
          </button>
        </div>
      </div>
    </div>
  )
}
