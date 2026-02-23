import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SlideSwipeScore, SwipeMomentumResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    story_id: string
    character: { name: string; job: string }
    scenes: { description: string; caption: string | null }[]
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

  // ── DEMO / FALLBACK ────────────────────────────────────────────────────────
  if (!apiKey) {
    const demoScores: SlideSwipeScore[] = scenes.map((s, i) => {
      // Purposely weak slides 3 and 6 (0-indexed: 2 and 5)
      const isWeak = i === 2 || i === 5
      const isVeryWeak = i === 2
      const prob = isVeryWeak ? 0.38 : isWeak ? 0.44 : Math.min(0.95, 0.65 + Math.random() * 0.25)
      const type: SlideSwipeScore['momentum_type'] =
        prob >= 0.75 ? 'strong' : prob >= 0.5 ? 'building' : prob >= 0.38 ? 'flat' : 'drop'
      return {
        slide_index: i,
        swipe_probability: Math.round(prob * 100) / 100,
        momentum_type: type,
        weakness: isWeak
          ? isVeryWeak
            ? "Répète l'information de la diapositive précédente — aucune nouvelle tension créée"
            : "Pic émotionnel trop tôt — la tension se dissipe avant le climax"
          : "Bon rythme narratif",
        fix_suggestion: isWeak
          ? "Terminer par une question ouverte ou une révélation partielle. Ex: 'Ce qu'elle ne savait pas encore, c'est que son médecin allait lui dire quelque chose qui changerait tout.'"
          : "Aucune correction nécessaire",
        rewritten_caption: isWeak
          ? `${s.caption ?? s.description} — mais ce soir-là, elle ne savait pas encore ce qui l'attendait.`
          : (s.caption ?? s.description),
      }
    })

    const criticalFixes = demoScores
      .filter((s) => s.swipe_probability < 0.5)
      .map((s) => s.slide_index)
    const strongSlides = demoScores
      .filter((s) => s.swipe_probability >= 0.75)
      .map((s) => s.slide_index)
    const dropOffSlide = demoScores.reduce(
      (minIdx, s) =>
        s.swipe_probability < (demoScores[minIdx]?.swipe_probability ?? 1) ? s.slide_index : minIdx,
      demoScores[0]?.slide_index ?? 0
    )

    const result: SwipeMomentumResult = {
      slide_scores: demoScores,
      overall_score: 71,
      grade: 'B',
      drop_off_slide: dropOffSlide,
      completion_rate_estimate: '~58% of viewers reach the last slide',
      critical_fixes: criticalFixes,
      strong_slides: strongSlides,
    }
    return NextResponse.json(result)
  }

  // ── CLAUDE ANALYSIS ────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey })

    const slidesText = scenes
      .map(
        (s, i) =>
          `Slide ${i + 1}:\nDescription: ${s.description}\nCaption: ${s.caption ?? '(no caption yet)'}`
      )
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a TikTok/Instagram carousel optimization expert. Analyze each slide for swipe-through momentum.

For each slide score these factors (0-1 each):
- tension_hook: Does the caption end with open question, unresolved tension, or forward-pulling statement?
- new_information: Does this slide add something genuinely new vs restating the previous slide?
- emotional_velocity: Is the emotional arc building toward climax at slides 5-7?
- caption_density_risk: More than 35 words is a risk — penalize (1 = no risk, 0 = very risky)
- transition_quality: Does the previous slide's ending make you NEED to see this slide?

Compute swipe_probability as weighted average: tension_hook*0.30 + new_information*0.25 + emotional_velocity*0.20 + caption_density_risk*0.10 + transition_quality*0.15

momentum_type must be exactly one of: "strong" (>=0.75), "building" (0.50-0.74), "flat" (0.35-0.49), "drop" (<0.35)

Write weakness and fix_suggestion in French.
Write rewritten_caption as a full improved caption in French with a cliffhanger hook.

Slides to analyze:
${slidesText}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "slide_scores": [
    {
      "slide_index": 0,
      "swipe_probability": 0.82,
      "momentum_type": "strong",
      "weakness": "...",
      "fix_suggestion": "...",
      "rewritten_caption": "..."
    }
  ],
  "overall_score": 71,
  "grade": "B",
  "drop_off_slide": 2,
  "completion_rate_estimate": "~58% of viewers reach the last slide",
  "critical_fixes": [2, 5],
  "strong_slides": [0, 1, 6, 7]
}

grade must be: "A" (90-100), "B" (75-89), "C" (60-74), "D" (45-59), "F" (<45)`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result: SwipeMomentumResult = JSON.parse(cleanedText)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Swipe momentum analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze swipe momentum', details: String(err) },
      { status: 500 }
    )
  }
}
