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
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character, emotional_tone, story_id, character_id, previous_episodes_summary, reality_anchors } = body

  if (!character || !emotional_tone) {
    return NextResponse.json(
      { error: 'Missing character data or emotional_tone' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    const fallbackScenes = [
      {
        description: `I was ${character.age} and couldn't tie my own shoes without holding my breath.`,
        emotional_beat: 'Hook',
        visual_prompt: `${character.physical_description}, struggling to bend over to tie shoes, living room floor, shot on old phone camera, grainy, realistic, unflattering angle, candid`,
      },
      {
        description: `4:30 AM. Monster Energy and a gas station burrito for breakfast. Been doing this for years. My back hurts before my shift even starts. This is just... whatever. It's fine.`,
        emotional_beat: 'Mundane routine',
        visual_prompt: `Dimly lit kitchen, energy drink cans and fast food wrappers, ${character.physical_description}, eating alone, early morning, shot on phone, harsh fluorescent lighting`,
      },
      {
        description: `My daughter posted family photos from Easter. I wasn't in any of them. Not because I wasn't there. Because I asked her not to tag me.`,
        emotional_beat: 'Self-awareness',
        visual_prompt: `${character.physical_description} looking at phone screen, sad expression, sitting on couch alone, natural lighting, candid phone photo, slightly out of focus`,
      },
      {
        description: `Couldn't keep up with my 6 year old at the park. Had to sit down on a bench and pretend I was "just resting." She looked back at me and said "it's okay grandpa." I'm her dad.`,
        emotional_beat: 'Breaking point',
        visual_prompt: `${character.physical_description} sitting alone on park bench, head down, child playing in background out of focus, golden hour, raw phone photo quality, muted colors`,
      },
      {
        description: `Downloaded this app at like 2am. Couldn't sleep. Figured I'd delete it in the morning. I didn't.`,
        emotional_beat: 'Discovery',
        visual_prompt: `${character.physical_description} in bed at night, phone screen glowing on face, dark room, only light from phone, shot on phone camera, realistic`,
      },
      {
        description: `First workout I did 4 minutes and thought I was gonna die. Four. Minutes. My shirt was soaked. I sat on the kitchen floor for 20 minutes after. But I opened it again the next day. Idk why.`,
        emotional_beat: 'Early struggle',
        visual_prompt: `${character.physical_description} sitting on kitchen floor, sweaty, exhausted, red-faced, water bottle nearby, messy apartment, raw phone photo, slightly blurry`,
      },
      {
        description: `Week 3. Everything hurts but different. Like a good hurt? Packed my own lunch today for the first time in maybe 10 years. Turkey sandwich. Nothing crazy. Felt like something though.`,
        emotional_beat: 'Small wins',
        visual_prompt: `${character.physical_description} in kitchen making a simple lunch, small smile, natural daylight through window, phone photo quality, genuine candid moment`,
      },
      {
        description: `Two months in. Scale barely moved tbh. But I can tie my shoes now. And I sleep through the night. My coworker said I "look different" and I pretended I didn't know what she meant.`,
        emotional_beat: 'Quiet progress',
        visual_prompt: `${character.physical_description} but slightly healthier posture, at work, subtle confidence, natural lighting, candid phone photo style`,
      },
      {
        description: `Took a selfie yesterday. First one in years where I didn't delete it immediately. I'm not a fitness model. I'm still me. But I'm me again, if that makes sense.`,
        emotional_beat: 'Transformation',
        visual_prompt: `${character.physical_description} but noticeably transformed, taking mirror selfie, slight smile, better posture, warm lighting, phone selfie quality, genuine expression`,
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Write a 7-10 slide TikTok photo carousel. First person. The narrator IS the character below.${sequelContext}${realityContext}

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
- Some slides should be just 1 sentence. Others 2-3. Vary it.

${storyFlowPrompt}

SLIDE 1 MUST be a scroll-stopping hook. Something like "I was 54 and couldn't tie my own shoes" or "Nobody tells you what rock bottom smells like." Make it visceral and specific.

${!isSequel ? 'THE APP MENTION: Maximum ONE slide can reference finding an app. It should feel throwaway — "downloaded this app at like 2am, honestly didn\'t think I\'d open it again." The story is about the PERSON, not the product. The app is just a tool they happened to find.' : ''}

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
