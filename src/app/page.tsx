import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Story, STATUS_CONFIG } from '@/lib/types'
import Link from 'next/link'
import { Film, Sparkles, AlertCircle, Calendar, Users, Eye, BarChart2, ArrowRight } from 'lucide-react'
import { NewStoryButton } from '@/components/NewStoryButton'

const DEMO_STORIES: (Story & { scene_count: number; first_image: string | null })[] = [
  {
    id: 'demo-1',
    character_name: 'Frank Delgado',
    character_age: 54,
    character_job: 'Long-haul trucker',
    character_backstory: 'I spent 30 years behind the wheel eating gas station food. My knees ache, my back is shot, and I haven\'t seen my toes in years.',
    character_physical: 'Heavyset, 5\'10", ruddy complexion, perpetual five o\'clock shadow',
    emotional_tone: 'comeback',
    status: 'complete',
    created_at: '2026-02-20T10:00:00Z',
    scene_count: 7,
    first_image: null,
  },
  {
    id: 'demo-2',
    character_name: 'Diane Huang',
    character_age: 47,
    character_job: 'School lunch lady',
    character_backstory: 'I\'ve been serving meals to kids for 15 years but I never eat well myself. My ex always said I\'d never change.',
    character_physical: 'Short, round-faced, always in a hairnet, tired eyes',
    emotional_tone: 'revenge',
    status: 'scenes_ready',
    created_at: '2026-02-21T14:30:00Z',
    scene_count: 6,
    first_image: null,
  },
  {
    id: 'demo-3',
    character_name: 'Gerald "Big G" Thompson',
    character_age: 61,
    character_job: 'Retired postal worker',
    character_backstory: 'I retired and realized I had nothing to do but sit on my porch. My grandkids run circles around me.',
    character_physical: 'Tall but stooped, large belly, gray beard, wire-rim glasses',
    emotional_tone: 'quiet_transformation',
    status: 'draft',
    created_at: '2026-02-22T09:15:00Z',
    scene_count: 0,
    first_image: null,
  },
]

type StoryWithMeta = Story & {
  scene_count: number
  first_image: string | null
  character_name_for_link: string | null
}

async function getStories(): Promise<StoryWithMeta[]> {
  if (!isSupabaseConfigured || !supabase) {
    return DEMO_STORIES.map((s) => ({ ...s, character_name_for_link: null }))
  }

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !stories) {
    return DEMO_STORIES.map((s) => ({ ...s, character_name_for_link: null }))
  }

  const storiesWithScenes = await Promise.all(
    stories.map(async (story: Story) => {
      const { count } = await supabase!
        .from('scenes')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id)

      const { data: firstScene } = await supabase!
        .from('scenes')
        .select('image_url')
        .eq('story_id', story.id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

      let characterNameForLink: string | null = null
      if (story.character_id) {
        const { data: charData } = await supabase!
          .from('characters')
          .select('name')
          .eq('id', story.character_id)
          .single()
        characterNameForLink = charData?.name ?? null
      }

      return {
        ...story,
        scene_count: count ?? 0,
        first_image: firstScene?.image_url ?? null,
        character_name_for_link: characterNameForLink,
      }
    })
  )

  return storiesWithScenes
}

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const stories = await getStories() as StoryWithMeta[]
  const isDemo = !isSupabaseConfigured

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Tex Content Studio</h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[3.25rem] max-w-lg">
              Content distribution pipeline for Tex Fitness. Generate UGC-style carousel stories, AI images, post captions, and export ready-to-post TikTok content — all from one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/content-week"
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Plan a Week</span>
            </Link>
            <NewStoryButton />
          </div>
        </div>
      </header>

      {/* Demo banner */}
      {isDemo && (
        <div className="glass-card p-4 mb-8 flex items-start gap-3 border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-medium">Demo Mode</p>
            <p className="text-xs text-zinc-400 mt-1">
              Supabase is not configured. Showing sample data. Set{' '}
              <code className="text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
              in your environment to connect to a real database.
            </p>
          </div>
        </div>
      )}

      {/* Intelligence Snapshot */}
      <div className="glass-card p-5 mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-mono mb-0.5">TOP FORMULA</p>
            <p className="text-sm font-semibold text-white">
              Comeback × Transport × 30j Défi = <span className="text-orange-400">9.2/10 avg</span>
            </p>
          </div>
        </div>
        <Link
          href="/intelligence"
          className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium shrink-0 transition-colors"
        >
          Go to Intelligence
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stories grid */}
      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">No stories yet</h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-md text-center">
            Create your first TikTok carousel story. Each story generates a character,
            builds a transformation arc, creates images, and exports ready-to-post slides.
          </p>
          <div className="flex items-center gap-3">
            <NewStoryButton />
            <Link
              href="/content-week"
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Plan a Content Week →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 fade-in">
          {/* Plan a Content Week card */}
          <Link
            href="/content-week"
            className="glass-card glass-card-interactive p-5 block group border-dashed"
          >
            <div className="aspect-video rounded-lg bg-white/[0.02] border border-dashed border-white/[0.08] mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-zinc-600 group-hover:text-[var(--accent)] transition-colors" />
            </div>
            <h3 className="font-semibold text-zinc-400 group-hover:text-[var(--accent)] transition-colors mb-1">
              Plan a Content Week →
            </h3>
            <p className="text-xs text-zinc-600">
              Generate 3, 5, or 7 stories at once with parallel AI generation and a Kanban review board.
            </p>
          </Link>

          {stories.map((story) => {
            const statusCfg = STATUS_CONFIG[story.status]
            return (
              <div key={story.id} className="glass-card glass-card-interactive p-5 group relative">
                {/* Main link overlay — covers card but sits behind character chip */}
                <Link
                  href={`/story/${story.id}`}
                  className="absolute inset-0 rounded-2xl z-0"
                  aria-label={`Open story: ${story.character_name}`}
                />

                {/* Thumbnail */}
                <div className="aspect-video rounded-lg bg-white/[0.02] border border-white/[0.05] mb-4 overflow-hidden flex items-center justify-center relative z-[1] pointer-events-none">
                  {story.first_image ? (
                    <img
                      src={story.first_image}
                      alt={story.character_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-zinc-700" />
                  )}
                </div>

                {/* Info */}
                <div className="flex items-start justify-between mb-2 relative z-[1] pointer-events-none">
                  <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    {story.character_name}
                  </h3>
                  <span className={`status-badge ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-3 relative z-[1] pointer-events-none">
                  {story.character_age}yo {story.character_job}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap relative z-[1]">
                  <span className="pointer-events-none">{story.scene_count} scene{story.scene_count !== 1 ? 's' : ''}</span>
                  <span className="pointer-events-none">{story.emotional_tone.replace(/_/g, ' ')}</span>
                  {story.scene_count > 0 && !story.id.startsWith('demo-') && (
                    <Link
                      href={`/stories/${story.id}/preview`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors z-[2] relative"
                    >
                      <Eye className="w-2.5 h-2.5" />
                      Quick Preview
                    </Link>
                  )}
                  {story.character_id && story.character_name_for_link && (
                    <Link
                      href={`/characters/${story.character_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-hover)] hover:bg-[var(--accent)]/20 transition-colors z-[2] relative"
                    >
                      <Users className="w-2.5 h-2.5" />
                      {story.character_name_for_link}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
