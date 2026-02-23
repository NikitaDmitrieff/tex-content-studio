import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CommentIntelligence, SequelBlueprint } from '@/lib/types'

const DEMO_BLUEPRINT: SequelBlueprint = {
  sequel_hook:
    'À tous ceux qui ont dit que c\'était fake... j\'ai les preuves. 7 mois plus tard.',
  sequel_emotional_tone: 'comeback',
  scenes: [
    {
      description:
        'Vous m\'avez dit que c\'était impossible. Que je mentais. Que c\'était une pub. J\'ai tout lu. Et au lieu de répondre, j\'ai continué.',
      emotional_beat: 'Hook callback',
      visual_prompt:
        'Middle-aged trucker, weathered face but confident, reading phone comments in truck cab, slight smirk, dashboard glow, raw phone photo quality',
      comment_driver: 'skeptics',
    },
    {
      description:
        'Vous avez demandé ce que je mange. Voilà: le matin, deux œufs et un café noir. Midi: ce que j\'ai dans mon thermos. Soir: simple. Pas de régime. Juste... moins.',
      emotional_beat: 'Burning question answered',
      visual_prompt:
        'Simple meal prep on truck seat, thermos and eggs visible, natural lighting, phone photo quality, authentic working man aesthetic',
      comment_driver: 'question_askers',
    },
    {
      description:
        'Mon partenaire de route m\'a demandé si j\'étais malade. "T\'as changé quelque chose?" J\'ai dit non. Il m\'a regardé bizarrement. Je souriais tout seul dans le noir après.',
      emotional_beat: 'Quiet progress noticed',
      visual_prompt:
        'Two truckers at rest stop, one looking at the other with surprise, night lighting, parking lot, authentic candid moment',
      comment_driver: 'believers',
    },
    {
      description:
        'Pour ceux qui ont taguée leur père: mon fils m\'a appelé la semaine dernière. Il avait vu la vidéo. Il a juste dit "je suis fier de toi papa." Je me suis garé sur le côté pour pas pleurer en conduisant.',
      emotional_beat: 'Emotional peak doubled',
      visual_prompt:
        'Trucker pulled over on shoulder, holding phone, emotional expression, golden hour through windshield, raw phone quality, genuine moment',
      comment_driver: 'emotional_amp',
    },
    {
      description:
        'Les "preuves" que vous vouliez. La même veste de travail. La même cabine. Mais mon dos ne me réveille plus la nuit. Je mets mes chaussures sans m\'asseoir. C\'est ça mes preuves.',
      emotional_beat: 'Receipts scene',
      visual_prompt:
        'Side-by-side comparison feel: same trucker in same work jacket but visibly healthier posture, truck cab, authentic lighting',
      comment_driver: 'skeptics',
    },
    {
      description:
        '7 mois. Pas une transformation Instagram. Pas un avant/après retouché. Juste moi, plus léger, qui dors enfin, qui conduit 12 heures sans avoir envie de mourir.',
      emotional_beat: 'Transformation documented',
      visual_prompt:
        'Trucker at truck stop, natural evening light, relaxed posture, genuine smile, candid phone photo style',
      comment_driver: 'question_askers',
    },
    {
      description:
        'La prochaine vidéo? Mon médecin m\'a dit quelque chose en consultation que je n\'attendais pas. Ça va changer tout ce que vous pensez savoir sur moi.',
      emotional_beat: 'Part 3 seed',
      visual_prompt:
        'Trucker in doctor\'s office waiting room, looking thoughtful, phone in hand, clinical lighting, slightly mysterious expression',
      comment_driver: 'setup_part3',
    },
  ],
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    story_id: string
    character: {
      name: string
      age: number
      job: string
      backstory: string
      physical_description: string
    }
    original_emotional_tone: string
    comment_intelligence: CommentIntelligence
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character, original_emotional_tone, comment_intelligence } = body

  if (!character || !comment_intelligence) {
    return NextResponse.json(
      { error: 'Missing character or comment_intelligence' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    return NextResponse.json({ blueprint: DEMO_BLUEPRINT })
  }

  try {
    const client = new Anthropic({ apiKey })

    const { classification, top_quotes, tension_analysis } = comment_intelligence

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en storytelling TikTok viral. Génère un arc de 7 scènes pour la Partie 2 d'une histoire basée sur l'analyse des commentaires de la Partie 1.

PERSONNAGE:
${character.name}, ${character.age} ans, ${character.job}
Histoire: ${character.backstory}
Apparence: ${character.physical_description}
Ton original: ${original_emotional_tone}

INTELLIGENCE DES COMMENTAIRES:
Distribution: ${classification.believers}% Croyants, ${classification.skeptics}% Sceptiques, ${classification.question_askers}% Questions, ${classification.emotional}% Émotionnels, ${classification.tag_friends}% Tagueurs

Débat principal: ${tension_analysis.primary_debate}
Question brûlante: ${tension_analysis.burning_question}
Signal viral: ${tension_analysis.viral_signal}

Commentaires des sceptiques (les plus virulents):
${top_quotes.skeptics.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Questions les plus posées:
${top_quotes.question_askers.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Réactions des croyants (pour l'énergie):
${top_quotes.believers.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

STRUCTURE OBLIGATOIRE DES 7 SCÈNES:
- Scène 1 (comment_driver: "skeptics"): Hook qui référence DIRECTEMENT le débat des commentaires, sans être défensif — intrigue plutôt que justification
- Scène 2 (comment_driver: "question_askers"): Répondre à la question brûlante de façon organique dans la narration
- Scène 3 (comment_driver: "believers"): Moment de connexion avec ceux qui croient, ancré dans le quotidien du personnage
- Scène 4 (comment_driver: "emotional_amp"): LE pic émotionnel qui a causé les tags — doublez-le, rendez-le encore plus fort
- Scène 5 (comment_driver: "skeptics"): La scène des "preuves" — répond aux sceptiques avec des détails concrets, pas des stats
- Scène 6 (comment_driver: "question_askers"): Deuxième réponse à une question non résolue, avec un twist personnel
- Scène 7 (comment_driver: "setup_part3"): Cliffhanger qui plante la graine de la Partie 3 — quelque chose d'inattendu qui vient de se passer

RÈGLES DE VOIX (identiques à la Partie 1):
- Première personne, comme un vrai humain qui tape sur son téléphone
- Fragments, run-ons, "...", "idk", "ngl", "tbh" avec parcimonie
- Hyper-spécifique: heures exactes, noms de collègues, lieux précis
- PHRASES INTERDITES: "little did I know", "journey", "game-changer", "plot twist"
- Le hook de la Partie 2 DOIT contenir un callback aux commentaires: "À tous ceux qui...", "Vous m'avez demandé...", "Pour ceux qui ont dit..."

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans code fences):
{
  "sequel_hook": "<hook en français, premier personne, avec callback aux commentaires>",
  "sequel_emotional_tone": "<comeback|revenge|quiet_transformation|rock_bottom|against_all_odds>",
  "scenes": [
    {
      "description": "<texte de la scène, première personne, brut>",
      "emotional_beat": "<label court 2-4 mots>",
      "visual_prompt": "<prompt photo IA incluant la description physique du personnage>",
      "comment_driver": "<skeptics|question_askers|emotional_amp|believers|setup_part3>"
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

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const blueprint: SequelBlueprint = JSON.parse(cleanedText)

    return NextResponse.json({ blueprint })
  } catch (err) {
    console.error('Sequel generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate sequel', details: String(err) },
      { status: 500 }
    )
  }
}
