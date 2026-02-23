import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { EmotionalTone } from '@/lib/types'

type ToneMix = 'varied' | 'emotional_only' | 'light'

function assignTones(toneMix: ToneMix, count: number): EmotionalTone[] {
  const pools: Record<ToneMix, EmotionalTone[]> = {
    varied: ['comeback', 'revenge', 'quiet_transformation', 'rock_bottom', 'against_all_odds'],
    emotional_only: ['rock_bottom', 'against_all_odds'],
    light: ['comeback', 'quiet_transformation'],
  }
  const pool = pools[toneMix] ?? pools.varied
  return Array.from({ length: count }, (_, i) => pool[i % pool.length])
}

async function generateCharacter(
  client: Anthropic,
  tone: EmotionalTone,
  excludedJobs: string[]
): Promise<{ character: Record<string, unknown>; storyId: string | null }> {
  const exclusionNote =
    excludedJobs.length > 0
      ? `\n- DO NOT use any of these jobs (already used): ${excludedJobs.join(', ')}`
      : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate an atypical, everyday character for a fitness transformation TikTok story. The person should be relatable and ordinary — NOT a fitness model or athlete.

Requirements:
- Age between 30-65
- Blue collar or everyday job (trucker, janitor, lunch lady, postal worker, etc.)${exclusionNote}
- Physical description showing someone overweight and out of shape
- Detailed personality traits that make them sympathetic
- A compelling reason why they've never exercised before
- A backstory with emotional depth

Respond ONLY with a JSON object (no markdown, no code fences):
{
  "name": "Full name",
  "age": number,
  "job": "Their occupation",
  "backstory": "2-3 sentences about their life situation and emotional weight",
  "physical_description": "Detailed physical appearance, body type, typical clothing",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "reason_never_exercised": "1-2 sentences explaining why they never started"
}`,
      },
    ],
  })

  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude for character')
  }

  const character = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim())

  let storyId: string | null = null
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        character_name: character.name,
        character_age: character.age,
        character_job: character.job,
        character_backstory: character.backstory,
        character_physical: character.physical_description,
        emotional_tone: tone,
        status: 'draft',
      })
      .select('id')
      .single()

    if (!error && data) {
      storyId = data.id
    }
  }

  return { character, storyId }
}

async function generateStory(
  client: Anthropic,
  character: Record<string, unknown>,
  emotionalTone: EmotionalTone,
  storyId: string | null
): Promise<{ scenes: Record<string, unknown>[]; sceneIds: string[] }> {
  const toneDescriptions: Record<string, string> = {
    comeback: 'A powerful comeback story — this person was down and out, but they clawed their way back. The tone should feel triumphant and earned.',
    revenge: 'A "revenge body" story — someone wronged them or doubted them, and their transformation is the ultimate response. Satisfying and slightly defiant.',
    quiet_transformation: 'A quiet, internal transformation — no drama, no villain. Just someone who slowly, gently changed their life. Peaceful and reflective.',
    rock_bottom: 'A rock bottom story — they had to hit absolute bottom before they could rise. Raw, emotional, unflinching honesty about their lowest point.',
    against_all_odds: 'An against-all-odds story — everything was stacked against them (health issues, age, circumstances), and they still did it. Inspiring and awe-inducing.',
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Write a 7-10 slide TikTok photo carousel. First person. The narrator IS the character below.

CHARACTER:
${character.name}, ${character.age}, ${character.job}
Backstory: ${character.backstory}
Look: ${character.physical_description}

TONE: ${emotionalTone} — ${toneDescriptions[emotionalTone] || toneDescriptions['comeback']}

VOICE RULES — this is the most important part:
- Write like a REAL person typing on their phone. Not a writer. Not AI.
- Use fragments. Run-ons. Start sentences with "And" or "But". Leave thoughts hanging with "..."
- Include hyper-specific details: brand names of junk food, exact times ("3:47 AM"), body parts that hurt, specific coworker moments, real-sounding places
- BANNED PHRASES: "little did I know", "something shifted", "I found myself", "game-changer", "needless to say", "fast forward", "plot twist", "here's the thing", "journey", "that's when everything changed"
- Keep it messy. Real people contradict themselves. They joke in dark moments. They downplay big things.
- Use casual punctuation: "idk", "lol", "ngl", "tbh" sparingly
- Some slides should be just 1 sentence. Others 2-3. Vary it.

STORY FLOW:
1. My normal life. Make it feel heavy and specific. Not sad-movie sad — just... tired.
2. The moment I actually see myself. A mirror, a photo, someone's comment. Something concrete.
3. Breaking point. ONE specific moment that wrecked me. Not dramatic — quietly devastating.
4. I find something on my phone. DO NOT name any app or brand. Say "this app" or "this thing". One sentence max.
5-6. Early days are brutal. Show specific failures. Specific small wins.
7-8. Things start shifting. Clothes fit different. I sleep better.
9-10. Where I am now. Not a transformation ad. Just... different. Better. Still me.

SLIDE 1 MUST be a scroll-stopping hook. Make it visceral and specific.

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "description": "Slide text — first person, raw, real",
    "emotional_beat": "2-4 word beat label",
    "visual_prompt": "Photography prompt for AI image generation — must include character physical description"
  }
]`,
      },
    ],
  })

  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude for story')
  }

  const scenes = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim())

  let sceneIds: string[] = []

  if (isSupabaseConfigured && supabase && storyId && !storyId.startsWith('new-')) {
    await supabase.from('scenes').delete().eq('story_id', storyId)

    const sceneRows = scenes.map(
      (s: { description: string; emotional_beat: string; visual_prompt: string }, i: number) => ({
        story_id: storyId,
        order_index: i,
        description: s.description,
        emotional_beat: s.emotional_beat,
        visual_prompt: s.visual_prompt,
      })
    )

    const { data: inserted } = await supabase.from('scenes').insert(sceneRows).select('id')
    if (inserted) {
      sceneIds = inserted.map((s: { id: string }) => s.id)
    }

    await supabase
      .from('stories')
      .update({ status: 'scenes_ready', emotional_tone: emotionalTone })
      .eq('id', storyId)
  }

  return { scenes, sceneIds }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { count: number; tone_mix: string; avoid_repeat_jobs: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { count, tone_mix, avoid_repeat_jobs } = body

  if (!count || count < 1 || count > 7) {
    return NextResponse.json({ error: 'count must be between 1 and 7' }, { status: 400 })
  }

  const tones = assignTones((tone_mix as ToneMix) || 'varied', count)

  if (!apiKey) {
    // Return demo data
    const demoStories = tones.map((tone, i) => ({
      story_id: `demo-week-${i}-${Date.now()}`,
      character: {
        name: ['Frank Delgado', 'Diane Huang', 'Gerald Thompson', 'Maria Santos', 'Bob Jenkins'][i % 5],
        age: [54, 47, 61, 38, 52][i % 5],
        job: ['Long-haul trucker', 'School lunch lady', 'Retired postal worker', 'Factory worker', 'Night security guard'][i % 5],
        backstory: 'A relatable everyday person with an emotional transformation story.',
        physical_description: 'Heavyset, middle-aged, worn down by years of inactivity.',
        personality_traits: ['Stubborn but kind', 'Self-deprecating humor', 'Deeply loyal'],
        reason_never_exercised: "Always figured it was too late to start.",
      },
      emotional_tone: tone,
      scenes: [],
      scene_ids: [],
    }))
    return NextResponse.json({ stories: demoStories })
  }

  try {
    const client = new Anthropic({ apiKey })

    const usedJobs: string[] = []

    // Run all character generations — sequentially if avoiding repeat jobs, in parallel otherwise
    let characterResults: Array<{ character: Record<string, unknown>; storyId: string | null }>

    if (avoid_repeat_jobs) {
      characterResults = []
      for (let i = 0; i < count; i++) {
        const result = await generateCharacter(client, tones[i], usedJobs)
        usedJobs.push(String(result.character.job))
        characterResults.push(result)
      }
    } else {
      const settled = await Promise.allSettled(
        tones.map((tone) => generateCharacter(client, tone, []))
      )
      characterResults = settled.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return { character: { name: `Character ${i + 1}`, age: 40, job: 'Worker', backstory: '', physical_description: '' }, storyId: null }
      })
    }

    // Run all story arc generations in parallel
    const storySettled = await Promise.allSettled(
      characterResults.map((cr, i) =>
        generateStory(client, cr.character, tones[i], cr.storyId)
      )
    )

    const stories = characterResults.map((cr, i) => {
      const storyResult = storySettled[i]
      const { scenes, sceneIds } =
        storyResult.status === 'fulfilled' ? storyResult.value : { scenes: [], sceneIds: [] }

      return {
        story_id: cr.storyId || `new-${Date.now()}-${i}`,
        character: cr.character,
        emotional_tone: tones[i],
        scenes,
        scene_ids: sceneIds,
      }
    })

    return NextResponse.json({ stories })
  } catch (err) {
    console.error('Generate week error:', err)
    return NextResponse.json(
      { error: 'Failed to generate week', details: String(err) },
      { status: 500 }
    )
  }
}
