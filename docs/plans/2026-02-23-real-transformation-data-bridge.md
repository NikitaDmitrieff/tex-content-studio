# Real Transformation Data Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Ground in Real Data" story creation path that lets creators input real transformation facts, generates a fictionalized character preserving those facts, and shows private reality-anchor metadata in ExportStep.

**Architecture:** Modal choice on "New Story" → RealDataBridgeModal 6-field form → new API generates fictionalized character with reality_anchors → modified generate-story uses anchors to force specific scenes → ExportStep shows private Reality Anchors tab.

**Tech Stack:** Next.js App Router, TypeScript, Claude Sonnet API, Supabase (tex_content schema), Tailwind CSS, Lucide React

---

### Task 1: DB Migration

**Files:**
- Modify: Supabase `tex_content.stories` table (via MCP)

**Step 1: Add columns to stories table**

```sql
ALTER TABLE tex_content.stories
  ADD COLUMN IF NOT EXISTS reality_anchors JSONB,
  ADD COLUMN IF NOT EXISTS is_reality_grounded BOOLEAN DEFAULT false;
```

**Step 2: Verify columns added**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tex_content' AND table_name = 'stories'
ORDER BY ordinal_position;
```

Expected: `reality_anchors` (jsonb) and `is_reality_grounded` (boolean) appear.

---

### Task 2: Update supabase.ts to use sandbox env vars as fallback

**Files:**
- Modify: `src/lib/supabase.ts`

**Step 1: Update env var resolution**

Replace the existing env var lines with:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_SANDBOX_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SANDBOX_SERVICE_ROLE_KEY
```

---

### Task 3: Update Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add new types and update Story**

Add after the existing types:

```typescript
export type JobCategory =
  | 'truck_driver'
  | 'nurse'
  | 'factory_worker'
  | 'school_worker'
  | 'office_worker'
  | 'other'

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'truck_driver', label: 'Truck driver' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'factory_worker', label: 'Factory worker' },
  { value: 'school_worker', label: 'School worker' },
  { value: 'office_worker', label: 'Office worker' },
  { value: 'other', label: 'Other' },
]

export const STRUGGLE_CHIPS = [
  { id: 'late_night_cravings', label: 'Late-night cravings' },
  { id: 'knee_pain', label: 'Knee pain' },
  { id: 'no_energy', label: 'No energy' },
  { id: 'family_pressure', label: 'Family pressure' },
  { id: 'no_time', label: 'No time' },
  { id: 'gym_embarrassment', label: 'Embarrassment at gym' },
  { id: 'doctors_warning', label: "Doctor's warning" },
] as const

export type RealDataInput = {
  journey: {
    start_weight?: string
    end_weight?: string
    timeframe?: string
    freeform?: string
  }
  job?: {
    category?: JobCategory
    struggle?: string
  }
  struggles?: string[]
  struggle_detail?: string
  turning_point?: string
  proof?: string
  privacy?: {
    change_age: boolean
    change_gender: boolean
    change_city: boolean
    change_job_type: boolean
  }
}

export type RealityAnchorItem = {
  fact: string
  type: 'real' | 'inspired' | 'invented'
  scene_index?: number | null
}

export type RealityAnchors = {
  anchors: RealityAnchorItem[]
  turning_point_scene_index?: number | null
  proof_scene_index?: number | null
}
```

Update the `Story` type to include:
```typescript
  reality_anchors?: RealityAnchors | null
  is_reality_grounded?: boolean
```

---

### Task 4: Create `generate-character-from-reality` API Route

