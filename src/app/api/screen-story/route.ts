import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ScreeningResult, HookPersonaScore } from '@/lib/types'

const HOOK_PERSONAS = [
  { name: 'Sylvie Moreau', emoji: '👩‍⚕️', age: 47, job: 'Aide-soignante', city: 'Bretagne' },
  { name: 'Karim Benali', emoji: '🚖', age: 39, job: 'Chauffeur de taxi', city: 'Lyon' },
  { name: 'Brigitte Tessier', emoji: '👩‍💼', age: 55, job: 'Secrétaire médicale', city: 'Bordeaux' },
  { name: 'Thomas Dupont', emoji: '🎓', age: 28, job: 'Étudiant en commerce', city: 'Paris' },
  { name: 'Nathalie Roux', emoji: '🏠', age: 51, job: 'Assistante maternelle', city: 'Toulouse' },
]

async function handleHookTestMode(
  apiKey: string | undefined,
  hookText: string,
  characterName: string,
  characterJob: string,
  characterAge: number,
  emotionalTone: string
): Promise<NextResponse> {
  if (!apiKey) {
    const scores: HookPersonaScore[] = HOOK_PERSONAS.map((p) => ({
      persona_name: p.name,
      persona_emoji: p.emoji,
      scroll_stop_likelihood: Math.floor(Math.random() * 60) + 30,
      predicted_reaction: `${p.name.split(' ')[0]} s'arrête sur ce hook — ça lui parle directement.`,
    }))
    const scroll_stop_score = Math.round(scores.reduce((s, p) => s + p.scroll_stop_likelihood, 0) / scores.length)
    return NextResponse.json({ persona_scores: scores, scroll_stop_score })
  }

  const client = new Anthropic({ apiKey })

  const personasText = HOOK_PERSONAS.map(
    (p, i) => `${i + 1}. ${p.name}, ${p.age} ans, ${p.job} à ${p.city}`
  ).join('\n')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en psychologie des audiences TikTok françaises. Évalue ce hook d'accroche pour chacun des 5 personas suivants.

Hook à évaluer : "${hookText}"

Contexte : Story de transformation de ${characterName}, ${characterAge} ans, ${characterJob} (ton: ${emotionalTone})

Personas :
${personasText}

Pour chaque persona, détermine :
- scroll_stop_likelihood : probabilité 0-100 qu'il/elle s'arrête sur ce hook
- predicted_reaction : une réaction courte et authentique en français (max 15 mots)

Réponds UNIQUEMENT en JSON valide (pas de markdown) :
{
  "persona_scores": [
    {
      "persona_name": "Sylvie Moreau",
      "persona_emoji": "👩‍⚕️",
      "scroll_stop_likelihood": 78,
      "predicted_reaction": "Ça me parle exactement, j'aurais pu écrire ça moi-même"
    }
  ]
}`,
      },
    ],
  })

  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const cleaned = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
  const parsed = JSON.parse(cleaned)
  const scores: HookPersonaScore[] = parsed.persona_scores

  // Ensure emojis are set (Claude might not preserve them exactly)
  const scoredWithEmojis = scores.map((s, i) => ({
    ...s,
    persona_emoji: HOOK_PERSONAS[i]?.emoji ?? s.persona_emoji,
  }))

  const scroll_stop_score = Math.round(
    scoredWithEmojis.reduce((sum, p) => sum + p.scroll_stop_likelihood, 0) / scoredWithEmojis.length
  )

  return NextResponse.json({ persona_scores: scoredWithEmojis, scroll_stop_score })
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    scenes: { description: string; emotional_beat: string }[]
    character_name: string
    character_job: string
    character_age: number
    emotional_tone: string
    hook_test_mode?: boolean
    hook_text?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scenes, character_name, character_job, character_age, emotional_tone, hook_test_mode, hook_text } = body

  // Hook test mode: lightweight scoring of a single hook text
  if (hook_test_mode) {
    if (!hook_text) {
      return NextResponse.json({ error: 'Missing hook_text for hook_test_mode' }, { status: 400 })
    }
    try {
      return await handleHookTestMode(apiKey, hook_text, character_name, character_job, character_age, emotional_tone)
    } catch (err) {
      console.error('Hook scoring error:', err)
      return NextResponse.json({ error: 'Failed to score hook', details: String(err) }, { status: 500 })
    }
  }

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'Missing or empty scenes array' }, { status: 400 })
  }

  if (!apiKey) {
    const fallbackResult: ScreeningResult = {
      personas: [
        {
          name: 'Sylvie Moreau',
          age: 47,
          job: 'Aide-soignante',
          city: 'Bretagne',
          emoji: '👩‍⚕️',
          completion_likelihood: Math.round((0.65 + Math.random() * 0.25) * 100) / 100,
          predicted_comment:
            'Oh mon dieu ça ressemble tellement à mon ex-mari 😭 partie 2 svp !!',
          would_save: Math.random() > 0.4,
          would_share: Math.random() > 0.65,
          drop_off_slide: Math.random() > 0.6 ? null : Math.floor(Math.random() * scenes.length),
          emotional_reaction: 'Touchée au slide 3, accrochée jusqu\'à la fin',
        },
        {
          name: 'Karim Benali',
          age: 39,
          job: 'Chauffeur de taxi',
          city: 'Lyon',
          emoji: '🚖',
          completion_likelihood: Math.round((0.55 + Math.random() * 0.3) * 100) / 100,
          predicted_comment:
            'C\'est exactement moi ça frère... j\'ai mis cette vidéo en favori',
          would_save: Math.random() > 0.35,
          would_share: Math.random() > 0.55,
          drop_off_slide: Math.random() > 0.5 ? null : Math.floor(Math.random() * scenes.length),
          emotional_reaction: 'Motivé par le slide 2, hésitant au milieu',
        },
        {
          name: 'Brigitte Tessier',
          age: 55,
          job: 'Secrétaire médicale',
          city: 'Bordeaux',
          emoji: '👩‍💼',
          completion_likelihood: Math.round((0.5 + Math.random() * 0.35) * 100) / 100,
          predicted_comment:
            'Si lui y arrive, moi aussi j\'aurais aucune excuse... sauvegardé 🔖',
          would_save: Math.random() > 0.3,
          would_share: Math.random() > 0.7,
          drop_off_slide: Math.random() > 0.55 ? null : Math.floor(Math.random() * scenes.length),
          emotional_reaction: 'Inspirée mais sceptique, finit quand même la vidéo',
        },
      ],
      scene_scores: scenes.map((_, i) => {
        const score = Math.floor(Math.random() * 60) + 30
        const isDanger = score < 50
        return {
          scene_index: i,
          engagement_score: score,
          danger_zone: isDanger,
          note: isDanger
            ? 'Scène trop vague — manque de tension et de détails concrets'
            : 'Scène solide — bonne accroche émotionnelle',
          rewrite_suggestion: isDanger
            ? `${scenes[i].description} — ajouter un chiffre précis ou un moment de vie concret pour rendre la scène plus ancrée dans le réel.`
            : undefined,
        }
      }),
      virality_score: Math.floor(Math.random() * 35) + 45,
      verdict: Math.random() > 0.6 ? 'needs_work' : Math.random() > 0.5 ? 'ready' : 'reshoot',
      key_improvements: [
        `Le slide 4 manque de tension — ajouter un chiffre ou un moment précis`,
        `Le titre d'accroche peut être plus spécifique au métier de ${character_job}`,
        `Partie 2 bait trop faible en dernier slide — ${character_name.split(' ')[0]} ne partagerait pas sans un vrai cliffhanger`,
      ],
    }
    return NextResponse.json(fallbackResult)
  }

  try {
    const client = new Anthropic({ apiKey })

    const slidesText = scenes
      .map((s, i) => `Scène ${i + 1}:\nDescription: ${s.description}\nBeat émotionnel: ${s.emotional_beat}`)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Tu es un simulateur de réactions TikTok français ultra-réaliste. Tu vas analyser une série de scènes d'une story TikTok destinée à un public français et simuler les réactions de 3 personas spécifiques.

Personnage principal de la story :
- Nom : ${character_name}
- Âge : ${character_age} ans
- Métier : ${character_job}
- Ton émotionnel : ${emotional_tone}

Voici les scènes à analyser :

${slidesText}

Tu dois simuler EXACTEMENT ces 3 personas (ne les modifie pas) :
1. Sylvie Moreau, 47 ans, aide-soignante en Bretagne, scrolle TikTok le soir après le travail, sensible aux histoires de personnes qui ressemblent à ses collègues
2. Karim Benali, 39 ans, chauffeur de taxi à Lyon, cherche de la motivation, aime les histoires de « gars ordinaires » qui changent
3. Brigitte Tessier, 55 ans, secrétaire médicale à Bordeaux, veut reprendre le sport depuis 3 ans, susceptible de sauvegarder les contenus inspirants

Pour chaque persona, détermine :
- completion_likelihood : probabilité (0.0 à 1.0) qu'il/elle regarde toutes les scènes
- predicted_comment : un commentaire TikTok authentique en français (avec emojis, langage naturel)
- would_save : vrai/faux selon son profil
- would_share : vrai/faux selon son profil
- drop_off_slide : index (0-based) de la scène où il/elle décroche (null si regarde jusqu'à la fin)
- emotional_reaction : une phrase décrivant sa réaction émotionnelle

Pour chaque scène, évalue :
- engagement_score : 0-100 (100 = très engageant)
- danger_zone : true si score < 50
- note : analyse courte en français (max 15 mots)
- rewrite_suggestion : proposition de réécriture en français si danger_zone est true (sinon omis)

Calcule :
- virality_score : score global de viralité 0-100
- verdict : "ready" si virality_score >= 75, "reshoot" si < 45, sinon "needs_work"
- key_improvements : 2-4 améliorations concrètes en français, mentionnant les personas et les scènes spécifiques

Réponds UNIQUEMENT avec du JSON valide (pas de markdown, pas de code fences) :
{
  "personas": [
    {
      "name": "Sylvie Moreau",
      "age": 47,
      "job": "Aide-soignante",
      "city": "Bretagne",
      "emoji": "👩‍⚕️",
      "completion_likelihood": 0.82,
      "predicted_comment": "Oh mon dieu...",
      "would_save": true,
      "would_share": false,
      "drop_off_slide": null,
      "emotional_reaction": "..."
    }
  ],
  "scene_scores": [
    {
      "scene_index": 0,
      "engagement_score": 88,
      "danger_zone": false,
      "note": "Hook fort — chiffre concret"
    }
  ],
  "virality_score": 74,
  "verdict": "needs_work",
  "key_improvements": ["...", "..."]
}`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result: ScreeningResult = JSON.parse(cleanedText)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Screen story error:', err)
    return NextResponse.json(
      { error: 'Failed to screen story', details: String(err) },
      { status: 500 }
    )
  }
}
