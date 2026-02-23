'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export function NewCharacterButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save_to_character: true }),
      })
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
    <button onClick={handleCreate} disabled={loading} className="btn-accent flex items-center gap-2">
      {loading ? (
        <>
          <div className="spinner" />
          <span>Creating...</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span>New Character</span>
        </>
      )}
    </button>
  )
}
