'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Sparkles, Database, X, Star, Users, ArrowLeft } from 'lucide-react'
import { RealDataBridgeModal } from './RealDataBridgeModal'
import { CHARACTER_ROSTER, RosterCharacter } from '@/lib/character-roster'

type ModalState = 'closed' | 'choice' | 'roster' | 'real_data'

export function NewStoryButton() {
  const router = useRouter()
  const [modalState, setModalState] = useState<ModalState>('closed')
  const [loading, setLoading] = useState(false)

  async function handleInventCharacter() {
    setModalState('closed')
    setLoading(true)
    try {
      const res = await fetch('/api/generate-character', { method: 'POST' })
      const data = await res.json()
      if (data.character) {
        sessionStorage.setItem('pending_character', JSON.stringify(data.character))
      }
      if (data.id) {
        router.push(`/story/${data.id}`)
      } else {
        const tempId = `new-${Date.now()}`
        router.push(`/story/${tempId}`)
      }
    } catch {
      const tempId = `new-${Date.now()}`
      router.push(`/story/${tempId}`)
    } finally {
      setLoading(false)
    }
  }

  function handlePickRoster(index: number) {
    setModalState('closed')
    router.push(`/story/roster-${index}`)
  }

  return (
    <>
      <button
        onClick={() => setModalState('choice')}
        disabled={loading}
        className="btn-accent flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="spinner" />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>New Story</span>
          </>
        )}
      </button>

      {/* Choice modal */}
      {modalState === 'choice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalState('closed')}
          />
          <div className="relative w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Create New Story</h2>
              <button
                onClick={() => setModalState('closed')}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {/* Option 1: Pick from Roster */}
              <button
                onClick={() => setModalState('roster')}
                className="glass-card p-5 text-left hover:border-[var(--accent)]/40 transition-all group border-[var(--accent)]/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                        Pick from Roster
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {CHARACTER_ROSTER.length} pre-built characters ready to go. No waiting, no AI generation needed.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Invent a Character */}
              <button
                onClick={handleInventCharacter}
                className="glass-card p-5 text-left hover:border-white/20 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                      Invent a Character
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      AI generates a unique fictional person with a full backstory.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 3: Ground in Real Data */}
              <button
                onClick={() => setModalState('real_data')}
                className="glass-card p-5 text-left hover:border-white/20 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                        Ground in Real Data
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent-hover)] border border-[var(--accent)]/30">
                        <Star className="w-2.5 h-2.5" />
                        Authentic
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Enter real transformation facts. AI fictionalizes the identity but preserves every real detail.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster picker modal */}
      {modalState === 'roster' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalState('closed')}
          />
          <div className="relative w-full max-w-2xl glass-card p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalState('choice')}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold">Character Roster</h2>
                <span className="text-xs text-zinc-500">{CHARACTER_ROSTER.length} characters</span>
              </div>
              <button
                onClick={() => setModalState('closed')}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(['fr', 'en'] as const).map((locale) => {
              const chars = CHARACTER_ROSTER.map((c, i) => ({ ...c, _index: i })).filter((c) => c.locale === locale)
              if (chars.length === 0) return null
              return (
                <div key={locale} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{locale === 'fr' ? '\u{1F1EB}\u{1F1F7}' : '\u{1F1EC}\u{1F1E7}'}</span>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {locale === 'fr' ? 'French Characters' : 'English Characters'}
                    </h3>
                    <span className="text-[10px] text-zinc-600">{chars.length}</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {chars.map((char) => (
                      <button
                        key={char._index}
                        onClick={() => handlePickRoster(char._index)}
                        className="glass-card p-4 text-left hover:border-[var(--accent)]/30 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0 mt-0.5">{char.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-white text-sm group-hover:text-[var(--accent)] transition-colors truncate">
                                {char.name}
                              </h3>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 shrink-0">
                                {char.gender === 'F' ? '\u2640' : '\u2642'} {char.age}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-1.5">{char.job}</p>
                            <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                              {char.backstory}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Real Data Bridge Modal */}
      {modalState === 'real_data' && (
        <RealDataBridgeModal onClose={() => setModalState('closed')} />
      )}
    </>
  )
}
