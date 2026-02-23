import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { SeriesBibleEpisode, EmotionalTone } from '@/lib/types'

const DEMO_SERIES_BIBLE: SeriesBibleEpisode[] = [
  {
    episode_number: 1,
    title: "Le Jour Où Tout a Failli S'Arrêter",
    premise: "Elle découvre que son corps lui envoie un avertissement final — et décide d'écouter.",
    emotional_tone: 'rock_bottom',
    turning_point: 'Ce moment où le médecin ferme son carnet et la regarde en silence.',
    cliffhanger_hook: "J'avais 48h pour décider si j'allais changer ou continuer à disparaître.",
    audience_target: "ceux qui ont repoussé l'avertissement",
    season_timing_suggestion: 'Janvier — après les fêtes',
  },
  {
    episode_number: 2,
    title: 'Les 30 Premiers Jours Dont Personne Ne Parle',
    premise: "Le début n'est pas inspirant — c'est bruyant, douloureux et presque ridicule.",
    emotional_tone: 'against_all_odds',
    turning_point: 'Ce moment où elle rate son troisième jour de suite et recommence quand même.',
    cliffhanger_hook: "Semaine 2, j'ai pleuré dans ma voiture pendant 20 minutes. Et puis j'ai recommencé.",
    audience_target: 'les débutants qui se sentent nuls',
    season_timing_suggestion: 'Rentrée septembre',
  },
  {
    episode_number: 3,
    title: "Ce Que Ma Fille M'a Dit Sans Le Dire",
    premise: "Un petit geste d'un proche révèle l'ampleur du changement déjà accompli.",
    emotional_tone: 'quiet_transformation',
    turning_point: "Ce moment où sa fille pose la tête sur son épaule sans raison — juste parce qu'elle peut.",
    cliffhanger_hook: "Elle n'a rien dit. Elle n'avait pas besoin.",
    audience_target: 'les parents qui font ça pour leurs enfants sans le dire',
  },
  {
    episode_number: 4,
    title: 'Le Plateau Qui Veut Te Faire Abandonner',
    premise: "Trois semaines sans aucun progrès visible — et la tentation de tout arrêter.",
    emotional_tone: 'against_all_odds',
    turning_point: "Ce moment où elle regarde une photo d'il y a 3 mois et ne reconnaît pas ses propres yeux.",
    cliffhanger_hook: 'La balance ne bougeait plus. Mais moi, si.',
    audience_target: "les sceptiques qui cherchent une raison d'arrêter",
    season_timing_suggestion: 'Ramadan — période de patience',
  },
  {
    episode_number: 5,
    title: "Revenge — Mais Pas Celle Qu'on Croit",
    premise: "La vraie revanche n'est pas contre les autres — c'est contre la version d'elle-même qui disait \"c'est trop tard\".",
    emotional_tone: 'revenge',
    turning_point: "Ce moment où quelqu'un lui demande \"t'as fait quoi comme opération ?\" et qu'elle sourit sans répondre.",
    cliffhanger_hook: "Je n'ai pas répondu. Ma transformation n'est pas leur récompense.",
    audience_target: 'ceux qui se font sous-estimer',
  },
  {
    episode_number: 6,
    title: "Ce N'est Pas Une Fin. C'est Le Vrai Début.",
    premise: "Elle réalise que la ligne d'arrivée n'existe pas — et que c'est la meilleure nouvelle de sa vie.",
    emotional_tone: 'comeback',
    turning_point: "Ce moment où elle remet ses chaussures de sport non pas par obligation, mais parce qu'elle en a envie.",
    cliffhanger_hook: 'Je ne cherche plus à finir. Je cherche à continuer.',
    audience_target: "ceux qui attendent d'être \"guéris\" pour commencer à vivre",
    season_timing_suggestion: 'Après les fêtes — janvier nouvelle année',
  },
]

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    character: {
      name: string
      age: number | null
      job: string | null
      backstory: string | null
      physical_description: string | null
      visual_dna: string | null
    }
    character_id: string
    previous_episodes_summary?: string
    episode_count?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character, character_id, previous_episodes_summary, episode_count = 6 } = body

  if (!character) {
    return NextResponse.json({ error: 'Missing character data' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ episodes: DEMO_SERIES_BIBLE, bible_id: null })
  }

  try {
    const client = new Anthropic({ apiKey })

    const sequelContext = previous_episodes_summary
      ? `\n\nPREVIOUS EPISODES ALREADY PUBLISHED:\n${previous_episodes_summary}\n\nThese episodes already happened. Plan the NEXT ${episode_count} episodes as a continuation arc.`
      : ''

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a TikTok franchise architect. Plan a ${episode_count}-episode series arc for the following character. Each episode must be a standalone emotional story but together they form a compelling character journey that builds audience loyalty and drives follow-throughs.

CHARACTER:
Name: ${character.name}
Age: ${character.age ?? 'unknown'}
Job: ${character.job ?? 'unknown'}
Backstory: ${character.backstory ?? 'none provided'}
Appearance: ${character.physical_description ?? 'none provided'}
Visual DNA: ${character.visual_dna ?? 'none provided'}${sequelContext}

RULES:
- All titles must be French, emotionally powerful, and scroll-stopping (think: what would make someone pause)
- Each episode must hit a DIFFERENT emotional register — vary between: rock_bottom, against_all_odds, quiet_transformation, comeback, revenge
- The arc must have emotional escalation across the 6 episodes — don't peak in episode 1
- The cliffhanger_hook is the single most screenshot-able sentence — make it poetic and punchy
- audience_target should name a specific viewer archetype (e.g. "les sceptiques", "les mamans épuisées", "ceux qui ont tout essayé")
- season_timing_suggestion is OPTIONAL — only include it if a specific French cultural moment makes sense

EMOTIONAL TONE VALUES (use exactly these strings):
- comeback
- revenge
- quiet_transformation
- rock_bottom
- against_all_odds

Respond ONLY with a valid JSON array of exactly ${episode_count} objects (no markdown, no code fences):
[
  {
    "episode_number": 1,
    "title": "French title here",
    "premise": "One sentence: what this episode reveals or challenges about the character",
    "emotional_tone": "comeback",
    "turning_point": "Ce moment où... (the single most emotionally loaded moment, in French)",
    "cliffhanger_hook": "The last-slide follow-bait sentence viewers will screenshot (in French)",
    "audience_target": "specific viewer segment this episode hooks (in French)",
    "season_timing_suggestion": "optional French cultural moment anchor"
  }
]`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const episodes: SeriesBibleEpisode[] = JSON.parse(cleanedText)

    // Validate emotional_tone values
    const validTones: EmotionalTone[] = ['comeback', 'revenge', 'quiet_transformation', 'rock_bottom', 'against_all_odds']
    const sanitized = episodes.map((ep) => ({
      ...ep,
      emotional_tone: validTones.includes(ep.emotional_tone) ? ep.emotional_tone : 'comeback' as EmotionalTone,
    }))

    // Persist to Supabase if configured
    let bible_id: string | null = null
    if (isSupabaseConfigured && supabase && character_id && !character_id.startsWith('demo-')) {
      const { data: bible } = await supabase
        .from('series_bibles')
        .insert({
          character_id,
          episodes: sanitized,
          linked_story_ids: new Array(sanitized.length).fill(null),
        })
        .select('id')
        .single()

      if (bible) {
        bible_id = bible.id
      }
    }

    return NextResponse.json({ episodes: sanitized, bible_id })
  } catch (err) {
    console.error('Series bible generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate series bible', details: String(err) },
      { status: 500 }
    )
  }
}
