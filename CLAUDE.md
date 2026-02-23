# Tex Content Studio

TikTok carousel content generator for Tex Fitness. Creates transformation story carousels featuring relatable, everyday characters going through fitness journeys.

## Architecture

- **Framework:** Next.js 15 (App Router, TypeScript, Tailwind CSS 4)
- **Database:** Supabase (PostgreSQL, public schema)
- **AI Generation:** Claude API via Anthropic SDK (character + story generation)
- **Image Generation:** Leonardo.AI REST API (1080x1920 portrait images)
- **Image Processing:** Sharp (resize, caption overlay for export)
- **Export:** JSZip (package slides as downloadable zip)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Dashboard — story grid, new story button
│   ├── layout.tsx                        # Root layout — dark theme, Inter font
│   ├── globals.css                       # Glass-card utilities, status badges, TikTok preview
│   ├── story/[id]/page.tsx               # Story workspace — 4-step wizard
│   └── api/
│       ├── generate-character/route.ts   # Claude API — random character generation
│       ├── generate-story/route.ts       # Claude API — 6-8 scene story arc
│       ├── generate-images/route.ts      # Leonardo.AI — portrait image generation
│       └── export/route.ts               # Sharp + JSZip — download carousel as zip
├── components/
│   ├── StoryWorkspace.tsx                # Client-side wizard container with state
│   ├── StepIndicator.tsx                 # Step progress bar (1-4)
│   ├── CharacterStep.tsx                 # Step 1: character profile + tone selector
│   ├── StoryArcStep.tsx                  # Step 2: scene list with edit/reorder
│   ├── ImageGenerationStep.tsx           # Step 3: image generation with progress
│   ├── ExportStep.tsx                    # Step 4: preview, captions, download
│   └── NewStoryButton.tsx                # Dashboard new story CTA
└── lib/
    ├── types.ts                          # Story, Scene types + tone/status configs
    └── supabase.ts                       # Supabase client with env var check
```

## Key Patterns

- **App Router:** Server components for data fetching (dashboard, story page), client components for interactivity (wizard steps)
- **Graceful degradation:** All pages work without Supabase configured (demo/fallback data). API routes return mock data when API keys are missing.
- **API routes:** POST handlers with structured JSON responses and proper error handling
- **Dark theme:** Glass morphism design with `glass-card` CSS class, accent color (#6d5aff), status badges
- **Wizard state:** Managed in `StoryWorkspace.tsx` via React useState, passed down to step components
- **Next.js 15 params:** Route handlers use `const { id } = await params` pattern

## Environment Variables

```bash
# Supabase (optional — app works in demo mode without these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude API for character and story generation
ANTHROPIC_API_KEY=sk-ant-...

# Leonardo.AI for image generation
LEONARDO_API_KEY=your-leonardo-key
```

## Database Schema (Supabase)

```sql
create table stories (
  id uuid primary key default gen_random_uuid(),
  character_name text not null,
  character_age integer not null,
  character_job text not null,
  character_backstory text not null,
  character_physical text not null,
  emotional_tone text not null default 'comeback',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table scenes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete cascade,
  order_index integer not null,
  description text not null,
  emotional_beat text not null,
  visual_prompt text not null,
  image_url text,
  caption text,
  created_at timestamptz not null default now()
);
```

## Running Locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run linter
```

## Gotchas

- Claude sometimes wraps JSON responses in markdown code fences — API routes strip them with regex
- Leonardo.AI image generation is async: submit job, then poll for completion (up to ~2.5 min timeout)
- Sharp requires native binaries — may need platform-specific installation on some hosts
- The export route downloads images from URLs, processes with Sharp, then zips — can be slow for many images
- Without API keys, all generation endpoints return realistic mock/fallback data for development
