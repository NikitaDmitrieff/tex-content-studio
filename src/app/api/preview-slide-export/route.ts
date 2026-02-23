import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const TARGET_WIDTH = 1080
const TARGET_HEIGHT = 1920

function getSceneGradientSvg(emotionalBeat: string, index: number): string {
  let hash = 0
  const str = emotionalBeat || `scene-${index}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const h1 = Math.abs(hash) % 360
  const h2 = Math.abs(hash * 7) % 360

  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100; l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
  }

  const [r1, g1, b1] = hslToRgb(h1, 70, 20)
  const [r2, g2, b2] = hslToRgb(h2, 60, 10)

  return `
    <svg width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgb(${r1},${g1},${b1})" />
          <stop offset="100%" stop-color="rgb(${r2},${g2},${b2})" />
        </linearGradient>
      </defs>
      <rect width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}" fill="url(#bg)" />
    </svg>
  `
}

export async function POST(request: NextRequest) {
  let body: {
    storyId: string
    slideIndex: number
    captionVariant?: string | null
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { storyId, slideIndex, captionVariant } = body

  // Fetch scene data
  let scene: {
    image_url: string | null
    caption: string | null
    description: string
    emotional_beat: string
    order_index: number
  } | null = null

  if (isSupabaseConfigured && supabase) {
    const { data: scenes } = await supabase
      .from('scenes')
      .select('image_url, caption, description, emotional_beat, order_index')
      .eq('story_id', storyId)
      .order('order_index', { ascending: true })

    if (scenes && scenes[slideIndex]) {
      scene = scenes[slideIndex]
    }
  }

  const captionText = captionVariant ?? scene?.caption ?? null
  const emotionalBeat = scene?.emotional_beat ?? ''
  const imageUrl = scene?.image_url ?? null

  try {
    let baseImage: sharp.Sharp

    if (imageUrl) {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error(`Failed to download image: ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      baseImage = sharp(Buffer.from(arrayBuffer)).resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
    } else {
      // Use gradient SVG as background
      const gradientSvg = getSceneGradientSvg(emotionalBeat, slideIndex)
      baseImage = sharp(Buffer.from(gradientSvg)).resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
      })
    }

    if (captionText) {
      const escaped = captionText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

      // Word-wrap caption into lines of ~35 chars
      const words = escaped.split(' ')
      const lines: string[] = []
      let current = ''
      for (const word of words) {
        if ((current + ' ' + word).trim().length > 35 && current.length > 0) {
          lines.push(current.trim())
          current = word
        } else {
          current = (current + ' ' + word).trim()
        }
      }
      if (current) lines.push(current.trim())

      const lineHeight = 60
      const totalTextHeight = lines.length * lineHeight
      const textStartY = TARGET_HEIGHT - 180 - totalTextHeight

      const textElements = lines
        .map(
          (line, i) =>
            `<text x="${TARGET_WIDTH / 2}" y="${textStartY + i * lineHeight}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="48" font-weight="bold" fill="white"
              text-anchor="middle" dominant-baseline="middle"
            >${line}</text>`
        )
        .join('\n')

      const svgOverlay = `
        <svg width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}">
          <defs>
            <linearGradient id="grad" x1="0%" y1="60%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
              <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.85" />
            </linearGradient>
          </defs>
          <rect x="0" y="${TARGET_HEIGHT * 0.55}" width="${TARGET_WIDTH}" height="${TARGET_HEIGHT * 0.45}" fill="url(#grad)" />
          ${textElements}
        </svg>
      `

      baseImage = baseImage.composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    }

    const outputBuffer = await baseImage.jpeg({ quality: 92 }).toBuffer()
    const arrayBuffer = outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    ) as ArrayBuffer

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="slide_${slideIndex + 1}.jpg"`,
        'Content-Length': String(outputBuffer.byteLength),
      },
    })
  } catch (err) {
    console.error('Preview slide export error:', err)
    return NextResponse.json({ error: 'Failed to export slide', details: String(err) }, { status: 500 })
  }
}
