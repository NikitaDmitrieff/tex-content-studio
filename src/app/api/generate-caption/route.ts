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
        hook: `I was ${character_age} and couldn't walk up a flight of stairs without stopping twice.`,
        body: `${character_name}'s story hit different. Swipe through.`,
        cta: `the app that started it all is in my bio. no pressure, just putting it there.`,
        hashtags: '#transformation #fitness #realpeople #glow #fitover40 #motivation #fyp #viral',
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
          content: `Write a TikTok post caption for a photo carousel. The carousel tells a fitness transformation story.

CHARACTER: ${character_name}, ${character_age}, ${character_job}
TONE: ${emotional_tone}

THE CAROUSEL STORY:
${storyText}

Write the caption that goes OUTSIDE the carousel (the post text). This is where we can be slightly more direct about the app — but still subtle.

CAPTION STRUCTURE — return as JSON:
{
  "hook": "The first line people see before they tap 'more'. Must stop the scroll. 1 sentence, punchy, emotional, specific. Examples of good hooks: 'I was 54 and my daughter was embarrassed to be seen with me.', 'Nobody warns you that giving up on yourself is a slow process.', 'I downloaded an app at 2am and it ruined my life (in the best way).'",
  "body": "2-3 sentences max. Tease the story without spoiling it. Make people want to swipe. Write casually, like you're texting a friend. Use line breaks between sentences.",
  "cta": "The soft sell. This is where the app gets mentioned — but make it feel like an afterthought, not a pitch. Examples: 'the app is in my bio if you're curious, no pressure', 'someone asked what app I used — it's in my bio', 'link in bio if you want to try what worked for me'. NEVER say 'download now' or 'check it out'. Keep it genuinely casual.",
  "hashtags": "8-12 hashtags mixing broad (#fyp #viral #transformation) with niche (#fitover40 #realresults #glowup). No branded hashtags."
}

RULES:
- The hook MUST be specific to this character's story — not generic motivation
- Write like a real person, not a copywriter. Messy, casual, authentic.
- BANNED: "link in bio" as the ONLY cta (add context), emoji spam, "comment below", "share with a friend who needs this"
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
