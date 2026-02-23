-- Create series_bibles table in tex_content schema
CREATE TABLE IF NOT EXISTS tex_content.series_bibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES tex_content.characters(id) ON DELETE CASCADE,
  episodes JSONB NOT NULL DEFAULT '[]',
  linked_story_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by character
CREATE INDEX IF NOT EXISTS series_bibles_character_id_idx ON tex_content.series_bibles (character_id);

-- Enable RLS
ALTER TABLE tex_content.series_bibles ENABLE ROW LEVEL SECURITY;

-- Permissive policy for app access
CREATE POLICY "allow_all_series_bibles" ON tex_content.series_bibles
  FOR ALL
  USING (true)
  WITH CHECK (true);
