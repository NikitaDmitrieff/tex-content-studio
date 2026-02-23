import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Character, Story, SeriesBibleEpisode } from '@/lib/types'
import { SeriesBibleWorkspace } from '@/components/SeriesBibleWorkspace'

const DEMO_CHARACTER: Character = {
  id: 'demo-char-1',
  name: 'Maria Gutierrez',
  age: 43,
  job: 'Postal worker',
  backstory:
    'Maria has spent 18 years sorting mail on the night shift. Her feet ache constantly and she eats vending machine food at 2am.',
  physical_description:
    'Short, early 40s, auburn shoulder-length hair, light brown skin, worn blue postal service jacket, tired eyes',
  visual_dna:
    'same woman, early 40s, auburn shoulder-length hair, light brown skin, worn blue postal service jacket, no makeup, warm natural light, candid smartphone photo quality',
  created_at: '2026-02-01T10:00:00Z',
}

async function getPageData(id: string): Promise<{
  character: Character
  previousEpisodesSummary: string | undefined
  existingBible: { id: string; episodes: SeriesBibleEpisode[]; linked_story_ids?: (string | null)[] } | null
}> {
  if (!isSupabaseConfigured || !supabase || id.startsWith('demo-')) {
    return {
      character: { ...DEMO_CHARACTER, id },
      previousEpisodesSummary: undefined,
      existingBible: null,
    }
  }

  // Fetch character
  const { data: character, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !character) {
    return {
      character: { ...DEMO_CHARACTER, id },
      previousEpisodesSummary: undefined,
      existingBible: null,
    }
  }

  // Fetch previous episode summaries
  const { data: stories } = await supabase
    .from('stories')
    .select('emotional_tone, status, created_at')
    .eq('character_id', id)
    .eq('status', 'complete')
    .order('created_at', { ascending: true })

  const previousEpisodesSummary =
    stories && stories.length > 0
      ? stories
          .map(
            (s: Pick<Story, 'emotional_tone' | 'status' | 'created_at'>, i: number) =>
              `Episode ${i + 1}: ${s.emotional_tone.replace(/_/g, ' ')} (published ${new Date(s.created_at).toLocaleDateString('fr-FR')})`
          )
          .join(', ')
      : undefined

  // Fetch most recent series bible for this character
  const { data: bible } = await supabase
    .from('series_bibles')
    .select('id, episodes, linked_story_ids')
    .eq('character_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    character,
    previousEpisodesSummary,
    existingBible: bible ?? null,
  }
}

export const dynamic = 'force-dynamic'

export default async function SeriesBiblePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { character, previousEpisodesSummary, existingBible } = await getPageData(id)

  return (
    <SeriesBibleWorkspace
      character={character}
      previousEpisodesSummary={previousEpisodesSummary}
      existingBible={existingBible}
    />
  )
}
