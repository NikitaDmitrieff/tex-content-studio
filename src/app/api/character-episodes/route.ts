import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('character_id')
  const excludeStoryId = searchParams.get('exclude_story_id')

  if (!characterId) {
    return NextResponse.json({ error: 'Missing character_id' }, { status: 400 })
  }

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ summary: null })
  }

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, created_at')
    .eq('character_id', characterId)
    .order('created_at', { ascending: true })

  if (error || !stories || stories.length === 0) {
    return NextResponse.json({ summary: null })
  }

  const eligibleStories = excludeStoryId
    ? stories.filter((s: { id: string }) => s.id !== excludeStoryId)
    : stories

  const lastTwo = eligibleStories.slice(-2)

  if (lastTwo.length === 0) {
    return NextResponse.json({ summary: null })
  }

  const episodeSummaries = await Promise.all(
    lastTwo.map(async (story: { id: string; created_at: string }, idx: number) => {
      const episodeNumber = eligibleStories.findIndex((s: { id: string }) => s.id === story.id) + 1

      const { data: scenes } = await supabase!
        .from('scenes')
        .select('description, order_index')
        .eq('story_id', story.id)
        .order('order_index', { ascending: true })
        .limit(5)

      if (!scenes || scenes.length === 0) return null

      const descriptions = scenes
        .map((s: { description: string }) => `- ${s.description}`)
        .join('\n')

      return `Episode ${episodeNumber} (${new Date(story.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}):\n${descriptions}`
    })
  )

  const validSummaries = episodeSummaries.filter(Boolean)

  if (validSummaries.length === 0) {
    return NextResponse.json({ summary: null })
  }

  return NextResponse.json({ summary: validSummaries.join('\n\n') })
}
