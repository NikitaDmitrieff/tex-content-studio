import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Character } from '@/lib/types'
import Link from 'next/link'
import { Users, Film, Plus } from 'lucide-react'
import { NewCharacterButton } from '@/components/NewCharacterButton'

type CharacterWithStats = Character & {
  episode_count: number
  first_image: string | null
}

const DEMO_CHARACTERS: CharacterWithStats[] = [
  {
    id: 'demo-char-1',
    name: 'Nadia Benmoussa',
    age: 45,
    job: 'Employée de cantine scolaire',
    backstory: "Nadia sert des repas aux gamins depuis 15 ans mais mange jamais bien elle-même. Son ex disait toujours qu'elle changerait jamais.",
    physical_description: 'Petite, mi-40s, cheveux auburn aux épaules, peau mate, blouse de cantine usée, yeux fatigués',
    visual_dna: 'same woman, mid 40s, auburn shoulder-length hair, light brown skin, worn cafeteria uniform, no makeup, harsh indoor lighting, low quality phone camera, grainy',
    created_at: '2026-02-01T10:00:00Z',
    episode_count: 3,
    first_image: null,
  },
  {
    id: 'demo-char-2',
    name: 'Patrick Morel',
    age: 56,
    job: 'Chef d\'équipe en usine',
    backstory: "Patrick bosse dans la même usine depuis 30 ans. Genoux en vrac, dos foutu, et un médecin qui lui dit que son cholestérol c'est un problème.",
    physical_description: 'Trapu, fin 50s, cheveux gris en brosse, teint pâle, toujours en bleu de travail',
    visual_dna: 'same stocky man, late 50s, gray buzz cut, pale complexion, blue work jacket, no-nonsense expression, harsh industrial lighting, low quality phone camera, grainy',
    created_at: '2026-02-10T14:00:00Z',
    episode_count: 1,
    first_image: null,
  },
]

async function getCharacters(): Promise<CharacterWithStats[]> {
  if (!isSupabaseConfigured || !supabase) {
    return DEMO_CHARACTERS
  }

  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !characters) {
    return DEMO_CHARACTERS
  }

  const withStats = await Promise.all(
    characters.map(async (char: Character) => {
      const { count } = await supabase!
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', char.id)

      const { data: firstStory } = await supabase!
        .from('stories')
        .select('id')
        .eq('character_id', char.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      let firstImage: string | null = null
      if (firstStory) {
        const { data: firstScene } = await supabase!
          .from('scenes')
          .select('image_url')
          .eq('story_id', firstStory.id)
          .order('order_index', { ascending: true })
          .limit(1)
          .single()
        firstImage = firstScene?.image_url ?? null
      }

      return {
        ...char,
        episode_count: count ?? 0,
        first_image: firstImage,
      }
    })
  )

  return withStats
}

export const dynamic = 'force-dynamic'

export default async function CharactersPage() {
  const characters = await getCharacters()
  const isDemo = !isSupabaseConfigured

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Your Characters</h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[3.25rem] max-w-lg">
              Recurring characters for your serialized TikTok franchise. Each character maintains visual consistency across all episodes.
            </p>
          </div>
          <NewCharacterButton />
        </div>
      </header>

      {isDemo && (
        <div className="glass-card p-4 mb-8 flex items-start gap-3 border-amber-500/20">
          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-amber-400 text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm text-amber-300 font-medium">Demo Mode</p>
            <p className="text-xs text-zinc-400 mt-1">
              Showing sample characters. Connect Supabase to save real characters.
            </p>
          </div>
        </div>
      )}

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">No characters yet</h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-md text-center">
            Create a recurring character to build a serialized franchise. Each character keeps consistent visuals across all their episodes.
          </p>
          <NewCharacterButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 fade-in">
          {characters.map((character) => (
            <div key={character.id} className="glass-card glass-card-interactive p-5 flex flex-col gap-4">
              {/* Avatar */}
              <Link href={`/characters/${character.id}`} className="block">
                <div className="aspect-video rounded-lg bg-white/[0.02] border border-white/[0.05] overflow-hidden flex items-center justify-center group-hover:border-white/[0.1] transition-colors">
                  {character.first_image ? (
                    <img
                      src={character.first_image}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-8 h-8 text-zinc-700" />
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/characters/${character.id}`} className="hover:text-[var(--accent)] transition-colors">
                    <h3 className="font-semibold text-white truncate">{character.name}</h3>
                  </Link>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {character.age ? `${character.age}yo` : ''}{character.age && character.job ? ' · ' : ''}{character.job ?? ''}
                  </p>
                </div>
                <span className="shrink-0 ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-hover)]">
                  <Film className="w-3 h-3" />
                  {character.episode_count} ep{character.episode_count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                <Link
                  href={`/characters/${character.id}`}
                  className="btn-secondary text-xs px-3 py-1.5 flex-1 text-center"
                >
                  View Character
                </Link>
                <Link
                  href={`/characters/${character.id}`}
                  className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  New Episode
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
