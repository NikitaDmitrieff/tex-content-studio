import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: {
    character: {
      name: string
      age: number
      job: string
      backstory: string
      physical_description: string
    }
    emotional_tone: string
    story_id: string
    character_id?: string
    previous_episodes_summary?: string
    reality_anchors?: {
      anchors: { fact: string; type: string; scene_index: number | null }[]
      turning_point_scene_index?: number | null
      proof_scene_index?: number | null
    }
    heartbeat_arc?: {
      scenes: { position: number; intensity: number; label?: string }[]
    }
    arc_template_used?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character, emotional_tone, story_id, character_id, previous_episodes_summary, reality_anchors, heartbeat_arc, arc_template_used } = body

  if (!character || !emotional_tone) {
    return NextResponse.json(
      { error: 'Missing character data or emotional_tone' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    const fallbackScenes = [
      {
        description: `${character.age} ans et je monte plus les escaliers`,
        emotional_beat: 'Hook',
        visual_prompt: `${character.physical_description}, sitting on couch in messy living room`,
      },
      {
        description: `monster energy au petit-dej tous les jours`,
        emotional_beat: 'Mundane routine',
        visual_prompt: `${character.physical_description} eating alone in dimly lit kitchen, energy drink on table`,
      },
      {
        description: `jai demande quon me tague pas sur les photos`,
        emotional_beat: 'Self-awareness',
        visual_prompt: `${character.physical_description} looking at phone alone on couch, messy apartment`,
      },
      {
        description: `ma fille ma dit "cest pas grave papa"`,
        emotional_beat: 'Breaking point',
        visual_prompt: `${character.physical_description} sitting alone on park bench, overcast day`,
      },
      {
        description: `telecharge un truc a 2h du mat`,
        emotional_beat: 'Discovery',
        visual_prompt: `${character.physical_description} in bed at night, phone screen glowing on face, dark room`,
      },
      {
        description: `premier entrainement 4 minutes`,
        emotional_beat: 'Early struggle',
        visual_prompt: `${character.physical_description} sitting on kitchen floor sweaty and exhausted`,
      },
      {
        description: `je prepare mon dej pour la premiere fois`,
        emotional_beat: 'Small wins',
        visual_prompt: `${character.physical_description} slightly better posture, in kitchen making food, small smile`,
      },
      {
        description: `la balance a pas bouge mais je lace mes chaussures`,
        emotional_beat: 'Quiet progress',
        visual_prompt: `${character.physical_description} slightly more toned arms, leaner face, tying shoes in hallway`,
      },
      {
        description: `premier selfie en 3 ans`,
        emotional_beat: 'Transformation',
        visual_prompt: `${character.physical_description} noticeably fitter build, slightly more muscular arms, better posture, dirty bathroom mirror selfie, genuine half-smile`,
      },
    ]

    return NextResponse.json({ scenes: fallbackScenes })
  }

  try {
    const client = new Anthropic({ apiKey })

    const toneDescriptions: Record<string, string> = {
      comeback: 'A powerful comeback story — this person was down and out, but they clawed their way back. The tone should feel triumphant and earned.',
      revenge: 'A "revenge body" story — someone wronged them or doubted them, and their transformation is the ultimate response. Satisfying and slightly defiant.',
      quiet_transformation: 'A quiet, internal transformation — no drama, no villain. Just someone who slowly, gently changed their life. Peaceful and reflective.',
      rock_bottom: 'A rock bottom story — they had to hit absolute bottom before they could rise. Raw, emotional, unflinching honesty about their lowest point.',
      against_all_odds: 'An against-all-odds story — everything was stacked against them (health issues, age, circumstances), and they still did it. Inspiring and awe-inducing.',
    }

    const toneGuide = toneDescriptions[emotional_tone] || toneDescriptions['comeback']

    const realFacts = reality_anchors?.anchors.filter((a) => a.type === 'real').map((a) => a.fact) ?? []
    const realityContext =
      realFacts.length > 0
        ? `\n\nREALITY ANCHORS — These are REAL facts from the creator's actual journey. They MUST be woven into specific scenes:\n${realFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nREQUIRED SCENE CONSTRAINTS:\n- One scene MUST use the turning point moment exactly as described above — use the exact words and specific details\n- One scene MUST reference the specific struggles listed — make them visceral and concrete\n- One scene (toward the end) MUST include the specific wins and proof — use the exact numbers and achievements\n`
        : ''

    const HEARTBEAT_SCENE_LABELS = [
      'Opening', 'Setup', 'First Crack', 'Collapse',
      'Turning Point', 'Rising', 'Climax', 'Resolution',
    ]

    const heartbeatConstraint = heartbeat_arc && heartbeat_arc.scenes.length > 0
      ? `\n\nHEARTBEAT ARC — MANDATORY EMOTIONAL INTENSITY MAP:
You MUST follow this exact emotional intensity curve. Each scene maps to a specific intensity (1=absolute despair, 10=pure triumph). DO NOT deviate from this arc.
${heartbeat_arc.scenes.map((s) => {
  const labelNote = s.label ? ` — "${s.label}"` : ''
  const sceneLabel = HEARTBEAT_SCENE_LABELS[s.position - 1] ?? `Scene ${s.position}`
  return `Scene ${s.position} (${sceneLabel}): intensity ${s.intensity}/10${labelNote}`
}).join('\n')}

ENFORCEMENT RULES:
${heartbeat_arc.scenes.filter(s => s.intensity <= 2).map(s => `- Scene ${s.position} MUST be absolute rock bottom (${s.intensity}/10). The character is at their lowest point.`).join('\n')}
${heartbeat_arc.scenes.filter(s => s.intensity >= 9).map(s => `- Scene ${s.position} MUST feel triumphant and victorious (${s.intensity}/10). The character has broken through.`).join('\n')}
${arc_template_used ? `Arc template: "${arc_template_used}" — honor the shape of this arc precisely.` : ''}
`
      : ''

    const isSequel = Boolean(previous_episodes_summary)
    const sequelContext = isSequel
      ? `\n\nPREVIOUS EPISODES CONTEXT (this is a sequel — reference past events naturally):\n${previous_episodes_summary}\n\nSEQUEL RULES:\n- This is a CONTINUATION, not a reset. Don't start from scratch.\n- Reference specific things from the past episodes naturally in the narration (e.g. "since her breakthrough three months ago", "that day at the park still gets me")\n- The character has already started changing. Show where they are NOW and what new challenge or milestone this chapter is about.\n- Don't repeat the "I found an app" moment — that already happened.\n`
      : ''

    const storyFlowPrompt = isSequel
      ? `STORY FLOW (sequel episode):
1. Where I am now — pick up from where we left off. Reference something specific from before.
2. A new challenge or plateau that's emerged. Not the same as the first episode's breaking point.
3-4. This chapter's specific struggle or goal. What's the next mountain?
5-6. The grind of this chapter. New small wins, new failures, new realizations.
7-8. Something shifts specifically in THIS chapter. A milestone, a moment, a person.
9-10. Where I land at the end of this chapter. Still going. Still me. But different again.`
      : `STORY FLOW:
1. My normal life. Make it feel heavy and specific. Not sad-movie sad — just... tired.
2. The moment I actually see myself. A mirror, a photo, someone's comment. Something concrete.
3. Breaking point. ONE specific moment that wrecked me. Not dramatic — quietly devastating.
4. I find something on my phone. DO NOT name any app or brand. Say "this app" or "this thing" — like someone casually mentioning it. It's not the hero of the story, I am. One sentence max on this.
5-6. Early days are brutal. Show specific failures. Specific small wins. The boring middle that nobody talks about.
7-8. Things start shifting. Not overnight. Slowly. Clothes fit different. I sleep better. People notice but I pretend I don't notice them noticing.
9-10. Where I am now. Visibly changed — not bodybuilder, but clearly fitter. Arms a bit bigger, posture better, face leaner. The kind of change people comment on. Still me, just a better version.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Write a 7-10 slide TikTok photo carousel. First person. The narrator IS the character below.${sequelContext}${realityContext}${heartbeatConstraint}

LANGUAGE — CRITICAL:
- ALL slide descriptions MUST be written in FRENCH. Natural, casual spoken French. The kind of French a normal 19-year-old actually speaks — not literary, but not forced slang either.
- all lowercase. No capital letters except proper nouns (McDo, PSG, Netflix).
- NO PERIODS at the end of sentences. Sentences just end without punctuation.
- Write CORRECT French with casual shortcuts. "je suis" can become "jsuis", "je peux" can become "jpeux" — but ONLY if it sounds natural. Don't contract every single word.
- ALMOST NO SLANG. Real young French people in normal conversation don't spam slang. One "genre" or "trop" per carousel is enough. ZERO "frr", "sah", "wsh", "ptdr", "en mode".
- Use "..." sparingly for trailing thoughts.
- French brand references are good: McDo, Picard, Carrefour, kebab, BN, Kinder
- French cultural references: la salle, le RER, la cantine, les courses
- The visual_prompt stays in ENGLISH (for the image generation AI)

CHARACTER:
${character.name}, ${character.age}, ${character.job}
Backstory: ${character.backstory}
Look: ${character.physical_description}

TONE: ${emotional_tone} — ${toneGuide}

VOICE RULES — this is the most important part:
- Write like a real person talking to a friend. Simple words. Short thoughts.
- Include specific details: exact times ("4h30"), real brands (Monster, McDo), body parts, places
- BANNED PHRASES (these scream AI): "ce jour-là tout a changé", "j'ai compris que", "le déclic", "un tournant", "sans le savoir", "mon parcours", "une prise de conscience", "j'ai réalisé que", "ça m'a ouvert les yeux"
- BANNED STYLE: proper capitalization, literary tone, overly slangy tone
- Keep it simple and honest. Not dramatic. Not poetic. Just someone saying what happened.

COHERENCE — CRITICAL:
- Every caption MUST be a sentence that a real French person would understand immediately. No ambiguity.
- If you read it and it sounds weird or unclear, rewrite it. Simple French > clever French.
- BAD: "jpense plus au canape", "sans viser les arbres ca devient normal" — nobody talks like this
- GOOD: "je mange seul tous les soirs depuis 6 mois", "ma mere ma appele et jai pas decroche", "je fais 10 pompes et je tremble"
- Test: could you say this sentence out loud to a French friend and they'd understand instantly? If not, simplify it.

TEXT LENGTH — THE MOST IMPORTANT RULE:
- MAXIMUM 10 words per slide. Aim for 5-8 words. This is non-negotiable.
- ONE sentence only. Never two. If you wrote two sentences, delete one.
- People swipe in 1 second. They read 5 words. Write for that.
- GOOD lengths: "je mange seul depuis 6 mois" (6 words), "premier entrainement 4 minutes" (4 words), "ma mere ma reconnu" (4 words)
- BAD: anything over 10 words. If it's too long, cut words until it fits.
- all lowercase. no periods at the end.

${storyFlowPrompt}

SLIDE 1 MUST be a scroll-stopping hook IN FRENCH, all lowercase, no period. Short and specific. Examples: "22 ans et je monte plus les escaliers" or "je mange seul depuis 6 mois" — one clear image, max 8 words.

${!isSequel ? 'THE APP MENTION: Maximum ONE slide can reference finding an app. Keep it casual and short — "telecharge un truc a 2h du mat" — the story is about the person, not the product.' : ''}

VISUAL PROMPT RULES — CRITICAL FOR REALISM (keep visual prompts in ENGLISH):
- Every visual_prompt describes what a friend would see if they quickly snapped a photo of this person in that moment.
- Include character physical description in every prompt.
- PHYSICAL PROGRESSION IS IMPORTANT: The character's body should visibly change across the carousel.
  - Slides 1-4: Use the original physical description as-is (soft, out of shape, tired-looking).
  - Slides 5-6: Subtle change — slightly better posture, a bit less puffy in the face.
  - Slides 7-10: Noticeable improvement — arms slightly more toned, shoulders a bit wider, face leaner, overall fitter build. NOT a bodybuilder — just someone who clearly works out now. Think "3-4 months of consistent gym" difference.
  - Add these physical changes directly in the visual_prompt text (e.g. "slightly more muscular arms", "leaner face", "better posture, fitter build").
- Describe the SCENE and LOCATION only. Do NOT describe camera style or quality — the image model handles that.
- VARIETY IS KEY: The character has a life outside their job. Most scenes should NOT show them at work or with work props.
  - If someone is an Uber Eats driver, maybe 1 out of 10 scenes shows that. The rest show them at home, with friends, at the store, on the bus, in their room, eating, scrolling phone, etc.
  - DO NOT put the same prop (delivery bag, uniform, work tool) in multiple scenes. Real people's camera rolls are diverse.
- NORMAL MUNDANE SETTINGS ONLY. The #1 priority is that the location looks like a real place where a normal person lives.
  - GOOD: "sitting on his bed in a small messy bedroom", "in the kitchen eating alone", "on the bus looking at his phone", "bathroom mirror selfie", "sitting on stairs outside his building", "on the couch watching TV", "walking down a boring suburban street"
  - BAD: "standing in the middle of a street at golden hour", "walking dramatically with delivery bag", "centered in frame looking into distance" — this is movie shit, not real life
- Keep visual prompts SHORT. Just: where they are + what they're doing. Nothing about camera, lighting, or quality.
- NEVER mention the character's job props unless it's the ONE scene about work. No delivery bags, no uniforms, no work tools in random scenes.
- NEVER use: "cinematic", "dramatic", "golden hour", "bokeh", "professional", "beautiful", "stunning", "portrait", "shallow depth of field", "cracked screen", "compression artifacts"

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "description": "Slide text IN FRENCH — MAX 10 words, one sentence, all lowercase, no period",
    "emotional_beat": "2-4 word beat label (in English for internal use)",
    "visual_prompt": "Scene description IN ENGLISH — include character physical description, describe location and action only"
  }
]`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const scenes = JSON.parse(cleanedText)

    let sceneIds: string[] = []

    if (isSupabaseConfigured && supabase && story_id && !story_id.startsWith('new-') && !story_id.startsWith('demo-')) {
      await supabase.from('scenes').delete().eq('story_id', story_id)

      const sceneRows = scenes.map(
        (s: { description: string; emotional_beat: string; visual_prompt: string }, i: number) => ({
          story_id,
          order_index: i,
          description: s.description,
          emotional_beat: s.emotional_beat,
          visual_prompt: s.visual_prompt,
        })
      )

      const { data: insertedScenes } = await supabase.from('scenes').insert(sceneRows).select('id')
      if (insertedScenes) {
        sceneIds = insertedScenes.map((s: { id: string }) => s.id)
      }

      const updatePayload: Record<string, unknown> = {
        status: 'scenes_ready',
        emotional_tone: emotional_tone,
      }
      if (character_id) {
        updatePayload.character_id = character_id
      }
      if (reality_anchors) {
        updatePayload.reality_anchors = reality_anchors
        updatePayload.is_reality_grounded = true
      }
      if (heartbeat_arc) {
        updatePayload.heartbeat_arc = heartbeat_arc
      }
      if (arc_template_used) {
        updatePayload.arc_template_used = arc_template_used
      }

      await supabase
        .from('stories')
        .update(updatePayload)
        .eq('id', story_id)
    }

    return NextResponse.json({ scenes, scene_ids: sceneIds })
  } catch (err) {
    console.error('Story generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate story', details: String(err) },
      { status: 500 }
    )
  }
}
