import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ScanResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    scenes: { description: string; emotional_beat: string }[]
    language: 'en' | 'fr'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scenes } = body

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'Missing or empty scenes array' }, { status: 400 })
  }

  if (!apiKey) {
    const fallbackResults: ScanResult[] = scenes.map((scene, i) => {
      const score = Math.floor(Math.random() * 60) + 40
      return {
        slide_index: i,
        human_score: score,
        flagged_phrases: ['journey', 'game-changer', 'something shifted'].filter(() => Math.random() > 0.6),
        verdict: score >= 80 ? 'authentic' : score >= 60 ? 'suspicious' : 'ai_smell',
        rewrite: score < 75 ? `${scene.description} (rewritten for authenticity — messier, more specific)` : null,
      }
    })
    return NextResponse.json({ results: fallbackResults })
  }

  try {
    const client = new Anthropic({ apiKey })

    const slidesText = scenes
      .map((s, i) => `Slide ${i + 1}:\n${s.description}`)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a TikTok authenticity auditor. For each slide, analyze it from the perspective of a TikTok viewer who can instantly recognize AI-generated content. Detect: (1) AI clichés and banned phrases (journey, game-changer, something shifted, little did I know, needless to say, plot twist, fast forward), (2) abstract/vague language instead of hyper-specific real-person details, (3) unnatural cadence or over-punctuated sentences, (4) suspiciously coherent or polished writing. Rate each slide 0-100 human score (100 = only a real person could have written this). If score < 75, write a rewrite that sounds messier, more specific, more human — like someone typing on their phone at midnight.

Here are the slides to analyze:

${slidesText}

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "slide_index": 0,
    "human_score": 85,
    "flagged_phrases": ["journey"],
    "verdict": "authentic",
    "rewrite": null
  }
]

Where verdict must be exactly one of: "authentic" (score 80+), "suspicious" (score 60-79), or "ai_smell" (score <60).
If score < 75, provide a rewrite in the rewrite field that sounds genuinely human. Otherwise rewrite must be null.
slide_index must match the 0-based position of each slide.`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const results: ScanResult[] = JSON.parse(cleanedText)

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Scan authenticity error:', err)
    return NextResponse.json(
      { error: 'Failed to scan authenticity', details: String(err) },
      { status: 500 }
    )
  }
}
