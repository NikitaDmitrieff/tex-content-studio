'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

export function VisualDnaEditor({
  characterId,
  initialValue,
}: {
  characterId: string
  initialValue: string
}) {
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (characterId.startsWith('demo-')) return
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/update-character-visual-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: characterId, visual_dna: value }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className="input-dark text-xs font-mono"
        rows={3}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setSaved(false)
        }}
        placeholder="e.g. same woman, early 40s, auburn shoulder-length hair, light brown skin, worn blue postal service jacket, no makeup, warm natural light, candid smartphone photo quality"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-600">
          This prefix is prepended to every image prompt for this character.
        </p>
        <button
          onClick={handleSave}
          disabled={saving || characterId.startsWith('demo-')}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              Saved
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  )
}
