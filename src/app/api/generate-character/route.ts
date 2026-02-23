import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'ANTHROPIC_API_KEY is not configured',
        character: {
          name: 'Frank Delgado',
          age: 54,
          job: 'Long-haul trucker',
          backstory:
            "Frank spent 30 years behind the wheel eating gas station food and drinking energy drinks. His knees ache from the cab, his back is shot, and he hasn't seen his toes in years. His wife left him 3 years ago, partly because he stopped caring about himself. His daughter's wedding is in 6 months, and he overheard her telling a friend she was embarrassed he wouldn't fit in the family photos.",
          physical_description:
            'Heavyset at 280lbs on a 5\'10" frame, ruddy complexion from years of sun through the truck windshield, perpetual five o\'clock shadow, calloused hands, wears stretched-out trucker caps and flannel shirts.',
          personality_traits: [
            'Stubborn but secretly sensitive',
            'Dry humor',
            'Reliable to everyone but himself',
          ],
          reason_never_exercised:
            "Always told himself he'd start 'next month.' Believes gyms are for young people and vanity. Deep down, afraid of failing publicly.",
        },
        id: `new-${Date.now()}`,
      },
      { status: 200 }
    )
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate an atypical, everyday character for a fitness transformation TikTok story. The person should be relatable and ordinary — NOT a fitness model or athlete.

Requirements:
- Age between 30-65
- Blue collar or everyday job (trucker, janitor, lunch lady, postal worker, etc.)
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
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const character = JSON.parse(cleanedText)

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
          emotional_tone: 'comeback',
          status: 'draft',
        })
        .select('id')
        .single()

      if (!error && data) {
        storyId = data.id
      }
    }

    return NextResponse.json({
      character,
      id: storyId || `new-${Date.now()}`,
    })
  } catch (err) {
    console.error('Character generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate character', details: String(err) },
      { status: 500 }
    )
  }
}
