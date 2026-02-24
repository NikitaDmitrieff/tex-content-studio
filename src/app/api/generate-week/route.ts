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
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate an atypical, everyday FRENCH character for a fitness transformation TikTok story targeting a FRENCH audience. The person should be relatable and ordinary — NOT a fitness model or athlete. They must feel authentically French.

Requirements:
- This is a FRENCH person living in FRANCE
- Give them a French name (or a name common in France — including North African, West African, Portuguese, or mixed heritage names)
- Age between 20-55 (mix it up — include younger people in their 20s, not just older)
- French everyday job: chauffeur VTC, caissier/ère, aide-soignant(e), préparateur de commandes, intérimaire, livreur, agent d'entretien, ouvrier BTP, agent de sécurité, employé(e) de restauration, etc.${exclusionNote}
- Use French cultural references in the backstory: Carrefour, Auchan, Deliveroo, McDo, kebab, PMU, RER, HLM, cantine, Picard, BN, Kinder
- Physical description showing someone overweight and out of shape
- Include both men AND women — don't default to men
- Diverse backgrounds reflecting France's diversity
- Write backstory, personality_traits, reason_never_exercised in FRENCH (informal spoken French)
- The job field should be in French
- A visual_dna in ENGLISH: short image-locking prompt (15-25 words). Format: "same [gender], [age range], [hair], [skin tone], [signature clothing], [key feature], harsh indoor lighting, low quality phone camera, grainy"
  IMPORTANT: visual_dna must NOT contain professional photography terms. NO "warm natural light", NO "soft lighting", NO "beautiful", NO "professional"

Respond ONLY with a JSON object (no markdown, no code fences):
{
  "name": "French full name",
  "age": number,
  "job": "Their occupation IN FRENCH",
  "backstory": "2-3 sentences IN FRENCH about their life situation and emotional weight",
  "physical_description": "Detailed physical appearance IN FRENCH, body type, typical clothing",
  "personality_traits": ["trait1 in French", "trait2 in French", "trait3 in French"],
  "reason_never_exercised": "1-2 sentences IN FRENCH explaining why they never started",
  "visual_dna": "Short locking prompt IN ENGLISH — MUST end with: harsh indoor lighting, low quality phone camera, grainy"
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
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Write a 7-10 slide TikTok photo carousel. First person. The narrator IS the character below.

LANGUAGE — CRITICAL:
- ALL slide descriptions MUST be written in FRENCH. Informal spoken French, not literary French.
- Write like a real French person texting — use spoken French, not textbook French.
- Use natural French abbreviations and slang: "j'suis", "j'ai", "c'était", "mdr", "trkl", "sah", "wsh", "jsp"
- Use French brand references: Deliveroo, UberEats, McDo, Picard, Carrefour, Auchan, kebab, PMU
- Use French cultural references: la salle (gym), le RER, la cantine, les courses, la CAF, Pôle Emploi
- The visual_prompt stays in ENGLISH (for the image generation AI)
- BANNED AI-sounding French phrases: "ce jour-là tout a changé", "j'ai compris que", "le déclic", "une prise de conscience", "mon corps me parlait", "j'ai décidé de reprendre ma vie en main"

CHARACTER:
${character.name}, ${character.age}, ${character.job}
Backstory: ${character.backstory}
Look: ${character.physical_description}

TONE: ${emotionalTone} — ${toneDescriptions[emotionalTone] || toneDescriptions['comeback']}

VOICE RULES — this is the most important part:
- Write like a REAL French person typing on their phone. Not a writer. Not AI.
- Use fragments. Run-ons. Start sentences with "Et" or "Mais". Leave thoughts hanging with "..."
- Include hyper-specific French details: brand names of junk food (BN, Kinder, Prince), exact times ("3h47 du mat"), body parts that hurt, specific coworker moments, real-sounding French places
- Keep it messy. Real people contradict themselves. They joke in dark moments. They downplay big things.
- Some slides should be just 1 sentence. Others 2-3. Vary it.

STORY FLOW:
1. My normal life. Make it feel heavy and specific. Not sad-movie sad — just... tired.
2. The moment I actually see myself. A mirror, a photo, someone's comment. Something concrete.
3. Breaking point. ONE specific moment that wrecked me. Not dramatic — quietly devastating.
4. I find something on my phone. DO NOT name any app or brand. Say "cette appli" or "ce truc". One sentence max.
5-6. Early days are brutal. Show specific failures. Specific small wins.
7-8. Things start shifting. Clothes fit different. I sleep better.
9-10. Where I am now. Not a transformation ad. Just... different. Better. Still me.

SLIDE 1 MUST be a scroll-stopping hook IN FRENCH. Make it visceral and specific.

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "description": "Slide text IN FRENCH — first person, raw, real, spoken French",
    "emotional_beat": "2-4 word beat label",
    "visual_prompt": "Photography prompt IN ENGLISH for AI image generation — must include character physical description"
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
        name: ['Gérard Blanchard', 'Nadia Benmoussa', 'Patrick Morel', 'Samira Belkacem', 'Thierry Duval'][i % 5],
        age: [52, 45, 56, 42, 48][i % 5],
        job: ['Routier longue distance', 'Employée de cantine scolaire', "Chef d'équipe en usine", 'Secrétaire médicale', 'Agent de sécurité de nuit'][i % 5],
        backstory: "Un quotidien bien ancré, des années sans bouger, et un déclic qui change tout.",
        physical_description: 'En surpoids, usé par des années de sédentarité.',
        personality_traits: ['Têtu mais attachant', 'Humour pince-sans-rire', 'Fidèle en amitié'],
        reason_never_exercised: "S'est toujours dit que c'était trop tard pour commencer.",
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
