'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Story, CommentIntelligence, SequelBlueprint, SequelCommentDriver } from '@/lib/types'
import { X, MessageSquare, Brain, Clapperboard, ArrowRight, Sparkles } from 'lucide-react'

type Tab = 'battlefield' | 'intelligence' | 'blueprint'

const COMMENT_DRIVER_CONFIG: Record<
  SequelCommentDriver,
  { label: string; color: string; bg: string; border: string }
> = {
  skeptics: {
    label: '🔴 RÉPOND AUX SCEPTIQUES',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  question_askers: {
    label: '🔵 RÉVÈLE CE QU\'ILS VOULAIENT',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  emotional_amp: {
    label: '🟣 AMPLIFIE L\'ÉMOTION',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  believers: {
    label: '🟢 ANCRE LES CROYANTS',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  setup_part3: {
    label: '⚡ PLANT PARTIE 3',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
}

const AVATAR_EMOJIS = ['😤', '🤔', '😂', '💀', '🔥', '👀', '😭', '💪', '🙄', '❤️']

function getRandomAvatar(index: number) {
  return AVATAR_EMOJIS[index % AVATAR_EMOJIS.length]
}

function BattlefieldDonut({ classification }: { classification: CommentIntelligence['classification'] }) {
  const segments = [
    { key: 'believers', label: 'Croyants', value: classification.believers, color: '#22c55e' },
    { key: 'skeptics', label: 'Sceptiques', value: classification.skeptics, color: '#ef4444' },
    { key: 'question_askers', label: 'Curieux', value: classification.question_askers, color: '#3b82f6' },
    { key: 'emotional', label: 'Émouvants', value: classification.emotional, color: '#ec4899' },
    { key: 'tag_friends', label: 'Tagueurs', value: classification.tag_friends, color: '#8B5CF6' },
  ]

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 100
  const cx = 60
  const cy = 60
  const r = 46
  const innerR = 28
  const circumference = 2 * Math.PI * r

  let cumulativePercent = 0
  const arcs = segments.map((seg) => {
    const percent = seg.value / total
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return { ...seg, startPercent, percent }
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {arcs.map((arc) => {
          const startAngle = arc.startPercent * 2 * Math.PI - Math.PI / 2
          const endAngle = (arc.startPercent + arc.percent) * 2 * Math.PI - Math.PI / 2
          const x1 = cx + r * Math.cos(startAngle)
          const y1 = cy + r * Math.sin(startAngle)
          const x2 = cx + r * Math.cos(endAngle)
          const y2 = cy + r * Math.sin(endAngle)
          const largeArc = arc.percent > 0.5 ? 1 : 0

          if (arc.percent < 0.01) return null

          return (
            <path
              key={arc.key}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={arc.color}
              opacity={0.85}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={innerR} fill="#111827" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">
          {total}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#9ca3af" fontSize="7">
          comments
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center">
        {arcs.map((arc) => (
          <div key={arc.key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: arc.color }} />
            <span className="text-xs text-zinc-400">{arc.label} {arc.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommentBubble({ text, index }: { text: string; index: number }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs shrink-0">
        {getRandomAvatar(index)}
      </div>
      <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl rounded-tl-none px-3 py-2">
        <p className="text-xs text-zinc-300 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export function CommentStormEngine({
  story,
  onClose,
}: {
  story: Story
  onClose: () => void
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('battlefield')
  const [rawComments, setRawComments] = useState('')
  const [commentCount, setCommentCount] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [intelligence, setIntelligence] = useState<CommentIntelligence | null>(
    story.comment_intelligence ?? null
  )
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false)
  const [blueprint, setBlueprint] = useState<SequelBlueprint | null>(null)
  const [launchingSequel, setLaunchingSequel] = useState(false)
  const [skeletonCount, setSkeletonCount] = useState(0)

  useEffect(() => {
    const lines = rawComments
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    setCommentCount(lines.length)
  }, [rawComments])

  // Animate skeleton cards during analysis
  useEffect(() => {
    if (!analyzing) {
      setSkeletonCount(0)
      return
    }
    const interval = setInterval(() => {
      setSkeletonCount((n) => (n < 5 ? n + 1 : n))
    }, 400)
    return () => clearInterval(interval)
  }, [analyzing])

  async function handleAnalyze() {
    if (commentCount < 1) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_comments: rawComments, story_id: story.id }),
      })
      const data = await res.json()
      if (data.intelligence) {
        setIntelligence(data.intelligence)
        setActiveTab('intelligence')
      }
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerateBlueprint() {
    if (!intelligence) return
    setGeneratingBlueprint(true)
    try {
      const res = await fetch('/api/generate-sequel-from-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story.id,
          character: {
            name: story.character_name,
            age: story.character_age,
            job: story.character_job,
            backstory: story.character_backstory,
            physical_description: story.character_physical,
          },
          original_emotional_tone: story.emotional_tone,
          comment_intelligence: intelligence,
        }),
      })
      const data = await res.json()
      if (data.blueprint) {
        setBlueprint(data.blueprint)
        setActiveTab('blueprint')
      }
    } catch (err) {
      console.error('Blueprint generation failed:', err)
    } finally {
      setGeneratingBlueprint(false)
    }
  }

  async function handleLaunchSequel() {
    if (!blueprint) return
    setLaunchingSequel(true)
    try {
      if (story.character_id) {
        const res = await fetch('/api/create-episode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character_id: story.character_id }),
        })
        const data = await res.json()
        if (data.story_id) {
          // Store blueprint in sessionStorage for the new story workspace to pick up
          sessionStorage.setItem(`sequel_blueprint_${data.story_id}`, JSON.stringify(blueprint))
          router.push(`/story/${data.story_id}`)
          return
        }
      }

      // No character_id — create fresh story with blueprint pre-loaded
      const storyId = `new-${Date.now()}`
      sessionStorage.setItem(`sequel_blueprint_${storyId}`, JSON.stringify(blueprint))
      sessionStorage.setItem(
        `sequel_prefill_${storyId}`,
        JSON.stringify({
          character_name: story.character_name,
          character_age: story.character_age,
          character_job: story.character_job,
          character_backstory: story.character_backstory,
          character_physical: story.character_physical,
          emotional_tone: blueprint.sequel_emotional_tone,
        })
      )
      router.push(`/story/${storyId}`)
    } catch (err) {
      console.error('Launch failed:', err)
    } finally {
      setLaunchingSequel(false)
    }
  }

  const sequelPotential = intelligence?.tension_analysis.sequel_potential_score ?? 0
  const potentialColor =
    sequelPotential >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    sequelPotential >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-zinc-400 bg-zinc-500/10 border-zinc-500/30'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-4xl mx-auto my-4 sm:my-8 rounded-2xl border border-[#8B5CF6]/30 shadow-[0_0_60px_rgba(139,92,246,0.15)]"
        style={{ background: 'rgba(10,8,20,0.97)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Comment Storm Engine</h2>
              <p className="text-xs text-zinc-500">Transformez vos commentaires en carburant pour la Partie 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.08]">
          <button
            onClick={() => setActiveTab('battlefield')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center justify-center gap-2 ${
              activeTab === 'battlefield'
                ? 'border-[#8B5CF6] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comment</span> Battlefield
          </button>
          <button
            onClick={() => intelligence && setActiveTab('intelligence')}
            disabled={!intelligence}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center justify-center gap-2 ${
              activeTab === 'intelligence'
                ? 'border-[#8B5CF6] text-white'
                : intelligence
                ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                : 'border-transparent text-zinc-700 cursor-not-allowed'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Audience Intelligence
          </button>
          <button
            onClick={() => blueprint && setActiveTab('blueprint')}
            disabled={!blueprint}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center justify-center gap-2 ${
              activeTab === 'blueprint'
                ? 'border-[#8B5CF6] text-white'
                : blueprint
                ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                : 'border-transparent text-zinc-700 cursor-not-allowed'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Sequel Blueprint
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* ── TAB 1: COMMENT BATTLEFIELD ── */}
          {activeTab === 'battlefield' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-200">
                    Commentaires TikTok
                  </label>
                  {commentCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                      {commentCount} commentaire{commentCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* TikTok-style textarea */}
                <div className="relative rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: '#0d0d1a' }}>
                  {/* Decorative avatar placeholders */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none opacity-20">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-zinc-700" />
                    ))}
                  </div>
                  <textarea
                    value={rawComments}
                    onChange={(e) => setRawComments(e.target.value)}
                    placeholder="Collez vos commentaires TikTok ici... (au moins 5 commentaires pour de meilleurs résultats)&#10;&#10;Exemple:&#10;omg cette transformation 😭🙏&#10;c'est fake personne perd autant en si peu de temps&#10;tu manges quoi exactement??&#10;je tague mon père il a besoin de voir ça"
                    className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-600 resize-none outline-none pl-4 pr-4 py-4 min-h-[280px] sm:min-h-[320px] leading-relaxed"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(139,92,246,0.3) transparent',
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Émojis, abréviations, argot français acceptés — collez tel quel
                </p>
              </div>

              {/* Loading skeleton */}
              {analyzing && (
                <div className="space-y-2">
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-6 h-6 rounded-full bg-white/[0.06]" />
                      <div
                        className="h-8 rounded-xl bg-white/[0.04]"
                        style={{ width: `${55 + (i * 17) % 40}%` }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={commentCount < 1 || analyzing}
                className="w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: analyzing
                    ? 'rgba(139,92,246,0.3)'
                    : 'linear-gradient(135deg, #7c3aed, #8B5CF6)',
                  color: 'white',
                  boxShadow: analyzing ? 'none' : '0 0 24px rgba(139,92,246,0.3)',
                }}
              >
                {analyzing ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyser les Commentaires
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── TAB 2: AUDIENCE INTELLIGENCE ── */}
          {activeTab === 'intelligence' && intelligence && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: Donut + comment bubbles */}
                <div className="lg:w-[40%] space-y-5">
                  <div className="glass-card p-5">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                      Battlefield des Commentaires
                    </h3>
                    <BattlefieldDonut classification={intelligence.classification} />
                  </div>

                  <div className="space-y-3">
                    {(
                      [
                        { key: 'believers', label: '🟢 Croyants', quotes: intelligence.top_quotes.believers },
                        { key: 'skeptics', label: '🔴 Sceptiques', quotes: intelligence.top_quotes.skeptics },
                        { key: 'question_askers', label: '🔵 Curieux', quotes: intelligence.top_quotes.question_askers },
                      ] as const
                    ).map(({ label, quotes }, groupIdx) => (
                      <div key={groupIdx} className="glass-card p-4">
                        <p className="text-xs font-medium text-zinc-400 mb-3">{label}</p>
                        <div className="space-y-2">
                          {quotes.slice(0, 3).map((q, i) => (
                            <CommentBubble key={i} text={q} index={groupIdx * 3 + i} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Tension analysis */}
                <div className="lg:w-[60%] space-y-4">
                  <div className="glass-card p-5 border-[#8B5CF6]/20">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      Analyse de Tension
                    </h3>

                    <div className="space-y-4">
                      <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1.5">
                          Le Débat Principal
                        </p>
                        <p className="text-sm text-zinc-200 leading-relaxed">
                          {intelligence.tension_analysis.primary_debate}
                        </p>
                      </div>

                      <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1.5">
                          La Question Brûlante
                        </p>
                        <p className="text-sm text-zinc-200 leading-relaxed">
                          {intelligence.tension_analysis.burning_question}
                        </p>
                      </div>

                      <div className="rounded-xl p-4" style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
                        <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider mb-1.5">
                          Le Signal Viral
                        </p>
                        <p className="text-sm text-zinc-200 leading-relaxed">
                          {intelligence.tension_analysis.viral_signal}
                        </p>
                      </div>

                      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <div>
                          <p className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-1">
                            Potentiel Suite
                          </p>
                          <p className="text-xs text-zinc-500">Score d&apos;engagement prédit pour la Partie 2</p>
                        </div>
                        <div className={`text-2xl font-bold px-4 py-2 rounded-xl border ${potentialColor}`}>
                          {sequelPotential}
                          <span className="text-sm font-normal ml-0.5">/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('blueprint')}
                    className="w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #8B5CF6)',
                      color: 'white',
                      boxShadow: '0 0 24px rgba(139,92,246,0.3)',
                    }}
                  >
                    <Clapperboard className="w-4 h-4" />
                    Construire le Blueprint Sequel
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: SEQUEL BLUEPRINT ── */}
          {activeTab === 'blueprint' && (
            <div className="space-y-5">
              {!blueprint && !generatingBlueprint && intelligence && (
                <div className="text-center py-10">
                  <Clapperboard className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                  <p className="text-sm text-zinc-400 mb-2">
                    Prêt à générer votre arc Partie 2 en 7 scènes
                  </p>
                  <p className="text-xs text-zinc-600 mb-6">
                    Chaque scène sera conçue pour répondre à un segment spécifique de vos commentateurs
                  </p>
                  <button
                    onClick={handleGenerateBlueprint}
                    className="min-h-[48px] px-8 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mx-auto transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #8B5CF6)',
                      color: 'white',
                      boxShadow: '0 0 24px rgba(139,92,246,0.3)',
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Générer la Suite
                  </button>
                </div>
              )}

              {generatingBlueprint && (
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="glass-card p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/[0.04] rounded w-3/4" />
                          <div className="h-3 bg-white/[0.04] rounded w-full" />
                          <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!generatingBlueprint && blueprint && (
                <div className="space-y-5">
                  {/* Sequel hook */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
                  >
                    <p className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-2">
                      Hook Partie 2 — Callback Commentaires
                    </p>
                    <p className="text-base font-medium text-white leading-relaxed">
                      &ldquo;{blueprint.sequel_hook}&rdquo;
                    </p>
                  </div>

                  {/* Scene cards */}
                  <div className="space-y-3">
                    {blueprint.scenes.map((scene, i) => {
                      const driver = COMMENT_DRIVER_CONFIG[scene.comment_driver]
                      return (
                        <div key={i} className="glass-card p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs text-zinc-500">{scene.emotional_beat}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${driver.color} ${driver.bg} ${driver.border}`}
                                >
                                  {driver.label}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-300 leading-relaxed">{scene.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Launch button */}
                  <button
                    onClick={handleLaunchSequel}
                    disabled={launchingSequel}
                    className="w-full min-h-[52px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: launchingSequel
                        ? 'rgba(139,92,246,0.3)'
                        : 'linear-gradient(135deg, #6d28d9, #8B5CF6, #a78bfa)',
                      color: 'white',
                      boxShadow: launchingSequel ? 'none' : '0 0 32px rgba(139,92,246,0.4)',
                    }}
                  >
                    {launchingSequel ? (
                      <>
                        <div
                          className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                          style={{ animation: 'spin 0.8s linear infinite' }}
                        />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        Lancer cette suite →
                      </>
                    )}
                  </button>

                  {/* Regenerate */}
                  <div className="text-center">
                    <button
                      onClick={handleGenerateBlueprint}
                      disabled={generatingBlueprint}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      Régénérer le blueprint
                    </button>
                  </div>
                </div>
              )}

              {/* Generate button shown when on tab but no blueprint yet and no intelligence */}
              {activeTab === 'blueprint' && !blueprint && !generatingBlueprint && !intelligence && (
                <div className="text-center py-10">
                  <p className="text-sm text-zinc-500">
                    Analysez d&apos;abord vos commentaires dans l&apos;onglet Battlefield.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate blueprint button from intelligence tab */}
        {activeTab === 'intelligence' && intelligence && (
          <div className="px-6 pb-6">
            <button
              onClick={handleGenerateBlueprint}
              disabled={generatingBlueprint}
              className="w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: generatingBlueprint
                  ? 'rgba(139,92,246,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #8B5CF6)',
                color: 'white',
                boxShadow: generatingBlueprint ? 'none' : '0 0 24px rgba(139,92,246,0.3)',
              }}
            >
              {generatingBlueprint ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer la Suite
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
