# Tex Content Studio

TikTok carousel content factory for [Tex Fitness](https://github.com/NikitaDmitrieff/tex-fitness). Generates fictional character transformation stories with AI-generated images, ready to post as TikTok photo carousels.

## How It Works

1. **Character** — AI generates a relatable, everyday character (trucker, lunch lady, postal worker) with a backstory and physical description
2. **Story Arc** — AI creates a 6-8 scene transformation journey with emotional beats and visual prompts
3. **Images** — Leonardo.AI generates candid phone-style portrait images for each scene
4. **Export** — Download a zip with processed slides (1080x1920), captions, voiceover script, and hashtags

## Tech Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS 4)
- **Supabase** (PostgreSQL, `tex_content` schema)
- **Claude API** (character + story generation via `@anthropic-ai/sdk`)
- **Leonardo.AI** (portrait image generation, photoReal v2)
- **Sharp** (image resize + caption overlay)
- **JSZip** (carousel packaging)

## Quick Start

```bash
npm install
npm run dev
```

The app works in **demo mode** without API keys — all generation endpoints return realistic fallback data.

## Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
LEONARDO_API_KEY=your-leonardo-key
```

## Database Setup

The app uses a `tex_content` schema in Supabase. Run the migration in the Supabase SQL editor:

```sql
CREATE SCHEMA IF NOT EXISTS tex_content;

CREATE TABLE tex_content.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name TEXT NOT NULL DEFAULT '',
  character_age INTEGER NOT NULL DEFAULT 35,
  character_job TEXT NOT NULL DEFAULT '',
  character_backstory TEXT NOT NULL DEFAULT '',
  character_physical TEXT NOT NULL DEFAULT '',
  emotional_tone TEXT NOT NULL DEFAULT 'comeback',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- RLS (single-user app)
ALTER TABLE tex_content.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tex_content.scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on stories" ON tex_content.stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scenes" ON tex_content.scenes FOR ALL USING (true) WITH CHECK (true);

-- Expose schema to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, storage, graphql_public, tex_content';
NOTIFY pgrst, 'reload config';
```

## Deployment

Deployed on Vercel. Push to `main` to auto-deploy. Set the environment variables in the Vercel dashboard.

## License

Private project.
