import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Story, Scene } from '@/lib/types'
import { StoryWorkspace } from '@/components/StoryWorkspace'

const DEMO_STORY: Story = {
  id: 'demo-1',
  character_name: 'Frank Delgado',
  character_age: 54,
  character_job: 'Long-haul trucker',
  character_backstory:
    'Frank spent 30 years behind the wheel eating gas station food and drinking energy drinks. His knees ache from the cab, his back is shot, and he hasn\'t seen his toes in years. His wife left him 3 years ago, partly because he stopped caring about himself. His daughter\'s wedding is in 6 months, and he overheard her telling a friend she was embarrassed he wouldn\'t fit in the family photos.',
  character_physical:
    'Heavyset at 280lbs on a 5\'10" frame, ruddy complexion from years of sun through the truck windshield, perpetual five o\'clock shadow, calloused hands, wears stretched-out trucker caps and flannel shirts.',
  emotional_tone: 'comeback',
  status: 'draft',
  created_at: '2026-02-20T10:00:00Z',
}

const DEMO_SCENES: Scene[] = []

async function getStoryData(id: string): Promise<{ story: Story; scenes: Scene[] }> {
  if (!isSupabaseConfigured || !supabase || id.startsWith('demo-') || id.startsWith('new-')) {
    return { story: { ...DEMO_STORY, id }, scenes: DEMO_SCENES }
  }

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !story) {
    return { story: { ...DEMO_STORY, id }, scenes: DEMO_SCENES }
  }

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('story_id', id)
    .order('order_index', { ascending: true })

  return { story, scenes: scenes ?? [] }
}

export const dynamic = 'force-dynamic'

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { story, scenes } = await getStoryData(id)

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <StoryWorkspace initialStory={story} initialScenes={scenes} />
    </div>
  )
}
