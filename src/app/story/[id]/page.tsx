import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Story, Scene, Character } from '@/lib/types'
import { StoryWorkspace } from '@/components/StoryWorkspace'
import { CHARACTER_ROSTER } from '@/lib/character-roster'

const DEMO_STORY: Story = {
  id: 'demo-1',
  character_name: 'Gérard Blanchard',
  character_age: 52,
  character_job: 'Routier longue distance',
  character_backstory:
    "Gérard passe 30 ans derrière le volant à manger des sandwichs de station-service et boire du Monster. Ses genoux le lâchent, son dos est foutu, et il a pas vu ses pieds depuis des années. Sa femme l'a quitté il y a 3 ans. Le mariage de sa fille est dans 6 mois et il l'a entendue dire à une copine qu'elle avait honte qu'il rentre pas dans les photos de famille.",
  character_physical:
    'Fort, 1m75 pour 130kg, teint rougeaud, barbe de 3 jours permanente, mains calleuses, casquette de routier défoncée et chemise en flanelle.',
  emotional_tone: 'comeback',
  status: 'draft',
  created_at: '2026-02-20T10:00:00Z',
}

const DEMO_SCENES: Scene[] = []

function getStoryFromRoster(id: string): { story: Story; scenes: Scene[]; character: null } | null {
  const match = id.match(/^roster-(\d+)$/)
  if (!match) return null
  const index = parseInt(match[1], 10)
  const rosterChar = CHARACTER_ROSTER[index]
  if (!rosterChar) return null

  return {
    story: {
      id,
      character_name: rosterChar.name,
      character_age: rosterChar.age,
      character_job: rosterChar.job,
      character_backstory: rosterChar.backstory,
      character_physical: rosterChar.physical_description,
      visual_dna: rosterChar.visual_dna,
      emotional_tone: 'comeback',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
    scenes: [],
    character: null,
  }
}

async function getStoryData(id: string): Promise<{
  story: Story
  scenes: Scene[]
  character: Character | null
}> {
  // Check roster characters first
  const rosterResult = getStoryFromRoster(id)
  if (rosterResult) return rosterResult

  if (!isSupabaseConfigured || !supabase || id.startsWith('demo-') || id.startsWith('new-')) {
    return { story: { ...DEMO_STORY, id }, scenes: DEMO_SCENES, character: null }
  }

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !story) {
    return { story: { ...DEMO_STORY, id }, scenes: DEMO_SCENES, character: null }
  }

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('story_id', id)
    .order('order_index', { ascending: true })

  let character: Character | null = null
  if (story.character_id) {
    const { data: charData } = await supabase
      .from('characters')
      .select('*')
      .eq('id', story.character_id)
      .single()
    character = charData ?? null
  }

  return { story, scenes: scenes ?? [], character }
}

export const dynamic = 'force-dynamic'

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { story, scenes, character } = await getStoryData(id)

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <StoryWorkspace
        initialStory={story}
        initialScenes={scenes}
        lockedCharacter={character}
      />
    </div>
  )
}
