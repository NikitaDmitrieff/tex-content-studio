import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

type RequestBody = {
  character_name: string
  character_age: number
  character_job: string
  character_backstory: string
  emotional_tone: string
  scenes: Array<{ description: string; emotional_beat: string }>
  language: 'en' | 'fr'
  section?: 'voice_card' | 'comment_responses' | 'part2_hooks' | 'caption_variants'
  existing_caption?: {
    hook: string
    body: string
    cta: string
    hashtags: string
  } | null
}

function getDemoData(language: 'en' | 'fr', characterName: string, characterAge: number) {
  if (language === 'fr') {
    return {
      voice_card: {
        phrases: [
          'Écoute, je vais pas te mentir, j\'avais complètement lâché l\'affaire.',
          'Mes genoux me tuaient mais je continuais quand même, tu vois.',
          'J\'ai pas cherché à être parfait, j\'ai juste arrêté d\'abandonner.',
          'Le plus dur c\'était pas la douleur, c\'était se regarder dans le miroir.',
        ],
        vocabulary_notes:
          'Tutoiement systématique, expressions familières (\"tu vois\", \"truc\", \"genre\"), évite le jargon fitness trop poli, mélange parfois quelques anglicismes comme \"checker\" ou \"fit\"',
        emotional_register:
          'Parle franchement, avec une auto-dérision douce, mal à l\'aise avec les compliments directs.',
      },
      comment_responses: [
        {
          comment_type: 'C\'est fake / ça a l\'air truqué',
          response:
            'Haha ouais je comprends, moi-même j\'aurais dit la même chose. C\'est 100% moi, même lumière merdique dans la salle de bain et tout.',
        },
        {
          comment_type: 'T\'as mangé quoi ?',
          response:
            'Franchement j\'ai rien révolutionné — j\'ai juste commencé à tracker avec cette app et ça m\'a ouvert les yeux sur ce que je mangeais vraiment.',
        },
        {
          comment_type: 'Ça a pris combien de temps ?',
          response:
            'Plus que je voulais admettre au départ lol. Mais après quelques semaines j\'ai arrêté de compter et je me suis juste focalisé sur ne pas abandonner.',
        },
        {
          comment_type: 'Moi j\'y arriverais jamais',
          response:
            'J\'aurais dit exactement pareil il y a pas si longtemps. La différence c\'est juste que j\'ai arrêté de me convaincre que c\'était trop tard pour moi.',
        },
        {
          comment_type: 'T\'es une inspiration',
          response:
            'Ça me touche vraiment, même si je sais pas trop quoi dire avec ce mot... Je suis juste quelqu\'un qui a arrêté de se mentir.',
        },
        {
          comment_type: 'T\'as une salle de sport ?',
          response:
            'Ouais une salle proche de chez moi, rien de fancy. L\'important c\'est que j\'y suis allé même les jours où j\'avais envie de rien.',
        },
        {
          comment_type: 'T\'es magnifique !',
          response:
            'Pfff... merci vraiment. C\'est bizarre à entendre encore. Mais ça fait quelque chose quand même.',
        },
        {
          comment_type: 'Quel est ton programme ?',
          response:
            'Rien de compliqué, c\'est tout dans l\'app que j\'utilise — elle m\'a aidé à rester cohérent sans que ça devienne une obsession.',
        },
      ],
      part2_hooks: [
        'Partie 2 arrive... et c\'est là que j\'ai failli tout arrêter. Abonne-toi pour pas rater la suite.',
        'Ce que personne voit sur cette photo, je vais l\'expliquer en partie 2. Follow si tu veux la vérité.',
        'La vraie transformation elle a pas commencé là où tu crois. Partie 2 bientôt — abonne-toi.',
      ],
      caption_variants: [
        {
          label: 'A',
          hook: 'C\'est quoi l\'effet de ${characterAge} ans de malbouffe sur un corps humain ?',
          preview: `C'est quoi l'effet de ${characterAge} ans de malbouffe sur un corps humain ?\n\nJ'ai décidé de ne plus regarder ailleurs. Swipe pour voir le résultat.\n\nL'app est dans ma bio si tu veux essayer ce qui a marché pour moi.\n\n#transformation #fitness #realpeople #motivation #fyp`,
        },
        {
          label: 'B',
          hook: `Je rentre dans des fringues que j'avais pas portées depuis des années.`,
          preview: `Je rentre dans des fringues que j'avais pas portées depuis des années.\n\nC'est le genre de victoire dont personne parle. Swipe pour voir le avant/après.\n\nL'app est dans ma bio si tu veux essayer ce qui a marché pour moi.\n\n#transformation #fitness #realpeople #motivation #fyp`,
        },
        {
          label: 'C',
          hook: `J'ai failli pas poster ça.`,
          preview: `J'ai failli pas poster ça.\n\nMais si ça peut aider une seule personne... Swipe.\n\nL'app est dans ma bio si tu veux essayer ce qui a marché pour moi.\n\n#transformation #fitness #realpeople #motivation #fyp`,
        },
      ],
    }
  }

  return {
    voice_card: {
      phrases: [
        `Look, I'm not gonna pretend I had it figured out.`,
        `My knees were killing me but I kept going anyway.`,
        `I didn't try to be perfect, I just stopped quitting.`,
        `The hardest part wasn't the pain — it was looking at myself in the mirror.`,
      ],
      vocabulary_notes:
        `Informal American English, uses contractions always ("I'm", "didn't", "gonna"), avoids fitness buzzwords, occasional self-deprecating humor, never uses motivational poster language`,
      emotional_register:
        `Speaks bluntly, slightly self-deprecating, uncomfortable with compliments, leads with honesty over positivity.`,
    },
    comment_responses: [
      {
        comment_type: 'Is this real / this looks fake',
        response: `Haha yeah I get it, I would've said the same thing. It's 100% me — bad bathroom lighting and all.`,
      },
      {
        comment_type: 'What did you eat?',
        response: `Nothing revolutionary honestly — I just started tracking with this app and it opened my eyes to what I was actually eating.`,
      },
      {
        comment_type: 'How long did this take?',
        response: `Longer than I wanted to admit at first lol. But after a few weeks I stopped counting and just focused on not quitting.`,
      },
      {
        comment_type: 'I could never do this',
        response: `I would've said the exact same thing not that long ago. The difference is I just stopped convincing myself it was too late.`,
      },
      {
        comment_type: "You're an inspiration",
        response: `That genuinely means something, even if I don't know what to do with that word... I'm just someone who stopped lying to themselves.`,
      },
      {
        comment_type: 'What gym do you go to?',
        response: `Just a small place close to home, nothing fancy. The important thing is I actually showed up even the days I didn't want to.`,
      },
      {
        comment_type: 'You look amazing!',
        response: `Ha... thank you. That's still weird to hear. But it means something.`,
      },
      {
        comment_type: "What's your workout?",
        response: `Nothing complicated — it's all in the app I use. It helped me stay consistent without it taking over my life.`,
      },
    ],
    part2_hooks: [
      `Part 2 coming... and that's when I almost quit everything. Follow so you don't miss it.`,
      `What nobody sees in this photo — I'll explain in Part 2. Follow if you want the real story.`,
      `The real transformation didn't start where you think. Part 2 soon — follow along.`,
    ],
    caption_variants: [
      {
        label: 'A',
        hook: `What does ${characterAge} years of gas station burritos do to a man?`,
        preview: `What does ${characterAge} years of gas station burritos do to a man?\n\nI decided to stop looking away. Swipe to see.\n\nThe app is in my bio if you want to try what worked for me.\n\n#transformation #fitness #realpeople #motivation #fyp`,
      },
      {
        label: 'B',
        hook: `I fit into pants I haven't worn in years.`,
        preview: `I fit into pants I haven't worn in years.\n\nThat's the kind of win nobody talks about. Swipe for the before/after.\n\nThe app is in my bio if you want to try what worked for me.\n\n#transformation #fitness #realpeople #motivation #fyp`,
      },
      {
        label: 'C',
        hook: `I almost didn't post this.`,
        preview: `I almost didn't post this.\n\nBut if it helps even one person... Swipe.\n\nThe app is in my bio if you want to try what worked for me.\n\n#transformation #fitness #realpeople #motivation #fyp`,
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  let body: RequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    character_name,
    character_age,
    character_job,
    character_backstory,
    emotional_tone,
    scenes,
    language = 'en',
    section,
    existing_caption,
  } = body

  if (!character_name || !scenes?.length) {
    return NextResponse.json({ error: 'Missing character or scenes' }, { status: 400 })
  }

  if (!apiKey) {
    const demoData = getDemoData(language, character_name, character_age)
    if (section) {
      return NextResponse.json({ [section]: demoData[section] })
    }
    return NextResponse.json(demoData)
  }

  const storyText = scenes
    .map((s, i) => `Scene ${i + 1}: ${s.description} (emotional beat: ${s.emotional_beat})`)
    .join('\n')

  const langInstruction =
    language === 'fr'
      ? 'Write ALL text in French. Use tutoiement, informal register, and authentic French TikTok language. Use French fitness slang where appropriate.'
      : 'Write ALL text in English. Use casual, informal American English. Avoid motivational poster language.'

  const existingCaptionText = existing_caption
    ? `\nEXISTING CAPTION (body and CTA for variant previews):\nBody: ${existing_caption.body}\nCTA: ${existing_caption.cta}\nHashtags: ${existing_caption.hashtags}`
    : ''

  function buildSectionPrompt(sectionName: string): string {
    const sectionPrompts: Record<string, string> = {
      voice_card: `Generate the "voice_card" section only.`,
      comment_responses: `Generate the "comment_responses" section only.`,
      part2_hooks: `Generate the "part2_hooks" section only.`,
      caption_variants: `Generate the "caption_variants" section only.`,
    }
    return sectionPrompts[sectionName] ?? 'Generate all sections.'
  }

  const sectionInstruction = section ? buildSectionPrompt(section) : 'Generate all sections.'

  const prompt = `You are a social media content strategist specializing in authentic fitness transformation content.

CHARACTER:
Name: ${character_name}
Age: ${character_age}
Job: ${character_job}
Backstory: ${character_backstory}
Emotional tone of their story: ${emotional_tone}

THE STORY ARC:
${storyText}
${existingCaptionText}

LANGUAGE: ${langInstruction}

${sectionInstruction}

Return a JSON object with the following structure (include only the requested section if regenerating one):

{
  "voice_card": {
    "phrases": ["<3-4 actual sentences this character would say — specific, in-character, conversational>"],
    "vocabulary_notes": "<describe their vocabulary style: formal/informal, any language quirks, what they avoid>",
    "emotional_register": "<1 sentence describing their emotional tone, e.g. 'Speaks bluntly, slightly self-deprecating, uncomfortable with compliments'>"
  },
  "comment_responses": [
    {
      "comment_type": "Is this real / this looks fake",
      "response": "<confident but not defensive in-character response>"
    },
    {
      "comment_type": "What did you eat?",
      "response": "<character-voice answer with soft Tex Fitness mention like 'I started tracking with this app...'>"
    },
    {
      "comment_type": "How long did this take?",
      "response": "<realistic timeline answer in character voice>"
    },
    {
      "comment_type": "I could never do this",
      "response": "<empathetic encouragement in character voice>"
    },
    {
      "comment_type": "You're an inspiration",
      "response": "<humble, real-sounding response>"
    },
    {
      "comment_type": "What gym do you go to?",
      "response": "<specific-feeling answer, not branded>"
    },
    {
      "comment_type": "You look amazing!",
      "response": "<awkward/touched response in character>"
    },
    {
      "comment_type": "What's your workout?",
      "response": "<brief answer pointing to 'the app I use' as soft CTA>"
    }
  ],
  "part2_hooks": [
    "<hook 1: 1-2 sentences for TikTok, drives follows, hints at what changed based on story arc>",
    "<hook 2: different angle>",
    "<hook 3: different angle>"
  ],
  "caption_variants": [
    {
      "label": "A",
      "hook": "<Question hook — e.g. 'What does 54 years of gas station burritos do to a man?'>",
      "preview": "<full caption preview: this hook + body text + soft CTA + hashtags. Use the existing caption body/CTA if provided, otherwise generate fitting ones>"
    },
    {
      "label": "B",
      "hook": "<Statement hook — e.g. 'I fit into pants I haven't worn in 12 years.'>",
      "preview": "<full caption preview>"
    },
    {
      "label": "C",
      "hook": "<Confession hook — e.g. 'I almost didn't post this.'>",
      "preview": "<full caption preview>"
    }
  ]
}

RULES:
- All responses must sound like this specific character — not a generic fitness influencer
- Comment responses should feel natural, not scripted
- Part 2 hooks must reference this character's specific emotional arc
- Caption variants must be strikingly different from each other
- NEVER use emoji in voice card or comment responses
- For the "app" mentions, use phrases like "this app", "the app I use", "started tracking with this app" — never brand name
- Respond ONLY with the JSON object, no markdown, no code fences`

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleanedText)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Engagement kit generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate engagement kit', details: String(err) },
      { status: 500 }
    )
  }
}
