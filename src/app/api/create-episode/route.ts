import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  let body: { character_id: string; emotional_tone?: string; preset_hook?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character_id, emotional_tone, preset_hook } = body

  if (!character_id) {
    return NextResponse.json({ error: 'Missing character_id' }, { status: 400 })
  }

  if (!isSupabaseConfigured || !supabase) {
    const tempId = `new-${Date.now()}`
    return NextResponse.json({ story_id: tempId })
  }

  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', character_id)
    .single()

  if (charError || !character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const { data: story, error: storyError } = await supabase
    .from('stories')
    .insert({
      character_id,
      character_name: character.name,
      character_age: character.age,
      character_job: character.job,
      character_backstory: character.backstory,
      character_physical: character.physical_description,
      emotional_tone: emotional_tone ?? 'comeback',
      status: 'draft',
      ...(preset_hook ? { selected_hook: preset_hook } : {}),
    })
    .select('id')
    .single()

  if (storyError || !story) {
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }

  return NextResponse.json({ story_id: story.id })
}
