# Tex Content Studio

TikTok carousel content generator for Tex Fitness. Creates fictional character transformation stories with AI-generated images, designed for TikTok photo carousels.

## Architecture

- **Framework:** Next.js 15+ (App Router, TypeScript, Tailwind CSS 4)
- **Database:** Supabase PostgreSQL (`tex_content` schema on shared instance `lhidckbjztivaeceazyi`)
- **AI Text:** Claude API via `@anthropic-ai/sdk` (character + story generation)
- **AI Images:** Leonardo.AI REST API (1080x1920 portrait, photoReal v2)
- **Image Processing:** Sharp (resize, caption overlay)
- **Export:** JSZip (carousel zip with metadata + voiceover script)

## Project Structure

```
src/
  app/
    page.tsx                          # Dashboard: story grid + new story button
    layout.tsx                        # Root layout: dark theme, Inter font
    globals.css                       # Glass-card system, buttons, TikTok preview, step indicator
    story/[id]/page.tsx               # Story workspace: server component, loads story + scenes
    api/
      generate-character/route.ts     # POST: Claude generates random character (name, age, job, backstory, physical)
      generate-story/route.ts         # POST: Claude generates 6-8 scene story arc from character + tone
      generate-images/route.ts        # POST: Leonardo.AI generates portrait images per scene, polls for completion
      export/route.ts                 # POST: Sharp processes images + JSZip packages carousel as downloadable zip
  components/
    StoryWorkspace.tsx                # Client wizard container: 4 steps, manages story + scenes state
    StepIndicator.tsx                 # Visual step progress bar (1-4)
    CharacterStep.tsx                 # Step 1: character fields + emotional tone selector + regenerate
    StoryArcStep.tsx                  # Step 2: scene list with reorder, edit inline, add/delete, regenerate
    ImageGenerationStep.tsx           # Step 3: image generation grid with per-scene status tracking
    ExportStep.tsx                    # Step 4: carousel preview slider, caption editor, voiceover script, hashtags, download
    NewStoryButton.tsx                # Dashboard CTA: creates story via generate-character API, redirects to workspace
  lib/
    types.ts                          # Story, Scene types, EmotionalTone union, EMOTIONAL_TONES config, STATUS_CONFIG
    supabase.ts                       # Supabase client configured for tex_content schema
```

## Database Schema (`tex_content` schema)

```sql
-- Stories
CREATE TABLE tex_content.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name TEXT NOT NULL DEFAULT '',
  character_age INTEGER NOT NULL DEFAULT 35,
  character_job TEXT NOT NULL DEFAULT '',
  character_backstory TEXT NOT NULL DEFAULT '',
  character_physical TEXT NOT NULL DEFAULT '',
  emotional_tone TEXT NOT NULL DEFAULT 'comeback',   -- comeback | revenge | quiet_transformation | rock_bottom | against_all_odds
  status TEXT NOT NULL DEFAULT 'draft',              -- draft | scenes_ready | images_generating | complete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scenes
CREATE TABLE tex_content.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES tex_content.stories(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  description TEXT NOT NULL,
  emotional_beat TEXT NOT NULL,
  visual_prompt TEXT NOT NULL,
  image_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, order_index)
);
```

The Supabase client is configured with `db: { schema: 'tex_content' }` so all `.from('stories')` and `.from('scenes')` calls automatically target the correct schema.

## Key Patterns

- **App Router:** Server components for data fetching (dashboard, story page), client components for wizard interactivity
- **Graceful degradation:** All pages work without API keys (demo/fallback data returned from API routes)
- **4-step wizard:** State managed in `StoryWorkspace.tsx` via useState, passed down to step components
- **Image generation:** Leonardo.AI is async — submit generation job, then poll every 5s for up to 2.5 minutes
- **Dark theme:** Glass morphism with `glass-card` CSS class, accent `#6d5aff`, no light mode
- **Next.js 15 params:** Route handlers use `const { id } = await params` pattern
- **Claude JSON parsing:** Always strip markdown code fences with `.replace(/```json\n?|\n?```/g, '').trim()`

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lhidckbjztivaeceazyi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANTHROPIC_API_KEY=<api-key>          # For Claude character/story generation
LEONARDO_API_KEY=<api-key>           # For Leonardo.AI image generation
```

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
```

## Content Strategy

This app creates TikTok photo carousels for Tex Fitness (a React Native fitness coaching app). The strategy:

1. **First person narration** — ALL stories are written as "I woke up...", "I couldn't believe..." — the character speaks directly to the viewer like a real TikTok confession
2. **Characters are fictional but hyper-realistic** — everyday people (truckers, lunch ladies, postal workers), age 30-65, never exercised before
3. **Stories follow emotional arcs** — 6-8 scenes from mundane life to breaking point to transformation
4. **NO brand names in stories** — the "discovery" scene references "this thing on my phone" or "this app I found" — NEVER name Tex Fitness or any product. The CTA is just "Link in bio."
5. **Images look like candid phone photos** — NOT polished fitness content. Grainy, imperfect, documentary-style
6. **Emotional tones drive engagement** — comeback, revenge body, quiet transformation, rock bottom, against all odds

## Gotchas

- Claude sometimes wraps JSON in code fences despite instructions — API routes strip them
- Leonardo.AI generation is async: POST to create job, poll GET until COMPLETE status (~30-150s)
- Sharp requires native binaries — Vercel handles this automatically, but may need platform-specific install locally
- Export route downloads images from URLs, processes with Sharp, then zips — can be slow for 6+ images
- The `order_index` on scenes uses a UNIQUE constraint with `story_id` — when regenerating scenes, delete old ones first
- Without API keys, all endpoints return realistic mock/fallback data for development
- Supabase uses `tex_content` schema (not `public`) — the client is pre-configured for this

## Improvement Priorities

1. **UX polish:** Loading states, error toasts, mobile responsiveness, image lazy loading
2. **Content quality:** Better prompts for more viral-worthy stories, A/B test emotional tones
3. **Image consistency:** Character consistency across scenes (seed-based generation, reference images)
4. **Batch operations:** Generate multiple stories at once, story templates, tone presets
5. **Analytics:** Track which tones/characters perform best, export history
6. **Auth:** Add Supabase auth if multi-user support is needed
7. **i18n:** French language support (primary TikTok audience is French-speaking)
