'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export function NewEpisodeButton({ characterId }: { characterId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await fetch('/api/create-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: characterId }),
      })
      const data = await res.json()

      if (data.story_id) {
        router.push(`/story/${data.story_id}`)
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
          <span>Creating Episode...</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span>New Episode</span>
        </>
      )}
    </button>
  )
}
