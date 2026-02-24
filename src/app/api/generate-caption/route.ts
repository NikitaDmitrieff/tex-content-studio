import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    character_name: string
    character_age: number
    character_job: string
    emotional_tone: string
    scenes: Array<{ description: string; emotional_beat: string }>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character_name, character_age, character_job, emotional_tone, scenes } = body

  if (!character_name || !scenes?.length) {
    return NextResponse.json({ error: 'Missing character or scenes' }, { status: 400 })
  }

  const storyText = scenes.map((s, i) => `Slide ${i + 1}: ${s.description}`).join('\n')

  if (!apiKey) {
    return NextResponse.json({
      caption: {
        hook: `J'avais ${character_age} ans et j'pouvais plus monter un escalier sans m'arrêter deux fois.`,
        body: `L'histoire de ${character_name} elle tape différemment. Swipe.`,
        cta: `l'appli qui a tout lancé est dans ma bio. pas de pression, c'est juste là.`,
        hashtags: '#transformation #fitness #vraigens #changement #motivation #fyp #pourtoi #pertedepoids',
      },
    })
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Write a TikTok post caption IN FRENCH for a photo carousel. The carousel tells a fitness transformation story for a FRENCH audience on TikTok France.

CHARACTER: ${character_name}, ${character_age}, ${character_job}
TONE: ${emotional_tone}

THE CAROUSEL STORY:
${storyText}

Write the caption IN FRENCH that goes OUTSIDE the carousel (the post text). This is where we can be slightly more direct about the app — but still subtle.

LANGUAGE: Write EVERYTHING in informal spoken French. Like a real French person posting on TikTok. NOT literary French.

CAPTION STRUCTURE — return as JSON:
{
  "hook": "The first line in FRENCH. Must stop the scroll. 1 sentence, punchy, emotional, specific. Examples: 'J'avais 54 ans et ma fille avait honte d'être vue avec moi.', 'Personne te prévient que lâcher prise sur soi c'est un truc lent.', 'J'ai téléchargé une appli à 2h du mat et ça a tout changé (en bien).'",
  "body": "2-3 sentences max IN FRENCH. Tease the story without spoiling. Make people want to swipe. Write casually, spoken French, like you're texting. Use line breaks between sentences.",
  "cta": "The soft sell IN FRENCH. Mention the app casually. Examples: 'l'appli est dans ma bio si ça vous dit, pas de pression', 'on m'a demandé quelle appli j'ai utilisé — c'est dans ma bio', 'lien en bio si vous voulez tester ce qui a marché pour moi'. NEVER use formal French. Keep it genuinely casual.",
  "hashtags": "8-12 hashtags mixing French broad (#fyp #pourtoi #transformation) with French niche (#pertedepoids #remiseenforme #changementdevie #avantaprès #fitness #motivation #vraigens). Use French hashtags, not English ones (except #fyp)."
}

RULES:
- EVERYTHING must be in FRENCH (except hashtags can have some universal ones like #fyp)
- The hook MUST be specific to this character's story — not generic motivation
- Write like a real French person, not a copywriter. Messy, casual, authentic spoken French.
- BANNED: "lien en bio" as the ONLY cta (add context), emoji spam, "commentez", "partagez"
- The body should create curiosity — make them NEED to swipe
- Total caption should be under 150 words

Respond ONLY with the JSON object (no markdown, no code fences).`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const caption = JSON.parse(cleanedText)

    return NextResponse.json({ caption })
  } catch (err) {
    console.error('Caption generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate caption', details: String(err) },
      { status: 500 }
    )
  }
}
