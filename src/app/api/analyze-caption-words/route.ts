import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { WordScore, CaptionWordAnalysisResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { scenes: { id: string; caption: string }[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scenes } = body
  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'Missing or empty scenes array' }, { status: 400 })
  }

  // ── DEMO / FALLBACK ────────────────────────────────────────────────────────
  if (!apiKey) {
    const demoResult: CaptionWordAnalysisResult = {
      scenes: scenes.map((scene) => {
        const words = scene.caption.split(/\s+/).filter(Boolean)
        return {
          sceneId: scene.id,
          words: words.map((word, i): WordScore => {
            const score = i % 3 === 0 ? 8 : i % 3 === 1 ? 5 : 3
            return {
              word,
              score,
              reason_fr:
                score >= 7
                  ? 'Mot émotionnel fort'
                  : score >= 4
                  ? 'Mot neutre'
                  : "Mot vague — réduit l'engagement",
              alternatives: score < 5 ? ['plus fort', 'incroyable', 'transformé'] : [],
            }
          }),
        }
      }),
    }
    return NextResponse.json(demoResult)
  }

  // ── CLAUDE ANALYSIS ────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey })

    const captionsText = scenes
      .map((s, i) => `Scene ${i + 1} (id: ${s.id}):\n${s.caption}`)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a French TikTok virality expert specializing in fitness transformation content.
For each caption below, analyze every word and score it 1-10 for scroll-stop potential.
High-scoring words (7-10): emotional triggers, specificity, French vernacular, vulnerability, urgency, numbers/data, French fitness slang.
Mid-scoring words (4-6): neutral functional words.
Low-scoring words (1-3): vague adjectives, filler words, generic verbs, over-formal language.
For each word under 5/10, provide 3 French replacement suggestions that score higher.
reason_fr must be a short French explanation (max 10 words).

Captions to analyze:
${captionsText}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "scenes": [
    {
      "sceneId": "scene-id-here",
      "words": [
        { "word": "mot", "score": 8, "reason_fr": "Mot de vulnérabilité — ancre le lecteur", "alternatives": [] },
        { "word": "faible", "score": 3, "reason_fr": "Adjectif vague — réduit l'impact", "alternatives": ["brisé", "épuisé", "à terre"] }
      ]
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
    const result: CaptionWordAnalysisResult = JSON.parse(cleanedText)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Caption word analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze caption words', details: String(err) },
      { status: 500 }
    )
  }
}
