'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Sparkles, Database, X, Star } from 'lucide-react'
import { RealDataBridgeModal } from './RealDataBridgeModal'

type ModalState = 'closed' | 'choice' | 'real_data'

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
              {/* Option 1: Invent a Character */}
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
                      AI generates a fictional person with a full backstory, ready to start
                      immediately.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Ground in Real Data */}
              <button
                onClick={() => setModalState('real_data')}
                className="glass-card p-5 text-left hover:border-[var(--accent)]/40 transition-all group border-[var(--accent)]/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                        Ground in Real Data
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent-hover)] border border-[var(--accent)]/30">
                        <Star className="w-2.5 h-2.5" />
                        Most Authentic
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Enter real transformation facts. AI fictionalizes the identity but preserves
                      every real detail for maximum authenticity.
                    </p>
                  </div>
                </div>
              </button>
            </div>
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
