import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Scene, Story, FormatAdaptResult } from '@/lib/types'

const FORMAT_DEMO_TEMPLATES: Record<
  string,
  { voice: string; title_pattern: string; caption_pattern: string }
> = {
  pov_coach: {
    voice: 'POV: second-person present tense, reader is the protagonist',
    title_pattern: 'POV: Tu {action}',
    caption_pattern: 'POV: Tu {scene_summary}. Et tu réalises que...',
  },
  '30_jours_defi': {
    voice: 'Day-log structure with milestone markers',
    title_pattern: 'Jour {day} — {milestone}',
    caption_pattern: 'Jour {day}: {scene_summary}',
  },
  personne_ne_ma_dit: {
    voice: 'Revelation listicle \u2014 each slide is an unexpected truth',
    title_pattern: "Ce que personne ne m\u2019a dit #{num}",
    caption_pattern: "Ce que personne ne m\u2019a dit: {scene_summary}",
  },
  essaye_30_jours: {
    voice: 'Skeptic-to-convert experiment arc',
    title_pattern: 'Semaine {week}',
    caption_pattern: "J\u2019ai essay\u00e9 {format} \u2014 {scene_summary}",
  },
  avant_que_je_sache: {
    voice: 'Nostalgic narrator who has already succeeded looking back',
    title_pattern: 'Avant que je sache...',
    caption_pattern: 'Ce que je ne savais pas encore: {scene_summary}',
  },
  coach_dit_toujours: {
    voice: 'Coach authority voice dispensing wisdom',
    title_pattern: 'R\u00e8gle #{num}',
    caption_pattern: 'Mon coach dit toujours: {scene_summary}',
  },
  commentaires_pousse: {
    voice: 'Community-reactive storytelling driven by comments',
    title_pattern: "Vous m\u2019avez demand\u00e9...",
    caption_pattern: "Vous m\u2019avez pouss\u00e9 \u00e0 {scene_summary}",
  },
  journee_dans_sa_vie: {
    voice: 'Cinematic day-in-life vignette style',
    title_pattern: '{time_of_day}',
    caption_pattern: '{time_of_day}: {scene_summary}',
  },
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    story: Story
    scenes: Scene[]
    format_id: string
    format_name: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { story, scenes, format_id, format_name } = body

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'Missing or empty scenes array' }, { status: 400 })
  }

  if (!format_id || !format_name) {
    return NextResponse.json({ error: 'Missing format_id or format_name' }, { status: 400 })
  }

  // ── DEMO / FALLBACK ────────────────────────────────────────────────────────
  if (!apiKey) {
    const template = FORMAT_DEMO_TEMPLATES[format_id]
    const adapted_scenes: Scene[] = scenes.map((scene, i) => {
      const summary = scene.description.slice(0, 60)
      const caption = template
        ? template.caption_pattern
            .replace('{scene_summary}', summary)
            .replace('{day}', String((i + 1) * 7))
            .replace('{week}', String(i + 1))
            .replace('{num}', String(i + 1))
            .replace('{time_of_day}', ['Matin', 'Midi', 'Après-midi', 'Soir', 'Nuit'][i % 5])
            .replace('{action}', scene.description.slice(0, 30).toLowerCase())
            .replace('{format}', format_name)
        : scene.description

      return {
        ...scene,
        description: `[${format_name}] ${scene.description}`,
        emotional_beat: scene.emotional_beat,
        caption,
      }
    })

    const result: FormatAdaptResult = {
      adapted_scenes,
      format_fit_score: 72,
      format_note: `Votre arc se prête bien au format "${format_name}" — structure narrative claire et progression émotionnelle cohérente.`,
    }
    return NextResponse.json(result)
  }

  // ── CLAUDE ADAPTATION ──────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey })

    const scenesText = scenes
      .map(
        (s, i) =>
          `Scene ${i + 1}:\nDescription: ${s.description}\nEmotional beat: ${s.emotional_beat}\nCaption: ${s.caption ?? '(none)'}`
      )
      .join('\n\n')

    const characterContext = `Character: ${story.character_name}, age ${story.character_age}, ${story.character_job}. ${story.character_backstory}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a TikTok content strategist specializing in viral content formats. Rewrite the following story arc to fit the "${format_name}" format.

${characterContext}

Format: "${format_name}"
Format conventions: Each slide's description, emotional_beat, and caption must be rewritten to match the structural conventions and language patterns of this format. Preserve the transformation arc but adapt the narrative voice, framing, and captions to feel native to this format.

Original scenes:
${scenesText}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "adapted_scenes": [
    {
      "id": "scene-id-from-input",
      "story_id": "story-id-from-input",
      "order_index": 0,
      "description": "rewritten description",
      "emotional_beat": "rewritten emotional beat",
      "visual_prompt": "visual prompt unchanged or lightly adapted",
      "image_url": null,
      "caption": "rewritten caption in format style",
      "created_at": "original created_at"
    }
  ],
  "format_fit_score": 85,
  "format_note": "One-sentence explanation of how well the story fits this format and why."
}

Rules:
- Preserve ALL scene ids, story_id, order_index, created_at, and image_url values exactly as given
- Rewrite description, emotional_beat, and caption in the format's voice
- format_fit_score must be 0-100
- format_note must be in French, one sentence
- Captions must be in French`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result: FormatAdaptResult = JSON.parse(cleanedText)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Format adaptation error:', err)
    return NextResponse.json(
      { error: 'Failed to adapt story format', details: String(err) },
      { status: 500 }
    )
  }
}
