import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { VoiceoverScript } from '@/lib/types'

type RequestBody = {
  story_id: string
  language?: 'en' | 'fr'
}

function getDemoScript(language: 'en' | 'fr'): VoiceoverScript {
  if (language === 'fr') {
    return {
      intro_hook: "Je me souviens du jour où j'ai regardé mes pieds et je pouvais plus les voir.",
      slides: [
        { slide_number: 1, timing_seconds: 4, narration: "Trente ans à livrer le courrier. Mes genoux me criaient dessus tous les matins." },
        { slide_number: 2, timing_seconds: 3, narration: "Mon médecin m'a dit six mois avant l'opération. J'avais même pas cinquante ans." },
        { slide_number: 3, timing_seconds: 4, narration: "J'ai commencé par juste marcher. Dix minutes. C'est tout ce que j'avais." },
        { slide_number: 4, timing_seconds: 3, narration: "Première semaine, j'ai failli arrêter quatre fois." },
        { slide_number: 5, timing_seconds: 4, narration: "Troisième mois, j'ai couru pour attraper un bus. Et je l'ai eu." },
        { slide_number: 6, timing_seconds: 3, narration: "Mon toubib m'a regardé et il a dit — on va annuler cette chirurgie." },
      ],
      outro_cta: "J'ai trouvé Tex. Un jour à la fois. Toi aussi tu peux.",
      total_duration_seconds: 34,
      music_mood: 'emotional/piano',
    }
  }

  return {
    intro_hook: "I remember the day I looked down at my feet and couldn't see them anymore.",
    slides: [
      { slide_number: 1, timing_seconds: 4, narration: "Thirty-one years carrying mail. My knees were yelling at me every single morning." },
      { slide_number: 2, timing_seconds: 3, narration: "My doctor said six months before I'd need surgery. I wasn't even fifty yet." },
      { slide_number: 3, timing_seconds: 4, narration: "I started by just walking. Ten minutes. That's all I had in me." },
      { slide_number: 4, timing_seconds: 3, narration: "First week, I almost quit four times." },
      { slide_number: 5, timing_seconds: 4, narration: "Third month, I ran to catch a bus. And I caught it." },
      { slide_number: 6, timing_seconds: 3, narration: "My doctor looked at me and said — we're canceling that surgery." },
    ],
    outro_cta: "I found Tex. Took it one day at a time. You can too.",
    total_duration_seconds: 34,
    music_mood: 'emotional/piano',
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

  const { story_id, language = 'en' } = body

  if (!story_id) {
    return NextResponse.json({ error: 'Missing story_id' }, { status: 400 })
  }

  // If Supabase not configured, return demo data
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ script: getDemoScript(language) })
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

  // Check cache
  const cacheColumn = language === 'fr' ? 'voiceover_script_fr' : 'voiceover_script_en'
  if (story[cacheColumn]) {
    return NextResponse.json({ script: story[cacheColumn] })
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
    return NextResponse.json({ script: getDemoScript(language) })
  }

  const langInstruction =
    language === 'fr'
      ? 'Write ALL narration text in French. Use tutoiement, informal register, authentic French TikTok language.'
      : 'Write ALL narration text in English. Use casual, informal American English.'

  const dialectGuide =
    story.character_job?.toLowerCase().includes('truck')
      ? 'Trucker dialect: clipped sentences, no fancy words, direct and plain-spoken.'
      : story.character_job?.toLowerCase().includes('nurs') || story.character_job?.toLowerCase().includes('nurse')
      ? 'Nurse dialect: warm but direct, clinical precision mixed with genuine empathy.'
      : story.character_age >= 65
      ? 'Retiree voice: deliberate, reflective, unhurried. Wisdom earned the hard way.'
      : 'Speak plainly and authentically, matching the character\'s background.'

  const sceneList = scenes
    .map(
      (s, i) =>
        `Scene ${i + 1} (${s.emotional_beat}): ${s.description}`
    )
    .join('\n')

  const prompt = `You are writing a TikTok voiceover script for a real fitness transformation story. The script will be spoken by the character in first person.

CHARACTER: ${story.character_name}, ${story.character_age}, ${story.character_job}
BACKSTORY: ${story.character_backstory || 'Not provided'}
EMOTIONAL TONE: ${story.emotional_tone}

DIALECT GUIDE: ${dialectGuide}

THE SCENES:
${sceneList}

LANGUAGE: ${langInstruction}

RULES:
- Avoid AI clichés: no "little did I know", "something shifted", "on this journey", "transformation journey", "I realized"
- Speak in first person throughout
- Keep total under 45 seconds
- Intro hook: first-person opening line, stops the scroll (0-3 sec)
- Per slide: 1-2 sentences of spoken narration. Tension slides (rock bottom, obstacle): 3-5 sec. Transition slides: 2-3 sec.
- Outro: character voice sign-off with natural Tex Fitness mention, not a hard sell
- Music mood: one of "raw/lo-fi", "emotional/piano", "triumphant/upbeat", "quiet/ambient"

Return ONLY this JSON (no markdown, no code fences):
{
  "intro_hook": "<first-person opening line>",
  "slides": [
    { "slide_number": 1, "timing_seconds": 3, "narration": "<1-2 sentences>" },
    ...one entry per scene...
  ],
  "outro_cta": "<character voice sign-off with natural Tex mention>",
  "total_duration_seconds": <number>,
  "music_mood": "<one of the four options>"
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
    const script: VoiceoverScript = JSON.parse(cleanedText)

    // Cache in Supabase
    await supabase
      .from('stories')
      .update({ [cacheColumn]: script })
      .eq('id', story_id)

    return NextResponse.json({ script })
  } catch (err) {
    console.error('Voiceover script generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate voiceover script', details: String(err) },
      { status: 500 }
    )
  }
}
