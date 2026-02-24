import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Story, STATUS_CONFIG } from '@/lib/types'
import Link from 'next/link'
import { Film, Sparkles, AlertCircle, Calendar, Users, Eye, BarChart2, ArrowRight } from 'lucide-react'
import { NewStoryButton } from '@/components/NewStoryButton'

const DEMO_STORIES: (Story & { scene_count: number; first_image: string | null })[] = [
  {
    id: 'demo-1',
    character_name: 'Gérard Blanchard',
    character_age: 52,
    character_job: 'Routier longue distance',
    character_backstory: "30 ans derrière le volant à manger des sandwichs de station-service. Ses genoux lâchent, son dos est foutu, il a pas vu ses pieds depuis des années.",
    character_physical: 'Fort, 1m75, teint rougeaud, barbe de 3 jours permanente',
    emotional_tone: 'comeback',
    status: 'complete',
    created_at: '2026-02-20T10:00:00Z',
    scene_count: 7,
    first_image: null,
  },
  {
    id: 'demo-2',
    character_name: 'Nadia Benmoussa',
    character_age: 45,
    character_job: 'Employée de cantine scolaire',
    character_backstory: "15 ans à servir des repas aux gamins mais elle mange jamais bien elle-même. Son ex disait toujours qu'elle changerait jamais.",
    character_physical: 'Petite, visage rond, toujours en charlotte, yeux fatigués',
    emotional_tone: 'revenge',
    status: 'scenes_ready',
    created_at: '2026-02-21T14:30:00Z',
    scene_count: 6,
    first_image: null,
  },
  {
    id: 'demo-3',
    character_name: 'Michel Fournier',
    character_age: 61,
    character_job: 'Facteur retraité',
    character_backstory: "Retraité depuis 2 ans et il a rien à faire à part rester sur sa terrasse. Ses petits-enfants lui tournent autour et il arrive pas à suivre.",
    character_physical: 'Grand mais voûté, gros ventre, barbe grise, lunettes fines',
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
            const toneEmoji = { comeback: '\u{1F525}', revenge: '\u{1F4AA}', quiet_transformation: '\u{1F305}', rock_bottom: '\u2B07\uFE0F', against_all_odds: '\u{1F3C6}' }[story.emotional_tone] || ''
            return (
              <div key={story.id} className="glass-card glass-card-interactive group relative overflow-hidden">
                {/* Main link overlay */}
                <Link
                  href={`/story/${story.id}`}
                  className="absolute inset-0 rounded-2xl z-0"
                  aria-label={`Open story: ${story.character_name}`}
                />

                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-white/[0.02] overflow-hidden flex items-center justify-center relative z-[1] pointer-events-none">
                  {story.first_image ? (
                    <>
                      <img
                        src={story.first_image}
                        alt={story.character_name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Film className="w-8 h-8 text-zinc-700" />
                      <span className="text-[10px] text-zinc-700 font-medium uppercase tracking-wider">No images</span>
                    </div>
                  )}

                  {/* Status pill — top right of thumbnail */}
                  <div className="absolute top-3 right-3">
                    <span className={`status-badge ${statusCfg.color} text-[10px] px-2 py-0.5`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 relative z-[1] pointer-events-none">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors text-[15px]">
                      {story.character_name}
                    </h3>
                    <span className="text-xs">{toneEmoji}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-3">
                    {story.character_age}yo {story.character_job}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-600 flex-wrap">
                    <span className="pointer-events-none">{story.scene_count} slide{story.scene_count !== 1 ? 's' : ''}</span>
                    <span className="pointer-events-none capitalize">{story.emotional_tone.replace(/_/g, ' ')}</span>
                    {story.scene_count > 0 && !story.id.startsWith('demo-') && (
                      <Link
                        href={`/stories/${story.id}/preview`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors z-[2] relative pointer-events-auto"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        Preview
                      </Link>
                    )}
                    {story.character_id && story.character_name_for_link && (
                      <Link
                        href={`/characters/${story.character_id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/8 border border-[var(--accent)]/15 text-[var(--accent-hover)] hover:bg-[var(--accent)]/15 transition-colors z-[2] relative pointer-events-auto"
                      >
                        <Users className="w-2.5 h-2.5" />
                        {story.character_name_for_link}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