**Files:**
- Create: `src/app/api/generate-character-from-reality/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { RealDataInput, RealityAnchors } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { realData: RealDataInput; tone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { realData, tone = 'comeback' } = body

  if (!realData?.journey) {
    return NextResponse.json({ error: 'Missing journey data' }, { status: 400 })
  }

  const privacyNotes: string[] = []
  if (realData.privacy?.change_age) privacyNotes.push('Change the age by ±5 years')
  if (realData.privacy?.change_gender) privacyNotes.push('Change the gender')
  if (realData.privacy?.change_city) privacyNotes.push('Use a different city')
  if (realData.privacy?.change_job_type) privacyNotes.push('Change the specific job title but keep the same category (e.g. nurse stays healthcare)')

  const journeyText = realData.journey.freeform
    ? realData.journey.freeform
    : [
        realData.journey.start_weight && `Started at ${realData.journey.start_weight}`,
        realData.journey.end_weight && `Reached ${realData.journey.end_weight}`,
        realData.journey.timeframe && `over ${realData.journey.timeframe}`,
      ].filter(Boolean).join(', ')

  if (!apiKey) {
    // Demo fallback
    const demoAnchors: RealityAnchors = {
      anchors: [
        { fact: journeyText, type: 'real', scene_index: null },
        { fact: realData.turning_point || 'A moment of clarity', type: 'real', scene_index: 3 },
      ],
      turning_point_scene_index: 3,
      proof_scene_index: 8,
    }
    return NextResponse.json({
      character: {
        name: 'Maria Santos',
        age: 42,
        job: 'Hospital receptionist',
        backstory: `Based on a real journey: ${journeyText}. Maria finally decided enough was enough.`,
        physical_description: 'Medium height, carrying extra weight, tired eyes that have seen everything, practical clothes for long shifts',
        personality_traits: ['Determined', 'Quietly stubborn', 'Protective of her family'],
        reason_never_exercised: "Two jobs and three kids — there was never a right time. Until there was.",
        visual_dna: "same heavyset woman, early 40s, dark hair pulled back, tired but determined expression, warm natural light, candid smartphone photo quality",
      },
      reality_anchors: demoAnchors,
      id: `new-${Date.now()}`,
      character_id: null,
    })
  }

  try {
    const client = new Anthropic({ apiKey })

    const prompt = `A real person wants to turn their genuine transformation story into a TikTok carousel. Your job is to invent a FICTIONAL character that preserves ALL the real details but protects the creator's identity.

REAL DATA PROVIDED:
- Journey: ${journeyText}
- Job category: ${realData.job?.category?.replace(/_/g, ' ') || 'unspecified'}
- Job struggle: ${realData.job?.struggle || 'not specified'}
- Specific struggles: ${realData.struggles?.join(', ') || 'not specified'}
- Struggle detail: ${realData.struggle_detail || 'not specified'}
- Turning point: ${realData.turning_point || 'not specified'}
- Proof/wins: ${realData.proof || 'not specified'}

PRIVACY MODIFICATIONS TO APPLY:
${privacyNotes.length > 0 ? privacyNotes.map(n => `- ${n}`).join('\n') : '- None requested — keep demographics realistic but invent name/face/city'}

YOUR TASK:
1. Invent a FICTIONAL name, face description, and slightly modified background
2. Preserve ALL specific numbers, struggles, and emotional beats as anchor facts
3. Generate a visual_dna prompt that fits the type of person (age, build, job)
4. Return a reality_anchors object listing what is real vs inspired vs invented

RULES:
- KEEP all real numbers (weights, timeframes, dress sizes, specific wins)
- KEEP all emotional beats (the turning point moment, the struggles)
- CHANGE name, face, city, and invent backstory details
- Apply any requested privacy modifications
- Make the character feel like a real, relatable person from that profession

