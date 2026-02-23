import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { HookWithScoring } from '@/lib/types'

export async function POST(request: NextRequest) {
  let body: {
    story_id: string
    hook_variants?: HookWithScoring[]
    selected_hook?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { story_id, hook_variants, selected_hook } = body

  if (!story_id) {
    return NextResponse.json({ error: 'Missing story_id' }, { status: 400 })
  }

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ ok: true, note: 'Supabase not configured — skipped persistence' })
  }

  const updates: Record<string, unknown> = {}
  if (hook_variants !== undefined) updates.hook_variants = hook_variants
  if (selected_hook !== undefined) updates.selected_hook = selected_hook

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', story_id)

  if (error) {
    console.error('update-story-hook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
