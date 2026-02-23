import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const LEONARDO_API_BASE = 'https://cloud.leonardo.ai/api/rest/v1'

async function pollForGeneration(
  generationId: string,
  apiKey: string,
  maxAttempts: number = 30,
  intervalMs: number = 5000
): Promise<string[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))

    const res = await fetch(`${LEONARDO_API_BASE}/generations/${generationId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) continue

    const data = await res.json()
    const generation = data.generations_by_pk

    if (generation?.status === 'COMPLETE') {
      return generation.generated_images.map(
        (img: { url: string }) => img.url
      )
    }

    if (generation?.status === 'FAILED') {
      throw new Error('Leonardo generation failed')
    }
  }

  throw new Error('Leonardo generation timed out')
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.LEONARDO_API_KEY

  let body: {
    visual_prompts: string[]
    character_physical: string
    scene_ids: string[]
    visual_dna?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { visual_prompts, character_physical, scene_ids, visual_dna } = body

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
      note: 'LEONARDO_API_KEY not configured. Returning placeholder images.',
    })
  }

  try {
    const results = await Promise.allSettled(
      visual_prompts.map(async (prompt, index) => {
        const promptWithDna = visual_dna ? `${visual_dna}, ${prompt}` : prompt
        const enhancedPrompt = `${promptWithDna}. Character: ${character_physical}. MANDATORY STYLE: shot on cheap 2015 Android phone, low megapixel sensor, heavy JPEG compression artifacts, visible sensor grain and noise, bad automatic white balance, slightly out of focus, no post-processing, harsh unflattering lighting, candid unposed snapshot, amateur framing, NOT professional photography, NOT studio lighting, NOT cinematic, NOT HDR, NOT retouched, NOT AI-generated looking. The image must look like it was taken by someone who doesn't know how to use a camera.`

        const genRes = await fetch(`${LEONARDO_API_BASE}/generations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            negative_prompt:
              'cartoon, anime, illustration, painting, drawing, art, cgi, 3d render, perfect skin, professional photography, studio lighting, HDR, oversaturated, fitness model, muscular, athletic, cinematic, bokeh, dramatic lighting, golden hour, high quality, 4k, detailed, sharp focus, retouched, airbrushed, beauty, glamour, fashion, magazine, portrait studio, softbox, rim light, beautiful, stunning, masterpiece, best quality',
            modelId: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
            width: 1080,
            height: 1920,
            num_images: 1,
            alchemy: true,
            contrast: 3.5,
          }),
        })

        if (!genRes.ok) {
          const errText = await genRes.text()
          throw new Error(`Leonardo API error: ${genRes.status} ${errText}`)
        }

        const genData = await genRes.json()
        const generationId =
          genData.sdGenerationJob?.generationId || genData.sdGenerationJob?.apiCreditCost

        if (!genData.sdGenerationJob?.generationId) {
          throw new Error('No generation ID returned from Leonardo')
        }

        const imageUrls = await pollForGeneration(
          genData.sdGenerationJob.generationId,
          apiKey
        )

        const imageUrl = imageUrls[0] || null

        if (imageUrl && isSupabaseConfigured && supabase) {
          await supabase
            .from('scenes')
            .update({ image_url: imageUrl })
            .eq('id', scene_ids[index])
        }

        return {
          scene_id: scene_ids[index],
          image_url: imageUrl,
          generation_id: generationId,
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
