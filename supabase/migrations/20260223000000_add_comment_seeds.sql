-- Add comment_seeds column to tex_content.stories table
ALTER TABLE tex_content.stories
  ADD COLUMN IF NOT EXISTS comment_seeds JSONB;