Respond ONLY with a JSON object (no markdown, no code fences):
{
  "name": "Invented full name",
  "age": number,
  "job": "Their specific job title",
  "backstory": "2-3 sentences about their life situation — incorporate the real struggles naturally",
  "physical_description": "Detailed physical appearance matching the demographic and job",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "reason_never_exercised": "Why they never started — incorporate the real job/life struggles",
  "visual_dna": "Short locking prompt for image consistency (15-25 words)",
  "reality_anchors": {
    "anchors": [
      {"fact": "the actual real data point", "type": "real", "scene_index": null},
      {"fact": "something inspired by real", "type": "inspired", "scene_index": null},
      {"fact": "invented backstory detail", "type": "invented", "scene_index": null}
    ],
    "turning_point_scene_index": null,
    "proof_scene_index": null
  }
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1536,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleanedText)
    const { reality_anchors, ...character } = result

    let storyId: string | null = null

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          character_name: character.name,
          character_age: character.age,
          character_job: character.job,
          character_backstory: character.backstory,
          character_physical: character.physical_description,
          emotional_tone: tone,
          status: 'draft',
          reality_anchors: reality_anchors,
          is_reality_grounded: true,
        })
        .select('id')
        .single()

      if (!error && data) {
        storyId = data.id
      }
    }

    return NextResponse.json({
      character,
      reality_anchors,
      id: storyId || `new-${Date.now()}`,
      character_id: null,
    })
  } catch (err) {
    console.error('Reality character generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate character from reality', details: String(err) },
      { status: 500 }
    )
  }
}
```

---

### Task 5: Create `RealDataBridgeModal` Component

**Files:**
- Create: `src/components/RealDataBridgeModal.tsx`

This component is a 6-field multi-step form (stepper UX for mobile) that collects the real transformation data and calls the new API.

**Step 1: Write the component**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Lock,
} from 'lucide-react'
import { RealDataInput, JOB_CATEGORIES, STRUGGLE_CHIPS } from '@/lib/types'

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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-bold">Ground in Real Data</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Step {step} of {TOTAL_STEPS}</p>
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
                <h3 className="font-semibold mb-1">The Journey <span className="text-[var(--accent)] text-xs">Required</span></h3>
                <p className="text-xs text-zinc-500 mb-4">What actually changed? Be specific — these details become your story's foundation.</p>
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
                <label className="text-xs text-zinc-500 mb-1 block">OR — freeform description</label>
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
                <h3 className="font-semibold mb-1">The Job That Made It Hard <span className="text-zinc-500 text-xs">Optional</span></h3>
                <p className="text-xs text-zinc-500 mb-4">What kind of work made healthy habits harder?</p>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Job category</label>
                <div className="relative">
                  <select
                    className="input-dark text-sm appearance-none pr-8 w-full"
                    value={data.job?.category ?? ''}
                    onChange={(e) => updateJob({ category: e.target.value as RealDataInput['job'] extends undefined ? never : NonNullable<RealDataInput['job']>['category'] })}
                  >
                    <option value="">Select a job type...</option>
                    {JOB_CATEGORIES.map((j) => (
                      <option key={j.value} value={j.value}>{j.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">What about the job made it hard?</label>
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
                <h3 className="font-semibold mb-1">The Specific Struggle <span className="text-zinc-500 text-xs">Optional</span></h3>
                <p className="text-xs text-zinc-500 mb-4">Select what made it hard. These become specific scenes.</p>
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
                <h3 className="font-semibold mb-1">The Moment Everything Changed <span className="text-zinc-500 text-xs">Optional</span></h3>
                <p className="text-xs text-zinc-500 mb-4">The specific thing that finally made you act. The more concrete, the better.</p>
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
                <h3 className="font-semibold mb-1">The Proof <span className="text-zinc-500 text-xs">Optional</span></h3>
                <p className="text-xs text-zinc-500 mb-4">Specific wins that prove it worked. Numbers and concrete moments land hardest.</p>
              </div>
              <textarea
                className="input-dark text-sm"
                rows={5}
                placeholder="e.g. Ran my first 5K... fit into jeans from 10 years ago... stopped needing blood pressure meds... walked my daughter down the aisle without stopping"
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
                  Protect My Story <span className="text-zinc-500 text-xs">Optional</span>
                </h3>
                <p className="text-xs text-zinc-500 mb-4">Your story will be fictionalized. These settings add extra distance.</p>
              </div>
              <div className="space-y-3">
                {([
                  { key: 'change_age' as const, label: 'Change age by ±5 years' },
                  { key: 'change_gender' as const, label: 'Change gender' },
                  { key: 'change_city' as const, label: 'Change city' },
                  { key: 'change_job_type' as const, label: 'Change job type (keep category)' },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => updatePrivacy(key, !data.privacy?.[key])}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 relative ${
                        data.privacy?.[key] ? 'bg-[var(--accent)]' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        data.privacy?.[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                    <span className="text-sm text-zinc-300">{label}</span>
                  </label>
                ))}
              </div>
              {privacySummaryParts.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                  <p className="text-xs text-zinc-400">
                    Your character will have a{' '}
                    <span className="text-zinc-200">{privacySummaryParts.join(', ')}</span>
                    {' '}with the same emotional journey.
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
              className="btn-accent flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !hasJourneyData}
              className="btn-accent flex items-center gap-2"
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
```

