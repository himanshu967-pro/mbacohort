-- Add new columns for enhanced profile data
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS education JSONB,
ADD COLUMN IF NOT EXISTS work_experience JSONB,
ADD COLUMN IF NOT EXISTS certifications JSONB,
ADD COLUMN IF NOT EXISTS accomplishments JSONB,
ADD COLUMN IF NOT EXISTS total_experience TEXT,
ADD COLUMN IF NOT EXISTS functional_areas TEXT[];
