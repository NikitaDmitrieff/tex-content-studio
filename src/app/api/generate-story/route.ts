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
        description: `${character.age} ans. Je pouvais plus lacer mes chaussures.`,
        emotional_beat: 'Hook',
        visual_prompt: `${character.physical_description}, struggling to bend over, living room floor, shot on old phone camera 2015 Android quality, grainy sensor noise, harsh overhead lighting, unflattering angle, compression artifacts`,
      },
      {
        description: `4h30. Monster Energy au petit-dej. Encore.`,
        emotional_beat: 'Mundane routine',
        visual_prompt: `Dimly lit kitchen, energy drink cans and fast food wrappers, ${character.physical_description}, eating alone, early morning, shot on old phone, harsh fluorescent lighting, grainy, slightly blurry, low resolution`,
      },
      {
        description: `Photos de famille a Paques. J'ai demande qu'on me tague pas.`,
        emotional_beat: 'Self-awareness',
        visual_prompt: `${character.physical_description} looking at phone screen alone on couch, shot on 2015 Android phone, grainy sensor noise, slightly out of focus, bad indoor lighting, compression artifacts`,
      },
      {
        description: `Ma fille m'a dit "c'est pas grave papy." Je suis son pere.`,
        emotional_beat: 'Breaking point',
        visual_prompt: `${character.physical_description} sitting alone on park bench head down, child blurred in background, shot on old phone camera, overexposed sky, grainy, motion blur, muted washed out colors`,
      },
      {
        description: `Telecharge un truc a 2h du mat. J'ai pas supprime.`,
        emotional_beat: 'Discovery',
        visual_prompt: `${character.physical_description} in bed at night, phone screen glowing on face, dark room, shot on old phone camera, only phone light, heavy grain, slightly blurry, compression artifacts`,
      },
      {
        description: `Premier entrainement. 4 minutes. J'ai cru mourir.`,
        emotional_beat: 'Early struggle',
        visual_prompt: `${character.physical_description} sitting on kitchen floor sweaty exhausted red-faced, messy apartment, shot on old Android phone, harsh flash, grainy, slightly blurry, bad composition`,
      },
      {
        description: `Semaine 3. Prepare mon dejeuner pour la premiere fois en 10 ans.`,
        emotional_beat: 'Small wins',
        visual_prompt: `${character.physical_description} in kitchen making a sandwich, small smile, shot on old phone, fluorescent lighting, grainy sensor noise, slightly overexposed, candid`,
      },
      {
        description: `2 mois. La balance a pas bouge. Mais je lace mes chaussures.`,
        emotional_beat: 'Quiet progress',
        visual_prompt: `${character.physical_description} slightly healthier posture at work, shot on old phone camera, office fluorescent lighting, compression artifacts, grainy, candid unposed`,
      },
      {
        description: `Premier selfie en 3 ans que j'ai pas supprime direct.`,
        emotional_beat: 'Transformation',
        visual_prompt: `${character.physical_description} but slightly transformed, dirty mirror selfie, finger partially visible, shot on old phone, bathroom lighting, grainy, genuine half-smile, not professional`,
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
9-10. Where I am now. Not a transformation ad. Just... different. Better. Still me.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Write a 7-10 slide TikTok photo carousel. First person. The narrator IS the character below.${sequelContext}${realityContext}${heartbeatConstraint}

CHARACTER:
${character.name}, ${character.age}, ${character.job}
Backstory: ${character.backstory}
Look: ${character.physical_description}

TONE: ${emotional_tone} — ${toneGuide}

VOICE RULES — this is the most important part:
- Write like a REAL person typing on their phone. Not a writer. Not AI.
- Use fragments. Run-ons. Start sentences with "And" or "But". Leave thoughts hanging with "..."
- Include hyper-specific details: brand names of junk food, exact times ("3:47 AM"), body parts that hurt, specific coworker moments, real-sounding places
- BANNED PHRASES (these scream AI): "little did I know", "something shifted", "I found myself", "game-changer", "needless to say", "fast forward", "plot twist", "here's the thing", "journey", "that's when everything changed"
- Keep it messy. Real people contradict themselves. They joke in dark moments. They downplay big things.
- Use casual punctuation: "idk", "lol", "ngl", "tbh" sparingly — like a real person would

TEXT LENGTH — CRITICAL:
- Each slide description MUST be very short. MAX 2 sentences. Most slides should be 1 sentence.
- This text gets overlaid on the image. People swipe fast. They do NOT read paragraphs.
- Think TikTok carousel: punchy, raw, 8-15 words per slide is ideal. Never exceed 25 words.
- Examples of good length: "4:30 AM. Monster Energy for breakfast. Again." or "My daughter said 'it's okay grandpa.' I'm her dad."
- If it feels too long, cut it in half. Then cut it again.

${storyFlowPrompt}

SLIDE 1 MUST be a scroll-stopping hook. Something like "I was 54 and couldn't tie my own shoes" or "Nobody tells you what rock bottom smells like." Make it visceral and specific.

${!isSequel ? 'THE APP MENTION: Maximum ONE slide can reference finding an app. It should feel throwaway — "downloaded this app at like 2am, honestly didn\'t think I\'d open it again." The story is about the PERSON, not the product. The app is just a tool they happened to find.' : ''}

VISUAL PROMPT RULES — CRITICAL FOR REALISM:
- Every visual_prompt MUST enforce: "shot on old phone camera, 2015 Android quality, slightly blurry, bad lighting, grainy sensor noise, compression artifacts, low resolution feel, NOT professional photography, NOT studio lighting, NOT HDR, NOT AI-generated"
- Think: screenshots from a security camera, a drunk selfie, a hastily taken photo in bad lighting
- Include character physical description in every prompt
- NEVER use words like: "cinematic", "dramatic lighting", "golden hour", "bokeh", "professional", "high quality", "detailed", "beautiful", "stunning"
- Add imperfections: "slightly overexposed", "harsh flash", "fluorescent lighting", "motion blur", "finger partially blocking lens", "dirty mirror selfie"

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "description": "Slide text — MAX 2 sentences, 8-15 words ideal, overlay-friendly",
    "emotional_beat": "2-4 word beat label",
    "visual_prompt": "Old phone camera photo — must include character physical description and phone camera imperfections"
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