---

### Task 6: Modify `NewStoryButton.tsx`

**Files:**
- Modify: `src/components/NewStoryButton.tsx`

Replace the component to show a choice modal first. The modal offers "Invent a Character" (existing flow) or "Ground in Real Data" (new flow).

```typescript
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
        router.push(`/story/new-${Date.now()}`)
      }
    } catch {
      router.push(`/story/new-${Date.now()}`)
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
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400"
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
                      AI generates a fictional person with a full backstory, ready to start immediately.
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
                      Enter real transformation facts. AI fictionalizes the identity but preserves every real detail for maximum authenticity.
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
```

---

### Task 7: Modify `generate-story` API to Use Reality Anchors

**Files:**
- Modify: `src/app/api/generate-story/route.ts`

**Step 1: Add `reality_anchors` to the request body type**

Update the `body` type definition to include:
```typescript
reality_anchors?: {
  anchors: { fact: string; type: string; scene_index: number | null }[]
  turning_point_scene_index?: number | null
  proof_scene_index?: number | null
}
```

**Step 2: Add reality anchors context to the Claude prompt**

After extracting the body, check if `reality_anchors` exists and build a `realityContext` string:

```typescript
const { character, emotional_tone, story_id, character_id, previous_episodes_summary, reality_anchors } = body

const realFacts = reality_anchors?.anchors.filter(a => a.type === 'real').map(a => a.fact) ?? []
const realityContext = realFacts.length > 0
  ? `\n\nREALITY ANCHORS — These are real facts that MUST be woven into specific scenes:\n${realFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nREQUIRED SCENES:\n- One scene MUST use the turning point moment exactly as described\n- One scene MUST reference the specific struggles listed\n- One scene MUST include the specific wins/proof\n`
  : ''
```

**Step 3: Include realityContext in the Claude prompt**

In the `client.messages.create` call, append `realityContext` to the message content after the main prompt content.

**Step 4: Update story record with reality_anchors if provided**

In the Supabase update section, add `reality_anchors` to the updatePayload if provided.

---

### Task 8: Create `RealityAnchorCard` Component

**Files:**
- Create: `src/components/RealityAnchorCard.tsx`

```typescript
'use client'

import { RealityAnchors } from '@/lib/types'

const BADGE_CONFIG = {
  real: { emoji: '🟢', label: 'Real fact', cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
  inspired: { emoji: '🔵', label: 'Inspired by real', cls: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
  invented: { emoji: '⚪', label: 'Invented', cls: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' },
}

export function RealityAnchorCard({ realityAnchors }: { realityAnchors: RealityAnchors }) {
  const { anchors } = realityAnchors

  const realCount = anchors.filter((a) => a.type === 'real').length
  const inspiredCount = anchors.filter((a) => a.type === 'inspired').length
  const inventedCount = anchors.filter((a) => a.type === 'invented').length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Reality Anchors</h3>
        <p className="text-xs text-zinc-500">
          Private reference — shows what came from real data vs what was invented. Not included in exports.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>🟢</span> {realCount} Real fact{realCount !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>🔵</span> {inspiredCount} Inspired by real
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>⚪</span> {inventedCount} Invented
        </div>
      </div>

      {/* Anchor list */}
      <div className="space-y-2">
        {anchors.map((anchor, i) => {
          const config = BADGE_CONFIG[anchor.type]
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border ${config.cls}`}
            >
              <span className="text-base shrink-0 mt-0.5">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed">{anchor.fact}</p>
                {anchor.scene_index != null && (
                  <p className="text-xs opacity-60 mt-0.5">Scene {anchor.scene_index + 1}</p>
                )}
              </div>
              <span className="text-[10px] opacity-60 shrink-0 self-start mt-0.5">{config.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

### Task 9: Modify `ExportStep.tsx` to Add Reality Anchors Tab

**Files:**
- Modify: `src/components/ExportStep.tsx`

**Step 1: Update `ActiveTab` type to include `'reality'`**

Change:
```typescript
type ActiveTab = 'export' | 'engagement' | 'voiceover'
```
To:
```typescript
type ActiveTab = 'export' | 'engagement' | 'voiceover' | 'reality'
```

**Step 2: Import `RealityAnchorCard`**

Add to imports:
```typescript
import { RealityAnchorCard } from './RealityAnchorCard'
import { RealityAnchors } from '@/lib/types'
```

**Step 3: Add the Reality tab button (after Voiceover Script tab)**

In the tab bar, after the voiceover script tab button, add:
```tsx
{story.is_reality_grounded && story.reality_anchors && (
  <button
    onClick={() => setActiveTab('reality')}
    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
      activeTab === 'reality'
        ? 'border-emerald-500 text-white'
        : 'border-transparent text-zinc-500 hover:text-zinc-300'
    }`}
  >
    🟢 Reality Anchors
  </button>
)}
```

**Step 4: Add Reality tab content panel**

After the voiceover tab content block, add:
```tsx
{activeTab === 'reality' && story.reality_anchors && (
  <>
    <div className="glass-card p-6">
      <RealityAnchorCard realityAnchors={story.reality_anchors as RealityAnchors} />
    </div>
    <div className="flex justify-between">
      <button onClick={onBack} className="btn-secondary flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Images
      </button>
    </div>
  </>
)}
```

---

### Task 10: Modify `StoryArcStep.tsx` for Auto-Scan and Reality Anchors

**Files:**
- Modify: `src/components/StoryArcStep.tsx`

**Step 1: Pass `reality_anchors` to generate-story API call**

In `handleGenerate`, add `reality_anchors: story.reality_anchors ?? undefined` to the POST body.

**Step 2: Auto-run scan for reality-grounded stories**

After the `onScenesUpdate(newScenes)` call in `handleGenerate`, add:
```typescript
if (story.is_reality_grounded && newScenes.length > 0) {
  try {
    const scanRes = await fetch('/api/scan-authenticity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenes: newScenes.map((s) => ({
          description: s.description,
          emotional_beat: s.emotional_beat,
        })),
        language: 'en',
      }),
    })
    const scanData = await scanRes.json()
    if (scanData.results) {
      setScanResults(scanData.results)
    }
  } catch {
    // scan auto-run is optional — ignore errors
  }
}
```

**Step 3: Pass `isRealityGrounded` to `AuthenticityScanner`**

In the JSX, update the AuthenticityScanner usage:
```tsx
<AuthenticityScanner
  scenes={scenes}
  onScenesUpdate={onScenesUpdate}
  scanResults={scanResults}
  onScanComplete={setScanResults}
  isRealityGrounded={story.is_reality_grounded}
