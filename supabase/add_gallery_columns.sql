-- Add enhanced gallery columns for Cloudinary integration
-- Run this in Supabase SQL Editor

-- Add new columns for Cloudinary metadata
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS uploader_name TEXT;

-- Create index on public_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_gallery_public_id ON gallery(public_id);

-- Add RLS policy for authenticated users to insert
CREATE POLICY "Authenticated users can insert gallery images" ON gallery
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add policy for users to delete their own images
CREATE POLICY "Users can delete own gallery images" ON gallery
  FOR DELETE USING (auth.uid() = uploaded_by);
