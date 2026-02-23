import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import sharp from 'sharp'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const TARGET_WIDTH = 1080
const TARGET_HEIGHT = 1920

async function downloadAndProcessImage(
  imageUrl: string,
  caption: string | null,
  slideNumber: number
): Promise<Buffer> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const inputBuffer = Buffer.from(arrayBuffer)

  let image = sharp(inputBuffer).resize(TARGET_WIDTH, TARGET_HEIGHT, {
    fit: 'cover',
    position: 'center',
  })

  if (caption) {
    const escapedCaption = caption
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

    const svgOverlay = `
      <svg width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="70%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
            <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <rect x="0" y="${TARGET_HEIGHT * 0.65}" width="${TARGET_WIDTH}" height="${TARGET_HEIGHT * 0.35}" fill="url(#grad)" />
        <text
          x="${TARGET_WIDTH / 2}"
          y="${TARGET_HEIGHT - 80}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="42"
          font-weight="bold"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle"
        >${escapedCaption}</text>
      </svg>
    `

    image = image.composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
  }

  const outputBuffer = await image.jpeg({ quality: 92 }).toBuffer()
  return outputBuffer
}

type AudioBriefExport = {
  bpm_range: string
  mood_arc: string
  genre_tags: string[]
  french_affinity_score: number
  universal_score: number
  song_suggestions: Array<{
    artist: string
    track: string
    mood_match_score: number
    why_it_fits: string
    tiktok_search_term: string
  }>
}

export async function POST(request: NextRequest) {
  let body: {
    story_id: string
    audio_brief?: AudioBriefExport | null
    scenes?: Array<{
      id: string
      order_index: number
      description: string
      emotional_beat: string
      visual_prompt: string
      image_url: string | null
      caption: string | null
    }>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { story_id, audio_brief } = body
  let scenes = body.scenes

  if (!scenes || scenes.length === 0) {
    if (isSupabaseConfigured && supabase && story_id) {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', story_id)
        .order('order_index', { ascending: true })

      if (error || !data) {
        return NextResponse.json(
          { error: 'Failed to fetch scenes from database' },
          { status: 500 }
        )
      }

      scenes = data
    } else {
      return NextResponse.json(
        { error: 'No scenes provided and Supabase not configured' },
        { status: 400 }
      )
    }
  }

  const scenesWithImages = scenes.filter((s) => s.image_url)

  if (scenesWithImages.length === 0) {
    return NextResponse.json({ error: 'No scenes have images to export' }, { status: 400 })
  }

  try {
    const zip = new JSZip()

    const imagePromises = scenesWithImages.map(async (scene, index) => {
      try {
        const buffer = await downloadAndProcessImage(
          scene.image_url!,
          scene.caption,
          index + 1
        )

        const filename = `slide_${String(index + 1).padStart(2, '0')}.jpg`
        zip.file(filename, buffer)
      } catch (err) {
        console.error(`Failed to process scene ${index + 1}:`, err)
      }
    })

    await Promise.all(imagePromises)

    const metadata = {
      story_id,
      exported_at: new Date().toISOString(),
      slide_count: scenesWithImages.length,
      dimensions: `${TARGET_WIDTH}x${TARGET_HEIGHT}`,
      slides: scenesWithImages.map((s, i) => ({
        slide: i + 1,
        description: s.description,
        emotional_beat: s.emotional_beat,
        caption: s.caption || null,
      })),
    }
    zip.file('metadata.json', JSON.stringify(metadata, null, 2))

    const captions = scenesWithImages
      .map(
        (s, i) =>
          `Slide ${i + 1}: ${s.caption || s.description}\nEmotional beat: ${s.emotional_beat}`
      )
      .join('\n\n')
    zip.file('captions.txt', captions)

    // Include audio brief files if provided
    if (audio_brief) {
      zip.file('audio-guide.json', JSON.stringify(audio_brief, null, 2))

      const audioTxt = [
        '=== AUDIO BRIEF ===',
        '',
        `BPM Range: ${audio_brief.bpm_range}`,
        `Mood Arc:  ${audio_brief.mood_arc}`,
        `Genres:    ${audio_brief.genre_tags.join(', ')}`,
        `French Affinity Score: ${Math.round(audio_brief.french_affinity_score * 100)}%`,
        `Universal Score:       ${Math.round(audio_brief.universal_score * 100)}%`,
        '',
        '=== SONG SUGGESTIONS ===',
        '',
        ...audio_brief.song_suggestions.map((s, i) =>
          [
            `${i + 1}. ${s.track} — ${s.artist}`,
            `   Mood Match: ${Math.round(s.mood_match_score * 100)}%`,
            `   Why it fits: ${s.why_it_fits}`,
            `   TikTok search: ${s.tiktok_search_term}`,
            '',
          ].join('\n')
        ),
      ].join('\n')
      zip.file('audio-guide.txt', audioTxt)
    }

    const zipArrayBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return new Response(zipArrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="tiktok_carousel_${story_id}.zip"`,
        'Content-Length': String(zipArrayBuffer.byteLength),
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json(
      { error: 'Failed to create export', details: String(err) },
      { status: 500 }
    )
  }
}
