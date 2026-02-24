import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const STORAGE_BUCKET = 'generated-images'

/**
 * Degrade image quality with Sharp to look like a real phone photo:
 * - Downscale to 720p then back up (kills sharpness)
 * - Gaussian blur
 * - Desaturate colors
 * - Add noise via overlay
 * - Crush to low-quality JPEG
 */
async function degradeImage(pngBuffer: Buffer): Promise<Buffer> {
  // Step 1: Downscale to 540px wide (kills fine detail), then back to 1080
  const downscaled = await sharp(pngBuffer)
    .resize(540, 960, { fit: 'cover' })
    .jpeg({ quality: 55 })
    .toBuffer()

  // Step 2: Scale back up (introduces softness), apply blur, crush colors
  const degraded = await sharp(downscaled)
    .resize(1080, 1920, { fit: 'cover', kernel: 'nearest' })
    .blur(1.8)
    .modulate({
      saturation: 0.7,  // wash out colors
      brightness: 1.05,  // slightly overexposed
    })
    .gamma(1.8)  // flatten the contrast
    .jpeg({ quality: 45, chromaSubsampling: '4:2:0' })  // heavy JPEG compression
    .toBuffer()

  return degraded
}

async function uploadToSupabase(
  imageBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    return null
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName)

  return data.publicUrl
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  let body: {
    visual_prompts: string[]
    character_physical: string
    scene_ids: string[]
    visual_dna?: string
    custom_directions?: (string | null)[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { visual_prompts, character_physical, scene_ids, visual_dna, custom_directions } = body

  if (!visual_prompts || !Array.isArray(visual_prompts) || !scene_ids) {
    return NextResponse.json(
      { error: 'Missing visual_prompts array or scene_ids' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    const placeholderImages = scene_ids.map((sceneId, i) => ({
      scene_id: sceneId,
      image_url: `https://placehold.co/1080x1920/1a1a2e/6d5aff?text=Scene+${i + 1}%0A${encodeURIComponent(visual_prompts[i]?.slice(0, 40) || 'Image')}`,
    }))

    return NextResponse.json({
      images: placeholderImages,
      note: 'GEMINI_API_KEY not configured. Returning placeholder images.',
    })
  }

  const ai = new GoogleGenAI({ apiKey })

  try {
    const results = await Promise.allSettled(
      visual_prompts.map(async (prompt, index) => {
        const dnaPrefix = visual_dna ? `${visual_dna}, ` : ''
        const customDir = custom_directions?.[index]
        const customSuffix = customDir ? ` Additional direction: ${customDir}.` : ''
        // Strip overly specific props from the visual prompt
        const cleanedPrompt = prompt
          .replace(/uber\s*eats\s*(thermal\s*)?bag\s*(visible\s*)?(on\s*\w+\s*seat\s*)?/gi, '')
          .replace(/delivery\s*bag/gi, '')
          .replace(/,\s*,/g, ',')
          .trim()

        const enhancedPrompt = `A normal everyday scene: ${cleanedPrompt}. The person looks like: ${character_physical}. ${dnaPrefix}The setting is completely normal and mundane — a regular apartment, street, or room. Nothing special. The lighting is just whatever ceiling light or window was there. The person is not posing.${customSuffix}`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: enhancedPrompt,
          config: {
            imageConfig: {
              aspectRatio: '9:16',
            },
          },
        })

        const candidate = response.candidates?.[0]
        if (!candidate?.content?.parts) {
          throw new Error('No content in Gemini response')
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imagePart = candidate.content.parts.find((part: any) => part.inlineData)

        if (!imagePart?.inlineData?.data) {
          throw new Error('No image data in Gemini response')
        }

        // Get the raw image from Gemini
        const rawBuffer = Buffer.from(imagePart.inlineData.data, 'base64')

        // Degrade it with Sharp to look like a real phone photo
        const degradedBuffer = await degradeImage(rawBuffer)

        let imageUrl: string | null = null

        // Upload degraded JPEG to Supabase Storage
        const fileName = `scenes/${scene_ids[index]}-${Date.now()}.jpg`
        imageUrl = await uploadToSupabase(degradedBuffer, fileName)

        // Fallback to data URL if storage upload fails
        if (!imageUrl) {
          const base64Degraded = degradedBuffer.toString('base64')
          imageUrl = `data:image/jpeg;base64,${base64Degraded}`
        }

        if (imageUrl && isSupabaseConfigured && supabase) {
          await supabase
            .from('scenes')
            .update({ image_url: imageUrl })
            .eq('id', scene_ids[index])
        }

        return {
          scene_id: scene_ids[index],
          image_url: imageUrl,
        }
      })
    )

    const images = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        scene_id: scene_ids[index],
        image_url: null,
        error: result.reason?.message || 'Generation failed',
      }
    })

    const allSucceeded = images.every((img) => img.image_url)
    if (allSucceeded && isSupabaseConfigured && supabase && scene_ids.length > 0) {
      const { data: firstScene } = await supabase
        .from('scenes')
        .select('story_id')
        .eq('id', scene_ids[0])
        .single()

      if (firstScene?.story_id) {
        await supabase
          .from('stories')
          .update({ status: 'complete' })
          .eq('id', firstScene.story_id)
      }
    }

    return NextResponse.json({ images })
  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate images', details: String(err) },
      { status: 500 }
    )
  }
}
