import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  let body: { character_id: string; visual_dna: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character_id, visual_dna } = body

  if (!character_id) {
    return NextResponse.json({ error: 'Missing character_id' }, { status: 400 })
  }

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('characters')
    .update({ visual_dna })
    .eq('id', character_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update visual_dna' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
