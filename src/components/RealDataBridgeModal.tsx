'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ArrowLeft, ChevronDown, Lock } from 'lucide-react'
import { RealDataInput, JOB_CATEGORIES, STRUGGLE_CHIPS, JobCategory } from '@/lib/types'

const TOTAL_STEPS = 6

export function RealDataBridgeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RealDataInput>({
    journey: {},
    privacy: {
      change_age: false,
      change_gender: false,
      change_city: false,
      change_job_type: false,
    },
  })

  function updateJourney(updates: Partial<RealDataInput['journey']>) {
    setData((d) => ({ ...d, journey: { ...d.journey, ...updates } }))
  }

  function updateJob(updates: Partial<NonNullable<RealDataInput['job']>>) {
    setData((d) => ({ ...d, job: { ...d.job, ...updates } }))
  }

  function toggleStruggle(id: string) {
    setData((d) => {
      const current = d.struggles ?? []
      const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
      return { ...d, struggles: next }
    })
  }

  function updatePrivacy(key: keyof NonNullable<RealDataInput['privacy']>, value: boolean) {
    setData((d) => ({ ...d, privacy: { ...d.privacy!, [key]: value } }))
  }

  const hasJourneyData = Boolean(
    data.journey.freeform ||
      data.journey.start_weight ||
      data.journey.end_weight ||
      data.journey.timeframe
  )

  async function handleSubmit() {
    if (!hasJourneyData) return
    setLoading(true)
    try {
      const res = await fetch('/api/generate-character-from-reality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realData: data, tone: 'comeback' }),
      })
      const result = await res.json()
      if (result.id) {
        router.push(`/story/${result.id}`)
      } else {
        router.push(`/story/new-${Date.now()}`)
      }
    } catch {
      router.push(`/story/new-${Date.now()}`)
    } finally {
      setLoading(false)
    }
  }

  const privacySummaryParts: string[] = []
  if (data.privacy?.change_job_type) privacySummaryParts.push('different job (same category)')
  if (data.privacy?.change_age) privacySummaryParts.push('adjusted age ±5 years')
  if (data.privacy?.change_gender) privacySummaryParts.push('different gender')
  if (data.privacy?.change_city) privacySummaryParts.push('different city')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-bold">Ground in Real Data</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.06]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="p-6 min-h-[320px] flex flex-col">
          {/* Step 1: The Journey */}
          {step === 1 && (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">
                  The Journey{' '}
                  <span className="text-[var(--accent)] text-xs font-normal">Required</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  What actually changed? Be specific — these details become your story&apos;s
                  foundation.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Start weight</label>
                  <input
                    className="input-dark text-sm"
                    placeholder="e.g. 240lbs"
                    value={data.journey.start_weight ?? ''}
                    onChange={(e) => updateJourney({ start_weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">End weight</label>
                  <input
                    className="input-dark text-sm"
                    placeholder="e.g. 185lbs"
                    value={data.journey.end_weight ?? ''}
                    onChange={(e) => updateJourney({ end_weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Timeframe</label>
                  <input
                    className="input-dark text-sm"
                    placeholder="e.g. 5 months"
                    value={data.journey.timeframe ?? ''}
                    onChange={(e) => updateJourney({ timeframe: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">
                  OR — freeform description
                </label>
                <textarea
                  className="input-dark text-sm"
                  rows={3}
                  placeholder="e.g. quit sugar, started walking, lost 2 dress sizes in 5 months"
                  value={data.journey.freeform ?? ''}
                  onChange={(e) => updateJourney({ freeform: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: The Job */}
          {step === 2 && (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">
                  The Job That Made It Hard{' '}
                  <span className="text-zinc-500 text-xs font-normal">Optional</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  What kind of work made healthy habits harder?
                </p>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Job category</label>
                <div className="relative">
                  <select
                    className="input-dark text-sm appearance-none pr-8 w-full"
                    value={data.job?.category ?? ''}
                    onChange={(e) =>
                      updateJob({ category: (e.target.value as JobCategory) || undefined })
                    }
                  >
                    <option value="">Select a job type...</option>
                    {JOB_CATEGORIES.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">
                  What about the job made it hard?
                </label>
                <textarea
                  className="input-dark text-sm"
                  rows={3}
                  placeholder="e.g. night shifts, vending machine temptation, on your feet all day but never actual exercise"
                  value={data.job?.struggle ?? ''}
                  onChange={(e) => updateJob({ struggle: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 3: The Struggles */}
          {step === 3 && (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">
                  The Specific Struggle{' '}
                  <span className="text-zinc-500 text-xs font-normal">Optional</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Select what made it hard. These become specific scenes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STRUGGLE_CHIPS.map((chip) => {
                  const selected = data.struggles?.includes(chip.id)
                  return (
                    <button
                      key={chip.id}
                      onClick={() => toggleStruggle(chip.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent-hover)]'
                          : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">More detail</label>
                <textarea
                  className="input-dark text-sm"
                  rows={2}
                  placeholder="e.g. knee pain so bad I couldn't do stairs without holding the railing"
                  value={data.struggle_detail ?? ''}
                  onChange={(e) => setData((d) => ({ ...d, struggle_detail: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 4: The Turning Point */}
          {step === 4 && (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">
                  The Moment Everything Changed{' '}
                  <span className="text-zinc-500 text-xs font-normal">Optional</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  The specific thing that finally made you act. The more concrete, the better.
                </p>
              </div>
              <textarea
                className="input-dark text-sm"
                rows={5}
                placeholder="e.g. couldn't tie my shoes without getting winded... or doctor said pre-diabetic... or my kid asked why I never played with them"
                value={data.turning_point ?? ''}
                onChange={(e) => setData((d) => ({ ...d, turning_point: e.target.value }))}
              />
            </div>
          )}

          {/* Step 5: The Proof */}
          {step === 5 && (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">
                  The Proof{' '}
                  <span className="text-zinc-500 text-xs font-normal">Optional</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Specific wins that prove it worked. Numbers and concrete moments land hardest.
                </p>
              </div>
              <textarea
                className="input-dark text-sm"
                rows={5}
                placeholder="e.g. Ran my first 5K... fit into jeans from 10 years ago... stopped needing blood pressure meds..."
                value={data.proof ?? ''}
                onChange={(e) => setData((d) => ({ ...d, proof: e.target.value }))}
              />
            </div>
          )}

          {/* Step 6: Privacy */}
          {step === 6 && (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  Protect My Story{' '}
                  <span className="text-zinc-500 text-xs font-normal">Optional</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Your story will be fictionalized. These settings add extra distance.
                </p>
              </div>
              <div className="space-y-3">
                {(
                  [
                    { key: 'change_age' as const, label: 'Change age by ±5 years' },
                    { key: 'change_gender' as const, label: 'Change gender' },
                    { key: 'change_city' as const, label: 'Change city' },
                    { key: 'change_job_type' as const, label: 'Change job type (keep category)' },
                  ] as const
                ).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <button
                      role="switch"
                      aria-checked={data.privacy?.[key] ?? false}
                      onClick={() => updatePrivacy(key, !(data.privacy?.[key] ?? false))}
                      className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                        data.privacy?.[key] ? 'bg-[var(--accent)]' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          data.privacy?.[key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-zinc-300">{label}</span>
                  </label>
                ))}
              </div>
              {privacySummaryParts.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                  <p className="text-xs text-zinc-400">
                    Your character will have a{' '}
                    <span className="text-zinc-200">{privacySummaryParts.join(', ')}</span> with the
                    same emotional journey.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between p-6 border-t border-white/[0.08]">
          <button
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !hasJourneyData}
              className="btn-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !hasJourneyData}
              className="btn-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Generate Story</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
