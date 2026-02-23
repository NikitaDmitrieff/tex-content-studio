import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { CommentIntelligence } from '@/lib/types'

const DEMO_INTELLIGENCE: CommentIntelligence = {
  classification: {
    believers: 34,
    skeptics: 28,
    question_askers: 19,
    emotional: 11,
    tag_friends: 8,
  },
  top_quotes: {
    believers: [
      "omg cette transformation 😭🙏 t'as changé ma vie fr",
      "je pleure c'est exactement mon histoire tu m'as donné de l'espoir",
      "mon père a le même job il a besoin de voir ça",
    ],
    skeptics: [
      "ouais c'est fake, personne perd autant en si peu de temps 🙄",
      "montre-nous les vraies photos avant/après pas juste le visage",
      "quel app? parce que c'est clairement une pub déguisée",
    ],
    question_askers: [
      "tu manges quoi exactement? donne le menu complet stp",
      "est-ce que tu fais du sport en plus ou juste l'alimentation?",
      "combien de temps exactement? t'as commencé quel mois?",
    ],
  },
  tension_analysis: {
    primary_debate: "Les gens doutent de l'authenticité de la rapidité de la transformation",
    burning_question: "Qu'est-ce qu'il mange exactement et quel est son programme complet?",
    viral_signal:
      "23 personnes ont tagué leurs pères dans les commentaires — signal émotionnel fort",
    sequel_potential_score: 78,
  },
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { raw_comments: string; story_id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { raw_comments, story_id } = body

  if (!raw_comments || !story_id) {
    return NextResponse.json({ error: 'Missing raw_comments or story_id' }, { status: 400 })
  }

  if (!apiKey) {
    // Demo mode: save and return demo data
    if (isSupabaseConfigured && supabase && !story_id.startsWith('new-') && !story_id.startsWith('demo-')) {
      await supabase
        .from('stories')
        .update({ comment_intelligence: DEMO_INTELLIGENCE })
        .eq('id', story_id)
    }
    return NextResponse.json({ intelligence: DEMO_INTELLIGENCE })
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyse ces commentaires TikTok et classe-les en 5 catégories. Réponds UNIQUEMENT en JSON valide, sans markdown.

COMMENTAIRES:
${raw_comments}

Règles de classification:
- believers: ceux qui croient, témoignent d'une expérience similaire, encouragent
- skeptics: ceux qui doutent, accusent de fake, demandent des preuves
- question_askers: ceux qui posent des questions pratiques (comment, quoi, combien)
- emotional: ceux qui ont une réaction émotionnelle forte (pleurent, taguent un proche, s'identifient profondément)
- tag_friends: ceux qui taguent quelqu'un spécifiquement

Réponds avec ce JSON exact (les nombres sont des pourcentages qui doivent faire 100 au total):
{
  "classification": {
    "believers": <number>,
    "skeptics": <number>,
    "question_askers": <number>,
    "emotional": <number>,
    "tag_friends": <number>
  },
  "top_quotes": {
    "believers": ["<quote1>", "<quote2>", "<quote3>"],
    "skeptics": ["<quote1>", "<quote2>", "<quote3>"],
    "question_askers": ["<quote1>", "<quote2>", "<quote3>"]
  },
  "tension_analysis": {
    "primary_debate": "<une phrase décrivant la controverse principale>",
    "burning_question": "<la question la plus posée, reformulée clairement>",
    "viral_signal": "<la réaction émotionnelle inattendue la plus amplifiable>",
    "sequel_potential_score": <number between 0-100>
  }
}`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const intelligence: CommentIntelligence = JSON.parse(cleanedText)

    if (isSupabaseConfigured && supabase && !story_id.startsWith('new-') && !story_id.startsWith('demo-')) {
      await supabase
        .from('stories')
        .update({ comment_intelligence: intelligence })
        .eq('id', story_id)
    }

    return NextResponse.json({ intelligence })
  } catch (err) {
    console.error('Comment analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze comments', details: String(err) },
      { status: 500 }
    )
  }
}
