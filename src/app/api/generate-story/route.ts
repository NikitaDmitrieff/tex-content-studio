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
        description: `${character.name} wakes up at 4:30 AM like every other day. The alarm screams, and they roll over with a groan, their body aching before the day has even started. A half-eaten bag of chips sits on the nightstand next to three empty energy drink cans.`,
        emotional_beat: 'Normal life — mundane routine',
        visual_prompt: `Dimly lit bedroom, messy nightstand with junk food, ${character.physical_description}, waking up exhausted, shot on old phone camera, grainy, realistic, candid moment`,
      },
      {
        description: `At work, ${character.name} catches their reflection in a window and doesn't recognize the person staring back. A coworker makes an offhand comment about taking the stairs, and it stings more than it should.`,
        emotional_beat: 'Self-awareness — uncomfortable truth',
        visual_prompt: `${character.physical_description} at work, catching reflection in window, looking disappointed, natural lighting, candid phone photo style, slightly out of focus`,
      },
      {
        description: `The breaking point comes unexpectedly. ${character.name} can't keep up with a simple task that should be easy. The shame is overwhelming. They sit alone afterward, staring at their hands, wondering how they let it get this bad.`,
        emotional_beat: 'Breaking point — emotional low',
        visual_prompt: `${character.physical_description} sitting alone, head down, dimly lit, emotional moment, raw phone photo quality, shallow depth of field, muted colors`,
      },
      {
        description: `Late at night scrolling through their phone, ${character.name} stumbles across a Tex Fitness ad. It's not the usual fitness influencer nonsense — it's real people, people who look like them. Something clicks. They download it before they can talk themselves out of it.`,
        emotional_beat: 'Discovery — spark of hope',
        visual_prompt: `${character.physical_description} in bed at night, phone screen glowing on face, scrolling, interested expression, dark room lit only by phone, phone photo aesthetic`,
      },
      {
        description: `Day one is humiliating. ${character.name} can barely finish the beginner workout on Tex Fitness. They're breathing hard, sweating through their shirt after just 10 minutes. But they don't quit. They just close the app and sit there, hands on their knees, alive.`,
        emotional_beat: 'Struggle — first attempt',
        visual_prompt: `${character.physical_description} in living room doing basic exercise, red-faced, sweating, determined expression, messy apartment background, raw phone photo, slightly blurry from movement`,
      },
      {
        description: `Weeks pass. The app guides them through it. Some days are terrible, some are okay. ${character.name} starts making small changes — packing a lunch, going to bed earlier. The scale barely moves, but their clothes fit differently. They catch themselves smiling at nothing.`,
        emotional_beat: 'Progress — gradual change',
        visual_prompt: `${character.physical_description} but looking slightly healthier, meal prepping in kitchen, small smile, natural daylight, phone photo quality, genuine candid moment, subtle difference in appearance`,
      },
      {
        description: `Three months in. ${character.name} stands in front of the mirror and sees someone they'd forgotten existed. They're not a fitness model — they're still them — but the light in their eyes is back. They take a selfie and actually like what they see.`,
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

CHARACTER:
Name: ${character.name}
Age: ${character.age}
Job: ${character.job}
Backstory: ${character.backstory}
Physical: ${character.physical_description}

EMOTIONAL TONE: ${emotional_tone}
${toneGuide}

STORY STRUCTURE:
1. Start with the character's normal, mundane life (show the routine, the food, the exhaustion)
2. Show a moment of uncomfortable self-awareness
3. Hit a breaking point (something specific and emotional)
4. Show the discovery of Tex Fitness (should feel natural, like stumbling across it on their phone — NOT a hard sell, more like product placement in a movie)
5. Show the struggle of starting (it should be hard and humbling)
6. Show gradual progress with small wins
7. End with a meaningful transformation (they're not a fitness model, but they've clearly changed — physically and emotionally)

IMPORTANT:
- Every visual prompt must include the character's physical description for consistency
- Visual prompts should describe "shot on old phone" style photography — grainy, candid, imperfect
- Tex Fitness should appear organically (the character discovers it, uses it on their phone) — never as an advertisement
- Make it emotionally compelling enough to stop someone mid-scroll
- Each scene should be 2-3 sentences maximum

Respond ONLY with a JSON array (no markdown, no code fences):
[
  {
    "description": "Scene narrative text",
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
