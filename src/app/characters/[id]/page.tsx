import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Character, Story, Scene, STATUS_CONFIG } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Film, Users, HelpCircle, BookOpen } from 'lucide-react'
import { NewEpisodeButton } from '@/components/NewEpisodeButton'
import { VisualDnaEditor } from '@/components/VisualDnaEditor'

type EpisodeCard = Story & {
  episode_number: number
  first_image: string | null
  scene_count: number
}

const DEMO_CHARACTER: Character = {
  id: 'demo-char-1',
  name: 'Maria Gutierrez',
  age: 43,
  job: 'Postal worker',
  backstory: 'Maria has spent 18 years sorting mail on the night shift. Her feet ache constantly and she eats vending machine food at 2am.',
  physical_description: 'Short, early 40s, auburn shoulder-length hair, light brown skin, worn blue postal service jacket, tired eyes',
  visual_dna: 'same woman, early 40s, auburn shoulder-length hair, light brown skin, worn blue postal service jacket, no makeup, warm natural light, candid smartphone photo quality',
  created_at: '2026-02-01T10:00:00Z',
}

const DEMO_EPISODES: EpisodeCard[] = [
  {
    id: 'demo-story-1',
    character_id: 'demo-char-1',
    character_name: 'Maria Gutierrez',
    character_age: 43,
    character_job: 'Postal worker',
    character_backstory: DEMO_CHARACTER.backstory ?? '',
    character_physical: DEMO_CHARACTER.physical_description ?? '',
    emotional_tone: 'comeback',
    status: 'complete',
    created_at: '2026-02-05T10:00:00Z',
    episode_number: 1,
    first_image: null,
    scene_count: 8,
  },
  {
    id: 'demo-story-2',
    character_id: 'demo-char-1',
    character_name: 'Maria Gutierrez',
    character_age: 43,
    character_job: 'Postal worker',
    character_backstory: DEMO_CHARACTER.backstory ?? '',
    character_physical: DEMO_CHARACTER.physical_description ?? '',
    emotional_tone: 'quiet_transformation',
    status: 'scenes_ready',
    created_at: '2026-02-12T10:00:00Z',
    episode_number: 2,
    first_image: null,
    scene_count: 7,
  },
  {
    id: 'demo-story-3',
    character_id: 'demo-char-1',
    character_name: 'Maria Gutierrez',
    character_age: 43,
    character_job: 'Postal worker',
    character_backstory: DEMO_CHARACTER.backstory ?? '',
    character_physical: DEMO_CHARACTER.physical_description ?? '',
    emotional_tone: 'against_all_odds',
    status: 'draft',
    created_at: '2026-02-18T10:00:00Z',
    episode_number: 3,
    first_image: null,
    scene_count: 0,
  },
]

async function getCharacterData(id: string): Promise<{ character: Character; episodes: EpisodeCard[] } | null> {
  if (!isSupabaseConfigured || !supabase || id.startsWith('demo-')) {
    return { character: { ...DEMO_CHARACTER, id }, episodes: DEMO_EPISODES }
  }

  const { data: character, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !character) return null

  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('character_id', id)
    .order('created_at', { ascending: true })

  const episodes: EpisodeCard[] = await Promise.all(
    (stories ?? []).map(async (story: Story, index: number) => {
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

      return {
        ...story,
        episode_number: index + 1,
        first_image: firstScene?.image_url ?? null,
        scene_count: count ?? 0,
      }
    })
  )

  return { character, episodes }
}

export const dynamic = 'force-dynamic'

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getCharacterData(id)

  if (!data) {
    return (
      <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">Character not found</h2>
          <Link href="/characters" className="btn-secondary inline-flex items-center gap-2 mt-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Characters
          </Link>
        </div>
      </div>
    )
  }

  const { character, episodes } = data

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <Link
        href="/characters"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Characters
      </Link>

      {/* ── Character Details ── */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{character.name}</h1>
              <p className="text-zinc-400 mt-1">
                {character.age ? `${character.age} years old` : ''}
                {character.age && character.job ? ' · ' : ''}
                {character.job ?? ''}
              </p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-hover)]">
            <Film className="w-3.5 h-3.5" />
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {character.backstory && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Backstory</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{character.backstory}</p>
            </div>
          )}
          {character.physical_description && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Physical Description</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{character.physical_description}</p>
            </div>
          )}
        </div>

        {/* Visual DNA anchor */}
        <div className="mt-6 pt-6 border-t border-white/[0.05]">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Visual DNA</h3>
            <div className="group relative">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-72 p-3 rounded-xl bg-zinc-900 border border-white/[0.1] text-xs text-zinc-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                This prefix is prepended to every Leonardo.AI image prompt for scenes featuring this character. It locks their appearance (face, hair, clothing, skin tone) so all images look like the same person across episodes.
              </div>
            </div>
          </div>
          <VisualDnaEditor
            characterId={character.id}
            initialValue={character.visual_dna ?? ''}
          />
        </div>
      </div>

      {/* ── Filmography ── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Film className="w-5 h-5 text-[var(--accent)]" />
          Filmography
        </h2>

        {episodes.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Film className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No episodes yet. Create the first one!</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
            {episodes.map((episode) => {
              const statusCfg = STATUS_CONFIG[episode.status]
              return (
                <Link
                  key={episode.id}
                  href={`/story/${episode.id}`}
                  className="shrink-0 w-48 glass-card glass-card-interactive overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-center overflow-hidden">
                    {episode.first_image ? (
                      <img
                        src={episode.first_image}
                        alt={`Episode ${episode.episode_number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-6 h-6 text-zinc-700" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--accent)]">
                        Episode {episode.episode_number}
                      </span>
                      <span className={`status-badge text-[10px] px-1.5 py-0.5 ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {episode.emotional_tone.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {episode.scene_count} scene{episode.scene_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex justify-center gap-3 py-4 flex-wrap">
        <Link
          href={`/characters/${character.id}/series-bible`}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Plan a Series
        </Link>
        <NewEpisodeButton characterId={character.id} />
      </div>
    </div>
  )
}
