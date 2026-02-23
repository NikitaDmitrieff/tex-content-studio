import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (storyError || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('story_id', id)
    .order('order_index', { ascending: true })

  return NextResponse.json({
    story,
    scenes: scenes ?? [],
    hook_variants: story.hook_variants ?? null,
    comment_seeds: story.comment_seeds ?? null,
    audio_brief: null,
    swipe_momentum_scores: null,
  })
}
