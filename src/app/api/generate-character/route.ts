import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: { tone?: string; excluded_jobs?: string[]; save_to_character?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const tone = body.tone || 'comeback'
  const saveToCharacter = body.save_to_character ?? false

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'ANTHROPIC_API_KEY is not configured',
        character: {
          name: 'Gérard Blanchard',
          age: 52,
          job: 'Routier longue distance',
          backstory:
            "Gérard passe 30 ans derrière le volant à manger des sandwichs de station-service et boire du Monster. Ses genoux le lâchent, son dos est foutu, et il a pas vu ses pieds depuis des années. Sa femme l'a quitté il y a 3 ans, en partie parce qu'il s'est laissé aller. Le mariage de sa fille est dans 6 mois et il l'a entendue dire à une copine qu'elle avait honte qu'il rentre pas dans les photos de famille.",
          physical_description:
            'Fort, 1m75 pour 130kg, teint rougeaud à force de soleil à travers le pare-brise, barbe de 3 jours permanente, mains calleuses, casquette de routier défoncée et chemise en flanelle.',
          personality_traits: [
            'Têtu mais secrètement sensible',
            'Humour pince-sans-rire',
            'Fiable pour tout le monde sauf pour lui-même',
          ],
          reason_never_exercised:
            "S'est toujours dit qu'il commencerait 'le mois prochain.' Pense que la salle c'est pour les jeunes et les narcissiques. Au fond, il a peur d'échouer devant tout le monde.",
          visual_dna:
            "same heavyset man, mid-50s, ruddy complexion, five o'clock shadow, stretched trucker cap, flannel shirt, harsh indoor lighting, low quality phone camera, grainy",
        },
        id: `new-${Date.now()}`,
        character_id: null,
      },
      { status: 200 }
    )
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate an atypical, everyday FRENCH character for a fitness transformation TikTok story targeting a FRENCH audience. The person should be relatable and ordinary — NOT a fitness model or athlete. They must feel authentically French.

Requirements:
- This is a FRENCH person living in FRANCE
- Give them a French name (or a name common in France — including North African, West African, Portuguese, or mixed heritage names that are common in France)
- Age between 20-55 (mix it up — include younger people in their 20s dealing with weight, not just older)
- French everyday job: chauffeur VTC, caissier/ère, aide-soignant(e), préparateur de commandes, intérimaire, livreur, agent d'entretien, auxiliaire de puériculture, agent de sécurité, employé(e) de restauration, ouvrier BTP, etc.
- Use French cultural references in the backstory: Carrefour, Auchan, Deliveroo, McDo, kebab, PMU, RER, HLM, cantine, Picard, BN, Kinder, la salle, etc.
- Physical description showing someone overweight and out of shape
- Include both men AND women — don't default to men
- Diverse backgrounds reflecting France's diversity
- Write the backstory in FRENCH (informal spoken French). Keep personality_traits and reason_never_exercised in French too.
- The job field should be in French
- A visual_dna stays in ENGLISH: a short, precise image-locking prompt prefix (15-25 words). Format: "same [gender], [age range], [hair], [skin tone], [signature clothing], [key feature], harsh indoor lighting, low quality phone camera, grainy"
  IMPORTANT: The visual_dna must NOT contain any professional photography terms. NO "warm natural light", NO "soft lighting", NO "beautiful", NO "professional".

Respond ONLY with a JSON object (no markdown, no code fences):
{
  "name": "Full name (French or common-in-France name)",
  "age": number,
  "job": "Their occupation IN FRENCH",
  "backstory": "2-3 sentences IN FRENCH about their life situation and emotional weight",
  "physical_description": "Detailed physical appearance IN FRENCH, body type, typical clothing",
  "personality_traits": ["trait1 in French", "trait2 in French", "trait3 in French"],
  "reason_never_exercised": "1-2 sentences IN FRENCH explaining why they never started",
  "visual_dna": "short locking prompt prefix IN ENGLISH for image consistency — MUST end with: harsh indoor lighting, low quality phone camera, grainy"
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
    let characterId: string | null = null

    if (isSupabaseConfigured && supabase) {
      if (saveToCharacter) {
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .insert({
            name: character.name,
            age: character.age,
            job: character.job,
            backstory: character.backstory,
            physical_description: character.physical_description,
            visual_dna: character.visual_dna,
          })
          .select('id')
          .single()

        if (!charError && charData) {
          characterId = charData.id
        }
      }

      const { data, error } = await supabase
        .from('stories')
        .insert({
          character_name: character.name,
          character_age: character.age,
          character_job: character.job,
          character_backstory: character.backstory,
          character_physical: character.physical_description,
          emotional_tone: tone,
          status: 'draft',
          ...(characterId ? { character_id: characterId } : {}),
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
      character_id: characterId,
    })
  } catch (err) {
    console.error('Character generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate character', details: String(err) },
      { status: 500 }
    )
  }
}
