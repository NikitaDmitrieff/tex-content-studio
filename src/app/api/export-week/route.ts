import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import Anthropic from '@anthropic-ai/sdk'

type StoryExport = {
  dayLabel: string
  characterName: string
  characterAge: number
  characterJob: string
  emotionalTone: string
  scenes: Array<{ description: string; emotional_beat: string }>
  imageUrls: string[]
}

async function generateCaption(
  client: Anthropic,
  story: StoryExport
): Promise<string> {
  try {
    const storyText = story.scenes
      .map((s, i) => `Slide ${i + 1}: ${s.description}`)
      .join('\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Write a TikTok post caption for this fitness transformation carousel.

CHARACTER: ${story.characterName}, ${story.characterAge}, ${story.characterJob}
TONE: ${story.emotionalTone}

THE STORY:
${storyText}

Write a single post caption (hook + 2 body sentences + soft CTA + hashtags). Keep it under 150 words. Write casually, like a real person. No AI-sounding phrases. The CTA should mention "the app is in my bio" very casually.

Respond with ONLY the caption text, no JSON, no formatting.`,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (textContent && textContent.type === 'text') {
      return textContent.text.trim()
    }
  } catch {
    // Fall back to simple caption
  }

  return `${story.characterName}'s transformation story. Swipe through.\n\nthe app is in my bio if you're curious.\n\n#transformation #fitness #realpeople #fyp`
}

export async function POST(request: NextRequest) {
  let body: { stories: StoryExport[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { stories } = body

  if (!stories || !Array.isArray(stories) || stories.length === 0) {
    return NextResponse.json({ error: 'No stories provided' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const client = apiKey ? new Anthropic({ apiKey }) : null

  try {
    const zip = new JSZip()

    await Promise.allSettled(
      stories.map(async (story) => {
        const folderName = `${story.dayLabel.toLowerCase()}_${story.characterName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`
        const folder = zip.folder(folderName)
        if (!folder) return

        // Download images
        await Promise.allSettled(
          story.imageUrls.map(async (url, idx) => {
            try {
              const res = await fetch(url)
              if (!res.ok) return
              const buffer = await res.arrayBuffer()
              folder.file(`slide_${String(idx + 1).padStart(2, '0')}.jpg`, buffer)
            } catch {
              // skip failed image
            }
          })
        )

        // Generate caption
        const captionText = client
          ? await generateCaption(client, story)
          : `${story.characterName}'s transformation story. Swipe through.\n\nthe app is in my bio if you're curious.\n\n#transformation #fitness #realpeople #fyp`

        folder.file('caption.txt', captionText)

        // Story metadata
        const meta = {
          day: story.dayLabel,
          character: {
            name: story.characterName,
            age: story.characterAge,
            job: story.characterJob,
          },
          emotional_tone: story.emotionalTone,
          slide_count: story.scenes.length,
          image_count: story.imageUrls.length,
        }
        folder.file('metadata.json', JSON.stringify(meta, null, 2))
      })
    )

    const zipBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="content_week_${new Date().toISOString().slice(0, 10)}.zip"`,
        'Content-Length': String(zipBuffer.byteLength),
      },
    })
  } catch (err) {
    console.error('Export week error:', err)
    return NextResponse.json(
      { error: 'Failed to create week export', details: String(err) },
      { status: 500 }
    )
  }
}
