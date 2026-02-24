import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { RealDataInput, RealityAnchors } from '@/lib/types'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { realData: RealDataInput; tone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { realData, tone = 'comeback' } = body

  if (!realData?.journey) {
    return NextResponse.json({ error: 'Missing journey data' }, { status: 400 })
  }

  const privacyNotes: string[] = []
  if (realData.privacy?.change_age) privacyNotes.push('Change the age by ±5 years')
  if (realData.privacy?.change_gender) privacyNotes.push('Change the gender')
  if (realData.privacy?.change_city) privacyNotes.push('Use a different city')
  if (realData.privacy?.change_job_type)
    privacyNotes.push('Change the specific job title but keep the same category (e.g. nurse stays healthcare)')

  const journeyText = realData.journey.freeform
    ? realData.journey.freeform
    : [
        realData.journey.start_weight && `Started at ${realData.journey.start_weight}`,
        realData.journey.end_weight && `Reached ${realData.journey.end_weight}`,
        realData.journey.timeframe && `over ${realData.journey.timeframe}`,
      ]
        .filter(Boolean)
        .join(', ')

  if (!apiKey) {
    const demoAnchors: RealityAnchors = {
      anchors: [
        { fact: journeyText, type: 'real', scene_index: null },
        {
          fact: realData.turning_point || 'A defining moment that forced change',
          type: 'real',
          scene_index: 3,
        },
        { fact: realData.proof || 'Achieved meaningful results', type: 'real', scene_index: 8 },
        { fact: 'Fictional name and appearance', type: 'invented', scene_index: null },
      ],
      turning_point_scene_index: 3,
      proof_scene_index: 8,
    }
    return NextResponse.json({
      character: {
        name: 'Samira Belkacem',
        age: 42,
        job: 'Secrétaire médicale',
        backstory: `Basé sur un vrai parcours : ${journeyText}. Samira en a eu marre de toujours passer après les autres. Deux gosses, un ex qui payait jamais la pension, et un boulot assis 9h par jour à grignoter des BN.`,
        physical_description:
          'Taille moyenne, en surpoids après des années de travail de bureau, yeux fatigués, toujours en blouse pratique',
        personality_traits: ['Déterminée', 'Têtue en silence', 'Protectrice avec ses proches'],
        reason_never_exercised:
          "Deux boulots et trois gosses — y'avait jamais le bon moment. Jusqu'au jour où elle a craqué.",
        visual_dna:
          'same heavyset woman, early 40s, dark hair pulled back, tired but determined expression, harsh indoor lighting, low quality phone camera, grainy',
      },
      reality_anchors: demoAnchors,
      id: `new-${Date.now()}`,
      character_id: null,
    })
  }

  try {
    const client = new Anthropic({ apiKey })

    const prompt = `A real person wants to turn their genuine transformation story into a TikTok carousel for a FRENCH audience. Your job is to invent a FICTIONAL FRENCH character that preserves ALL the real details but protects the creator's identity.

REAL DATA PROVIDED:
- Journey: ${journeyText}
- Job category: ${realData.job?.category?.replace(/_/g, ' ') || 'unspecified'}
- Job struggle: ${realData.job?.struggle || 'not specified'}
- Specific struggles: ${realData.struggles?.join(', ') || 'not specified'}
- Struggle detail: ${realData.struggle_detail || 'not specified'}
- Turning point: ${realData.turning_point || 'not specified'}
- Proof/wins: ${realData.proof || 'not specified'}

PRIVACY MODIFICATIONS TO APPLY:
${privacyNotes.length > 0 ? privacyNotes.map((n) => `- ${n}`).join('\n') : '- None requested — keep demographics realistic but invent name/face/city'}

YOUR TASK:
1. Invent a FICTIONAL French name, face description, and slightly modified background
2. Preserve ALL specific numbers, struggles, and emotional beats as anchor facts
3. Generate a visual_dna prompt IN ENGLISH that fits the type of person (age, build, job). MUST end with: harsh indoor lighting, low quality phone camera, grainy
4. Return a reality_anchors object listing what is real vs inspired vs invented

LANGUAGE RULES:
- The character MUST be French, living in France
- Give them a French name (or a name common in France — including North African, West African, Portuguese heritage names)
- French everyday job: aide-soignant(e), caissier/ère, livreur, agent d'entretien, secrétaire médicale, etc.
- Write backstory, personality_traits, reason_never_exercised in FRENCH (informal spoken French)
- Use French cultural references: Carrefour, Auchan, Deliveroo, McDo, kebab, PMU, RER, HLM, cantine, Picard
- The job field should be in French
- visual_dna stays in ENGLISH (for image generation AI)
- IMPORTANT: visual_dna must NOT contain professional photography terms. NO "warm natural light", NO "soft lighting", NO "beautiful", NO "professional"

OTHER RULES:
- KEEP all real numbers (weights, timeframes, dress sizes, specific wins)
- KEEP all emotional beats (the turning point moment, the struggles)
- CHANGE name, face, city, and invent backstory details
- Apply any requested privacy modifications
- Make the character feel like a real, relatable French person from that profession

Respond ONLY with a JSON object (no markdown, no code fences):
{
  "name": "Invented French full name",
  "age": number,
  "job": "Their occupation IN FRENCH",
  "backstory": "2-3 sentences IN FRENCH about their life situation — incorporate the real struggles naturally",
  "physical_description": "Detailed physical appearance IN FRENCH matching the demographic and job",
  "personality_traits": ["trait1 in French", "trait2 in French", "trait3 in French"],
  "reason_never_exercised": "Why they never started IN FRENCH — incorporate the real job/life struggles",
  "visual_dna": "Short locking prompt IN ENGLISH for image consistency (15-25 words) — MUST end with: harsh indoor lighting, low quality phone camera, grainy",
  "reality_anchors": {
    "anchors": [
      {"fact": "the actual real data point", "type": "real", "scene_index": null},
      {"fact": "something inspired by real", "type": "inspired", "scene_index": null},
      {"fact": "invented backstory detail", "type": "invented", "scene_index": null}
    ],
    "turning_point_scene_index": null,
    "proof_scene_index": null
  }
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1536,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleanedText)
    const { reality_anchors, ...character } = result

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
          visual_dna: character.visual_dna ?? null,
          emotional_tone: tone,
          status: 'draft',
          reality_anchors: reality_anchors ?? null,
          is_reality_grounded: true,
        })
        .select('id')
        .single()

      if (!error && data) {
        storyId = data.id
      }
    }

    return NextResponse.json({
      character,
      reality_anchors,
      id: storyId || `new-${Date.now()}`,
      character_id: null,
    })
  } catch (err) {
    console.error('Reality character generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate character from reality', details: String(err) },
      { status: 500 }
    )
  }
}
