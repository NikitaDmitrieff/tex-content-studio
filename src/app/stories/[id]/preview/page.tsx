import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Story, Scene, HookWithScoring, CommentSeedKit } from '@/lib/types'
import { TikTokPreviewStudio } from '@/components/TikTokPreviewStudio'

const DEMO_STORY: Story = {
  id: 'demo-1',
  character_name: 'Gérard Blanchard',
  character_age: 52,
  character_job: 'Routier longue distance',
  character_backstory:
    "30 ans derrière le volant à manger des sandwichs de station-service et boire du Monster. Ses genoux lâchent, son dos est foutu.",
  character_physical: 'Fort, 1m75 pour 130kg, teint rougeaud, barbe de 3 jours permanente',
  emotional_tone: 'comeback',
  status: 'scenes_ready',
  created_at: '2026-02-20T10:00:00Z',
}

const DEMO_SCENES: Scene[] = [
  {
    id: 'demo-scene-1',
    story_id: 'demo-1',
    order_index: 0,
    description: '30 ans derrière le volant. Chaque repas c\'était le sandwich de la station-service.',
    emotional_beat: 'dark_beginning',
    visual_prompt: 'Tired trucker at a gas station at night',
    image_url: null,
    caption: '30 ans de route. Chaque repas c\'était la station-service.',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'demo-scene-2',
    story_id: 'demo-1',
    order_index: 1,
    description: 'Ma fille a dit à une copine qu\'elle avait honte que je rentre pas dans les photos de famille.',
    emotional_beat: 'turning_point',
    visual_prompt: 'Sad man looking at a wedding invitation',
    image_url: null,
    caption: 'Ma fille a dit à une copine qu\'elle avait honte.',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'demo-scene-3',
    story_id: 'demo-1',
    order_index: 2,
    description: 'Jour 1. 5 minutes sur le tapis. J\'ai failli tout lâcher.',
    emotional_beat: 'first_step',
    visual_prompt: 'Man on treadmill, sweating, determined',
    image_url: null,
    caption: 'Jour 1. 5 minutes sur le tapis. J\'ai failli tout lâcher.',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'demo-scene-4',
    story_id: 'demo-1',
    order_index: 3,
    description: 'Semaine 6. La balance a bougé. Ma femme a remarqué.',
    emotional_beat: 'momentum',
    visual_prompt: 'Man on scale, smiling at the number',
    image_url: null,
    caption: 'Semaine 6. La balance a bougé. Ma femme a remarqué.',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'demo-scene-5',
    story_id: 'demo-1',
    order_index: 4,
    description: 'Le jour du mariage. Je rentrais dans les photos. Ma fille a pleuré.',
    emotional_beat: 'triumph',
    visual_prompt: 'Man in suit at wedding, proud and smiling',
    image_url: null,
    caption: 'Le jour du mariage. Je rentrais dans les photos. Ma fille a pleuré.',
    created_at: '2026-02-20T10:00:00Z',
  },
]

async function getPreviewData(id: string): Promise<{
  story: Story
  scenes: Scene[]
  hookVariants: HookWithScoring[] | null
  commentSeeds: CommentSeedKit | null
}> {
  if (!isSupabaseConfigured || !supabase || id.startsWith('demo-')) {
    return {
      story: { ...DEMO_STORY, id },
      scenes: DEMO_SCENES.map((s) => ({ ...s, story_id: id })),
      hookVariants: null,
      commentSeeds: null,
    }
  }

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !story) {
    return {
      story: { ...DEMO_STORY, id },
      scenes: DEMO_SCENES.map((s) => ({ ...s, story_id: id })),
      hookVariants: null,
      commentSeeds: null,
    }
  }

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('story_id', id)
    .order('order_index', { ascending: true })

  return {
    story,
    scenes: scenes ?? [],
    hookVariants: (story.hook_variants as HookWithScoring[] | null) ?? null,
    commentSeeds: (story.comment_seeds as CommentSeedKit | null) ?? null,
  }
}

export const dynamic = 'force-dynamic'

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { story, scenes, hookVariants, commentSeeds } = await getPreviewData(id)

  return (
    <TikTokPreviewStudio
      story={story}
      scenes={scenes}
      hookVariants={hookVariants}
      commentSeeds={commentSeeds}
      audioBrief={null}
      swipeMomentumResult={null}
    />
  )
}
