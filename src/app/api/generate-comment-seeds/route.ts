import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { CommentSeedKit } from '@/lib/types'

type RequestBody = {
  story_id: string
}

function getDemoData(): CommentSeedKit {
  return {
    seeds: [
      {
        archetype: 'gentle_skeptic',
        comment_text: "C'est vrai ce truc? Elle a vraiment fait ça en si peu de temps?",
        creator_response: "Ouais promis c'est 100% réel, j'ai même gardé toutes mes photos de suivi. C'est pas magique, c'est juste de la constance.",
        controversy_level: 'sceptique',
        predicted_replies: '8-15 replies',
        thread_shape: 'skeptic battle',
      },
      {
        archetype: 'personal_echo',
        comment_text: "Ma sœur c'est exactement la même situation, je lui envoie ça direct",
        creator_response: "Envoie-lui! Dis-lui que le plus dur c'est le premier mois, après ça devient une habitude.",
        controversy_level: 'douce',
        predicted_replies: '12-20 replies',
        thread_shape: 'personal story flood',
      },
      {
        archetype: 'soft_provocateur',
        comment_text: "Ces applis fitness c'est toujours exagéré mais bon elle a l'air réelle",
        creator_response: "Haha je comprends le scepticisme, moi-même j'aurais dit pareil avant. Ce qui m'a surprise c'est que ça demande pas de se priver de tout.",
        controversy_level: 'hot_take',
        predicted_replies: '15-25 replies',
        thread_shape: 'skeptic battle',
      },
      {
        archetype: 'curiosity_magnet',
        comment_text: "Mais elle mange quoi exactement? Quelqu'un sait ce qu'elle utilise?",
        creator_response: "Je vais faire une vidéo sur ce que je mange dans une journée type! Follow pour pas rater ça.",
        controversy_level: 'curiosite',
        predicted_replies: '20-35 replies',
        thread_shape: 'info request chain',
      },
      {
        archetype: 'shock_amplifier',
        comment_text: "MAIS elle avait 52 ans?? Moi j'essaie depuis 3 ans je comprends pas 😭",
        creator_response: "52 ans et j'avais jamais réussi à tenir plus de 2 semaines avant. La différence c'était avoir un truc qui s'adapte à MON emploi du temps.",
        controversy_level: 'choc',
        predicted_replies: '30-50 replies',
        thread_shape: 'inspiration spiral',
      },
    ],
    strategy_summary:
      "Postez le commentaire choc en premier pour l'algorithme, suivi du sceptique doux 10 minutes après. La combinaison crée une dynamique débat + validation qui pousse TikTok à amplifier la portée dans la première heure.",
    optimal_post_order: [5, 1, 3, 2, 4],
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { story_id } = body

  if (!story_id) {
    return NextResponse.json({ error: 'Missing story_id' }, { status: 400 })
  }

  // Fetch story and scenes from DB
  let character_name = 'Marie'
  let character_job = 'Infirmière'
  let character_age = 52
  let emotional_tone = 'comeback'
  let hook_text = ''
  let scenes_summary = ''

  if (isSupabaseConfigured && supabase && !story_id.startsWith('demo-') && !story_id.startsWith('new-')) {
    const { data: story } = await supabase.from('stories').select('*').eq('id', story_id).single()
    if (story) {
      character_name = story.character_name
      character_job = story.character_job
      character_age = story.character_age
      emotional_tone = story.emotional_tone
      hook_text = story.selected_hook ?? ''
    }

    const { data: scenes } = await supabase
      .from('scenes')
      .select('description, emotional_beat')
      .eq('story_id', story_id)
      .order('order_index', { ascending: true })

    if (scenes?.length) {
      scenes_summary = scenes
        .map((s: { description: string; emotional_beat: string }, i: number) => `Scene ${i + 1}: ${s.description} (${s.emotional_beat})`)
        .join('\n')
    }
  }

  if (!apiKey) {
    const demo = getDemoData()
    // Persist demo data
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stories').update({ comment_seeds: demo }).eq('id', story_id)
    }
    return NextResponse.json(demo)
  }

  const prompt = `You are a viral TikTok comment strategist specializing in the French fitness transformation niche.

CHARACTER:
Name: ${character_name}
Age: ${character_age}
Job: ${character_job}
Emotional tone: ${emotional_tone}
${hook_text ? `Hook text: ${hook_text}` : ''}

STORY SUMMARY:
${scenes_summary || 'A fitness transformation journey with before/after results.'}

Generate 5 seed comments in authentic French TikTok vernacular. Each comment represents a distinct psychological trigger archetype. These are comments that a real person would plant to ignite the algorithm in the first hour after posting.

Return a JSON object with this exact structure:
{
  "seeds": [
    {
      "archetype": "gentle_skeptic",
      "comment_text": "<comment in French TikTok slang — e.g. 'C'est vrai ce truc? Elle a vraiment fait ça en si peu de temps?'>",
      "creator_response": "<ideal 1-2 sentence reply from the account that fuels 3+ more replies>",
      "controversy_level": "sceptique",
      "predicted_replies": "<e.g. '8-15 replies'>",
      "thread_shape": "skeptic battle"
    },
    {
      "archetype": "personal_echo",
      "comment_text": "<comment referencing a sister/friend in the same situation — e.g. 'Ma sœur c'est exactement la même situation, je lui envoie ça direct'>",
      "creator_response": "<reply that invites more personal stories>",
      "controversy_level": "douce",
      "predicted_replies": "<e.g. '12-20 replies'>",
      "thread_shape": "personal story flood"
    },
    {
      "archetype": "soft_provocateur",
      "comment_text": "<mildly skeptical comment about fitness apps/content being exaggerated — e.g. 'Ces applis fitness c'est toujours exagéré mais bon elle a l'air réelle'>",
      "creator_response": "<disarming reply that validates the skepticism and pivots to authenticity>",
      "controversy_level": "hot_take",
      "predicted_replies": "<e.g. '15-25 replies'>",
      "thread_shape": "skeptic battle"
    },
    {
      "archetype": "curiosity_magnet",
      "comment_text": "<question asking what exactly the person eats/uses — drives info chain>",
      "creator_response": "<teaser reply that promises more details and drives follows>",
      "controversy_level": "curiosite",
      "predicted_replies": "<e.g. '20-35 replies'>",
      "thread_shape": "info request chain"
    },
    {
      "archetype": "shock_amplifier",
      "comment_text": "<shocked comment about an age/time detail with emoji — e.g. 'MAIS elle avait 52 ans?? Moi j'essaie depuis 3 ans je comprends pas 😭'>",
      "creator_response": "<vulnerable reply that explains what made the difference, fuels inspiration spiral>",
      "controversy_level": "choc",
      "predicted_replies": "<e.g. '30-50 replies'>",
      "thread_shape": "inspiration spiral"
    }
  ],
  "strategy_summary": "<2-3 sentences in French explaining the 1-hour engagement trajectory: which comment to post first, the dynamic it creates, and why the algorithm will pick it up>",
  "optimal_post_order": [<array of 1-based indices in optimal posting order, e.g. [5,1,3,2,4]>]
}

RULES:
- All comments MUST be in authentic French TikTok slang (tutoiement, informal, real emotions)
- Comments must feel like they were written by real viewers, not bots
- Reference specific details from the character's story (age: ${character_age}, job: ${character_job})
- Each creator_response must naturally invite more replies without looking scripted
- controversy_level must be one of: "douce", "sceptique", "hot_take", "curiosite", "choc"
- Respond ONLY with the JSON object, no markdown, no code fences`

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result: CommentSeedKit = JSON.parse(cleanedText)

    // Persist to DB
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stories').update({ comment_seeds: result }).eq('id', story_id)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Comment seeds generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate comment seeds', details: String(err) },
      { status: 500 }
    )
  }
}
