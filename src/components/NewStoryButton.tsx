'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export function NewStoryButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
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
    <button onClick={handleCreate} disabled={loading} className="btn-accent flex items-center gap-2">
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
  )
}
