import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

type RequestBody = {
  character_name: string
  character_age: number
  character_job: string
  character_backstory: string
  emotional_tone: string
  scenes: { description: string; emotional_beat: string }[]
  language?: 'en' | 'fr'
  platform?: string
  reality_anchors?: { anchors: { fact: string; type: string }[] } | null
}

export type PlatformPack = {
  twitter_thread: string[]
  youtube_shorts_script: string
  pinterest_caption: string
  facebook_post: string
  instagram_caption: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    character_name,
    character_age,
    character_job,
    character_backstory,
    emotional_tone,
    scenes,
    language = 'en',
    reality_anchors,
  } = body

  if (!character_name || !scenes?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  const langInstruction =
    language === 'fr'
      ? 'Write ALL output in French. Use informal register, authentic French social media language.'
      : 'Write ALL output in English. Use casual, authentic American English.'

  const sceneList = scenes
    .map((s, i) => `Scene ${i + 1} (${s.emotional_beat}): ${s.description}`)
    .join('\n')

  const realityNote =
    reality_anchors?.anchors?.length
      ? `\nREALITY ANCHORS (inject naturally per platform):\n${reality_anchors.anchors.map((a) => `- ${a.fact}`).join('\n')}`
      : ''

  const prompt = `You are creating a cross-platform content pack for a fitness transformation story. The same character's voice must be authentic, raw, and non-corporate across all platforms.

CHARACTER: ${character_name}, age ${character_age}, ${character_job}
BACKSTORY: ${character_backstory || 'Not provided'}
EMOTIONAL TONE: ${emotional_tone}${realityNote}

THE STORY SCENES:
${sceneList}

LANGUAGE: ${langInstruction}

Create platform-optimized content for all 5 platforms. Rules:
- NEVER use AI clichés: no "little did I know", "journey", "transformation journey", "I realized", "something shifted"
- Maintain the same character voice — raw, honest, imperfect
- Twitter: punchy, each tweet max 270 chars, thread-style (1 tweet per scene + opening tweet)
- YouTube Shorts: 55-second first-person voiceover with timecodes [0:00–0:10] format, end with CTA card note
- Pinterest: aspirational, SEO keyword-dense (fitness, transformation, motivation terms), 150-200 words
- Facebook: warm, community-oriented, more verbose, 200-300 words, ends with an open question to readers
- Instagram: reels-style caption with strategic line breaks, minimal emojis (2-3 max), hook in first line

Return ONLY this JSON (no markdown, no code fences):
{
  "twitter_thread": ["<opening tweet>", "<scene 1 tweet>", "<scene 2 tweet>", ...],
  "youtube_shorts_script": "<full script with [0:00-0:05] timecodes>",
  "pinterest_caption": "<aspirational SEO caption>",
  "facebook_post": "<warm community post ending with question>",
  "instagram_caption": "<reels caption with line breaks>"
}`

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const pack: PlatformPack = JSON.parse(cleanedText)

    return NextResponse.json({ pack })
  } catch (err) {
    console.error('Multiplatform pack generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate platform pack', details: String(err) },
      { status: 500 }
    )
  }
}