/>
```

---

### Task 11: Modify `AuthenticityScanner.tsx` for Reality-Grounded Badge

**Files:**
- Modify: `src/components/AuthenticityScanner.tsx`

**Step 1: Add `isRealityGrounded` prop**

Update the component signature:
```typescript
export function AuthenticityScanner({
  scenes,
  onScenesUpdate,
  scanResults,
  onScanComplete,
  isRealityGrounded,
}: {
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  scanResults: ScanResult[]
  onScanComplete: (results: ScanResult[]) => void
  isRealityGrounded?: boolean
})
```

**Step 2: Show "Reality-Grounded Authenticity Score" badge in the global summary**

In the global summary section (next to the score and verdictLabel), add:
```tsx
{isRealityGrounded && (
  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
    🌱 Reality-Grounded
  </span>
)}
```

Also update the toggle button to show the reality-grounded badge when closed:
```tsx
{isRealityGrounded && avgScore !== null && !isOpen && (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-400">
    🌱 Reality-Grounded
  </span>
)}
```

---

### Task 12: Run Build Verification

**Step 1: Run TypeScript compiler check**

```bash
cd /private/tmp/builder-d5d883bb && npx tsc --noEmit
```

**Step 2: Run Next.js build**

```bash
cd /private/tmp/builder-d5d883bb && npm run build
```

Expected: Build succeeds with no TypeScript errors.
