import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { AudioBrief } from '@/lib/types'

type RequestBody = {
  story_id: string
}

function getDemoAudioBrief(): AudioBrief {
  return {
    bpm_range: '72–88 BPM',
    mood_arc: 'worn → determined → triumphant',
    genre_tags: ['southern soul', 'country gospel', 'roots rock', 'motivational'],
    french_affinity_score: 0.38,
    universal_score: 0.91,
    scene_energies: [0.2, 0.25, 0.35, 0.45, 0.65, 0.8, 0.9, 0.95],
    song_suggestions: [
      {
        artist: 'Survivor',
        track: 'Eye of the Tiger',
        mood_match_score: 0.87,
        why_it_fits:
          'The building drum intro mirrors the slow awakening of a man who refuses to quit. Its anthemic chorus lands perfectly on the turning-point slide.',
        tiktok_search_term: 'Eye of the Tiger Survivor transformation',
      },
      {
        artist: 'Wilson Phillips',
        track: 'Hold On',
        mood_match_score: 0.81,
        why_it_fits:
          'Country-pop warmth matches the quiet stubborn hope of a trucker grinding through the early weeks — familiar, earned, never preachy.',
        tiktok_search_term: 'Hold On Wilson Phillips motivational',
      },
      {
        artist: 'Bill Withers',
        track: 'Lean on Me',
        mood_match_score: 0.78,
        why_it_fits:
          'Soulful gospel undertones and the unhurried groove suit the blue-collar dignity of the story. Feels like community, not hype.',
        tiktok_search_term: 'Lean on Me Bill Withers soul',
      },
      {
        artist: 'Tom Petty',
        track: "I Won't Back Down",
        mood_match_score: 0.75,
        why_it_fits:
          "Gritty Americana defiance — exactly the energy of a man who's been told no his whole life and keeps showing up anyway.",
        tiktok_search_term: "I Won't Back Down Tom Petty country rock",
      },
      {
        artist: 'Johnny Cash',
        track: 'Hurt (American Recording)',
        mood_match_score: 0.69,
        why_it_fits:
          'Raw confessional vulnerability for the rock-bottom slides. Cash\'s weathered voice makes the "before" feel genuinely painful, amplifying the "after".',
        tiktok_search_term: 'Hurt Johnny Cash emotional transformation',
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { story_id } = body

  if (!story_id) {
    return NextResponse.json({ error: 'Missing story_id' }, { status: 400 })
  }

  // If Supabase not configured, return demo data
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ audio_brief: getDemoAudioBrief() })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'tex_content' },
  })

  // Fetch story
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', story_id)
    .single()

  if (storyError || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  // Return cached audio_brief if present
  if (story.audio_brief) {
    return NextResponse.json({ audio_brief: story.audio_brief })
  }

  // Fetch scenes
  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*')
    .eq('story_id', story_id)
    .order('order_index', { ascending: true })

  if (scenesError || !scenes?.length) {
    return NextResponse.json({ error: 'No scenes found' }, { status: 404 })
  }

  if (!apiKey) {
    return NextResponse.json({ audio_brief: getDemoAudioBrief() })
  }

  const sceneList = scenes
    .map(
      (s, i) =>
        `Scene ${i + 1} (beat: ${s.emotional_beat}): ${s.description}`
    )
    .join('\n')

  const prompt = `You are a music supervisor who specialises in matching songs to TikTok transformation carousels.

CHARACTER: ${story.character_name}, age ${story.character_age}, ${story.character_job}
EMOTIONAL TONE: ${story.emotional_tone?.replace(/_/g, ' ')}
BACKSTORY: ${story.character_backstory || 'Not provided'}

SCENES (${scenes.length} total):
${sceneList}

TASK:
1. Map the emotional energy of each scene on a 0–1 scale (0 = lowest energy/most vulnerable, 1 = peak triumph/resolution). Return one float per scene in scene_energies array.
2. Identify the dominant emotional arc and suggest a BPM range that serves the story's rhythm.
3. Select 3–5 genre tags that describe the ideal sonic palette.
4. Score french_affinity_score (0–1): how well this story's vibe translates to French/European TikTok taste (higher = more universal/accessible to French audiences).
5. Score universal_score (0–1): broad cross-cultural appeal.
6. Suggest exactly 5 real songs that would work as carousel background music. Use real, well-known artists and tracks. Prefer songs that are well-known enough to appear on TikTok but not so overused they feel generic.

Return ONLY this JSON (no markdown, no code fences):
{
  "bpm_range": "<e.g. 70–90 BPM>",
  "mood_arc": "<short arc description, e.g. melancholic → hopeful → triumphant>",
  "genre_tags": ["<tag1>", "<tag2>", "<tag3>"],
  "french_affinity_score": <0.0–1.0>,
  "universal_score": <0.0–1.0>,
  "scene_energies": [<one float per scene, e.g. 0.2, 0.35, 0.6, 0.8, 0.9>],
  "song_suggestions": [
    {
      "artist": "<real artist name>",
      "track": "<real track name>",
      "mood_match_score": <0.0–1.0>,
      "why_it_fits": "<2–3 specific sentences explaining why this song works for this story>",
      "tiktok_search_term": "<search query to find this song on TikTok>"
    }
  ]
}`

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const audioBrief: AudioBrief = JSON.parse(cleanedText)

    // Cache in Supabase (best-effort — column may not exist yet)
    try {
      await supabase
        .from('stories')
        .update({ audio_brief: audioBrief })
        .eq('id', story_id)
    } catch {
      // Silently ignore if column doesn't exist
    }

    return NextResponse.json({ audio_brief: audioBrief })
  } catch (err) {
    console.error('Audio brief generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate audio brief', details: String(err) },
      { status: 500 }
    )
  }
}
