import { NextRequest, NextResponse } from 'next/server'

// ── Fish Audio TTS API ──────────────────────────────────────────────────────
// Env vars:
//   FISH_AUDIO_API_KEY   — API key from fish.audio
//   FISH_AUDIO_VOICE_ID  — (optional) default voice model reference ID

type RequestBody = {
  text: string
  emotion?: string
  language?: 'fr' | 'en'
  voice_id?: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.FISH_AUDIO_API_KEY

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { text, emotion, language = 'fr', voice_id } = body

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  // Demo mode when no API key
  if (!apiKey) {
    return NextResponse.json({
      audio_base64: null,
      format: 'mp3',
      duration_seconds: Math.round(text.length / 14 * 10) / 10, // ~14 chars/sec for French
      demo: true,
    })
  }

  // Prepend emotion tags to text for Fish Audio's expression system
  const spokenText = emotion ? `${emotion} ${text}` : text

  // Use provided voice, env default, or omit for Fish Audio default
  const referenceId = voice_id || process.env.FISH_AUDIO_VOICE_ID || undefined

  try {
    const fishBody: Record<string, unknown> = {
      text: spokenText,
      format: 'mp3',
      mp3_bitrate: 128,
      latency: 'normal',
    }
    if (referenceId) {
      fishBody.reference_id = referenceId
    }

    const res = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fishBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Fish Audio API error:', res.status, errorText)
      return NextResponse.json(
        { error: 'Voice generation failed', details: errorText },
        { status: 502 }
      )
    }

    const audioBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(audioBuffer).toString('base64')

    // Estimate duration: mp3 at 128kbps
    const estimatedDuration = Math.round((audioBuffer.byteLength * 8) / 128000 * 10) / 10

    return NextResponse.json({
      audio_base64: base64,
      format: 'mp3',
      duration_seconds: estimatedDuration,
      demo: false,
    })
  } catch (err) {
    console.error('Voice generation error:', err)
    return NextResponse.json(
      { error: 'Voice generation failed', details: String(err) },
      { status: 500 }
    )
  }
}
