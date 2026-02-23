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
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { character, emotional_tone, story_id } = body

  if (!character || !emotional_tone) {
    return NextResponse.json(
      { error: 'Missing character data or emotional_tone' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    const fallbackScenes = [
      {
        description: `I wake up at 4:30 AM like every other day. My body aches before the day's even started. There's a half-eaten bag of chips on the nightstand next to three empty energy drink cans. This is just... life now.`,
        emotional_beat: 'Normal life — mundane routine',
        visual_prompt: `Dimly lit bedroom, messy nightstand with junk food, ${character.physical_description}, waking up exhausted, shot on old phone camera, grainy, realistic, candid moment`,
      },
      {
        description: `I catch my reflection in a window at work and I don't recognize the person staring back. A coworker says something about taking the stairs and it stings more than it should. I pretend I didn't hear it.`,
        emotional_beat: 'Self-awareness — uncomfortable truth',
        visual_prompt: `${character.physical_description} at work, catching reflection in window, looking disappointed, natural lighting, candid phone photo style, slightly out of focus`,
      },
      {
        description: `The breaking point comes out of nowhere. I can't do something simple that I should be able to do. The shame is overwhelming. I sit there alone afterward, staring at my hands, wondering how I let it get this bad.`,
        emotional_beat: 'Breaking point — emotional low',
        visual_prompt: `${character.physical_description} sitting alone, head down, dimly lit, emotional moment, raw phone photo quality, shallow depth of field, muted colors`,
      },
      {
        description: `Late at night, doom-scrolling, I see this thing on my phone. Not the usual influencer garbage. Just... real people. People who look like me. I download it before I can talk myself out of it.`,
        emotional_beat: 'Discovery — spark of hope',
        visual_prompt: `${character.physical_description} in bed at night, phone screen glowing on face, scrolling, interested expression, dark room lit only by phone, phone photo aesthetic`,
      },
      {
        description: `Day one is humiliating. I can barely finish the beginner stuff. I'm breathing hard, sweating through my shirt after just 10 minutes. But I don't quit. I just sit there, hands on my knees, feeling... alive?`,
        emotional_beat: 'Struggle — first attempt',
        visual_prompt: `${character.physical_description} in living room doing basic exercise, red-faced, sweating, determined expression, messy apartment background, raw phone photo, slightly blurry from movement`,
      },
      {
        description: `Weeks pass. Some days are terrible, some are okay. I start packing a lunch. Going to bed earlier. The scale barely moves, but my clothes fit different. I catch myself smiling at nothing.`,
        emotional_beat: 'Progress — gradual change',
        visual_prompt: `${character.physical_description} but looking slightly healthier, meal prepping in kitchen, small smile, natural daylight, phone photo quality, genuine candid moment, subtle difference in appearance`,
      },
      {
        description: `Three months in. I look in the mirror and see someone I'd forgotten existed. I'm not a fitness model. I'm still me. But the light in my eyes is back. I take a selfie and actually like what I see.`,
        emotional_beat: 'Transformation — quiet triumph',
        visual_prompt: `${character.physical_description} but noticeably transformed, standing in front of mirror, proud expression, taking mirror selfie, better posture, slightly better fitting clothes, warm lighting, phone selfie quality`,
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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Create a 6-8 scene TikTok carousel story for a fitness transformation.

The story is written in FIRST PERSON — the character is telling their own story directly to the viewer. Use "I", "me", "my" throughout. It should feel like a real person's confession, raw and honest.

CHARACTER (narrator):
Name: ${character.name}
Age: ${character.age}
Job: ${character.job}
Backstory: ${character.backstory}
Physical: ${character.physical_description}

EMOTIONAL TONE: ${emotional_tone}
${toneGuide}

STORY STRUCTURE:
1. "I" describe my normal, mundane life (the routine, the food, the exhaustion)
2. A moment of uncomfortable self-awareness — seeing myself clearly for the first time
3. The breaking point (something specific and emotional that breaks me)
4. "I" find something on my phone late at night — just a thing that caught my eye. Don't name any app or brand. Just say "this thing" or "this app" or "something on my phone." It should feel like a random discovery, NOT a recommendation.
5. The struggle of starting (it should be hard and humbling)
6. Gradual progress with small wins — new habits, small changes
7. The transformation — I'm not a fitness model, but I've clearly changed, physically and emotionally

CRITICAL RULES:
- Write EVERYTHING in first person ("I woke up...", "I couldn't believe...", "I started...")
- NEVER mention any brand, app name, or product by name. The "discovery" scene should just reference "this thing on my phone" or "this app I found" — keep it completely generic
- Every visual prompt must include the character's physical description for consistency
- Visual prompts should describe "shot on old phone" style photography — grainy, candid, imperfect
- Make it emotionally compelling enough to stop someone mid-scroll
- Each scene description should be 2-3 sentences maximum, conversational tone
- It should read like a real person's TikTok story, not a marketing piece

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "description": "First-person scene narrative text",
    "emotional_beat": "Short label for the emotional beat",
    "visual_prompt": "Detailed photography-style prompt for AI image generation"
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

      await supabase.from('scenes').insert(sceneRows)
      await supabase
        .from('stories')
        .update({ status: 'scenes_ready' })
        .eq('id', story_id)
    }

    return NextResponse.json({ scenes })
  } catch (err) {
    console.error('Story generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate story', details: String(err) },
      { status: 500 }
    )
  }
}
