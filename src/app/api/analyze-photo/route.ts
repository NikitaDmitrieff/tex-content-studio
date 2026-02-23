import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

type AnalyzePhotoRequest = {
  image: string
  image_type: 'image/jpeg' | 'image/png'
  has_name: boolean
  has_job: boolean
  has_backstory: boolean
}

export type PhotoAnalysis = {
  estimated_age: number
  gender_presentation: string
  body_type: 'slim' | 'average' | 'heavyset' | 'muscular'
  skin_tone: string
  hair: { color: string; length: string; texture: string }
  notable_features: string[]
  lifestyle_cues: string
  visual_dna_prefix: string
  suggested_name?: string
  suggested_job?: string
  suggested_backstory?: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: AnalyzePhotoRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { image, image_type, has_name, has_job, has_backstory } = body

  if (!image) {
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const needsSuggestions = !has_name || !has_job || !has_backstory
  const suggestionFields: string[] = []
  if (!has_name) suggestionFields.push('"suggested_name": "a realistic full name matching the person\'s apparent background"')
  if (!has_job) suggestionFields.push('"suggested_job": "a realistic blue-collar or everyday occupation inferred from clothing/setting"')
  if (!has_backstory) suggestionFields.push('"suggested_backstory": "2-3 sentences about their likely life situation with emotional depth"')

  const extraFieldsBlock = needsSuggestions
    ? ',\n  ' + suggestionFields.join(',\n  ')
    : ''

  const prompt = `You are a character DNA extractor for a fitness transformation story app. Analyze this photo and return a structured JSON describing the person's physical characteristics and lifestyle cues for use as a story character.

Return ONLY a JSON object (no markdown, no code fences):
{
  "estimated_age": <number between 18-80>,
  "gender_presentation": "<descriptive string, e.g. 'masculine', 'feminine', 'androgynous'>",
  "body_type": "<exactly one of: slim | average | heavyset | muscular>",
  "skin_tone": "<descriptive string, e.g. 'olive', 'fair with freckles', 'deep brown'>",
  "hair": {
    "color": "<color>",
    "length": "<short | medium | long | bald>",
    "texture": "<straight | wavy | curly | coily>"
  },
  "notable_features": ["<e.g. weathered skin>", "<calloused hands>", "<tired eyes>"],
  "lifestyle_cues": "<1-2 sentences inferring their job, daily life, or life context from clothing, setting, or expression>",
  "visual_dna_prefix": "<a 40-60 word Leonardo.AI image consistency prompt describing this person's consistent visual identity — their gender, age range, notable physical features, skin tone, hair, typical clothing, and photo style. Format like: 'same [gender] [age range], [hair], [skin tone], [signature clothing], warm natural light, candid smartphone photo quality'>"${extraFieldsBlock}
}`

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image_type,
                data: image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const analysis: PhotoAnalysis = JSON.parse(cleanedText)

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Photo analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze photo', details: String(err) },
      { status: 500 }
    )
  }
}
