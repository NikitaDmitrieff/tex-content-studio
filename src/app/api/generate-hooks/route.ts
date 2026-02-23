import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { HookVariant } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    scenes: { description: string; emotional_beat: string }[]
    character_name: string
    character_age: number
    character_job: string
    emotional_tone: string
    virality_score?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scenes, character_name, character_age, character_job, emotional_tone, virality_score } = body

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'Missing or empty scenes array' }, { status: 400 })
  }

  if (!apiKey) {
    // Fallback mock variants
    const fallback: HookVariant[] = [
      {
        variant: `Ce que les médecins n'ont pas osé dire à ${character_name.split(' ')[0]} à ${character_age} ans...`,
        trigger_type: 'curiosity_gap',
        confidence_score: 72,
        hook_length_chars: 68,
      },
      {
        variant: `${character_name.split(' ')[0]} a transformé sa vie en 5 mois. Il a ${character_age} ans. Voici comment.`,
        trigger_type: 'shock_stat',
        confidence_score: 81,
        hook_length_chars: 74,
      },
      {
        variant: `Il travaillait comme ${character_job} depuis 20 ans et n'avait plus d'énergie pour sa famille...`,
        trigger_type: 'radical_relatability',
        confidence_score: 68,
        hook_length_chars: 85,
      },
    ]
    return NextResponse.json({ variants: fallback })
  }

  try {
    const client = new Anthropic({ apiKey })

    const storyContext = scenes
      .slice(0, 3)
      .map((s, i) => `Scène ${i + 1}: ${s.description} (beat: ${s.emotional_beat})`)
      .join('\n')

    const viralityContext = virality_score !== undefined
      ? `Score de viralité estimé: ${virality_score}/100`
      : ''

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en copywriting TikTok français ultra-viral. Crée 3 hooks d'accroche pour une story transformation en français, chacun ancré dans un déclencheur psychologique différent.

Contexte de la story :
- Personnage : ${character_name}, ${character_age} ans, ${character_job}
- Ton émotionnel : ${emotional_tone}
${viralityContext}

Premières scènes :
${storyContext}

Génère EXACTEMENT 3 hooks — un par déclencheur :

1. **curiosity_gap** — commence par un mystère ou une vérité incomplète. Ex: "Ce que les médecins n'ont pas osé lui dire à 54 ans..."
2. **shock_stat** — ouvre sur la transformation la plus saisissante avec des chiffres précis. Ex: "Marie a perdu 31 kg en 5 mois. Elle a 57 ans. Voici comment."
3. **radical_relatability** — s'ouvre sur exactement la douleur que le spectateur connaît. Ex: "Elle travaillait de nuit depuis 20 ans et n'avait plus d'énergie pour ses enfants..."

Règles :
- En français, naturel et TikTok-natif
- Maximum 120 caractères par hook
- Spécifique au personnage et à son histoire
- Pas de points de suspension systématiques (varier le style)

Réponds UNIQUEMENT avec du JSON valide (pas de markdown) :
{
  "variants": [
    {
      "variant": "texte du hook",
      "trigger_type": "curiosity_gap",
      "confidence_score": 78,
      "hook_length_chars": 65
    },
    {
      "variant": "texte du hook",
      "trigger_type": "shock_stat",
      "confidence_score": 85,
      "hook_length_chars": 72
    },
    {
      "variant": "texte du hook",
      "trigger_type": "radical_relatability",
      "confidence_score": 71,
      "hook_length_chars": 89
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

    // Ensure hook_length_chars is computed from actual variant text
    const variants: HookVariant[] = parsed.variants.map((v: HookVariant) => ({
      ...v,
      hook_length_chars: v.variant.length,
    }))

    return NextResponse.json({ variants })
  } catch (err) {
    console.error('Generate hooks error:', err)
    return NextResponse.json(
      { error: 'Failed to generate hooks', details: String(err) },
      { status: 500 }
    )
  }
}
