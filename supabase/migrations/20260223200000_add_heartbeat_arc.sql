-- Add heartbeat arc columns to tex_content.stories table
ALTER TABLE tex_content.stories
  ADD COLUMN IF NOT EXISTS heartbeat_arc JSONB,
  ADD COLUMN IF NOT EXISTS arc_template_used VARCHAR;
