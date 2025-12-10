-- MBA Cohort Website - Database Schema
-- Run this in your Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile_picture TEXT,
  linkedin_url TEXT,
  domain TEXT,
  specialization TEXT,
  company TEXT,
  phone TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain);

-- ============================================
-- INTERVIEW EXPERIENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interview_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  domain TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_experiences_user ON interview_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_company ON interview_experiences(company);
CREATE INDEX IF NOT EXISTS idx_experiences_domain ON interview_experiences(domain);

-- ============================================
-- VOTES TABLE (for upvote/downvote tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES interview_experiences(id) ON DELETE CASCADE,
  is_upvote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, experience_id)
);

-- ============================================
-- RESUMES TABLE (Golden CV Repository)
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  target_company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_domain ON resumes(domain);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  event_type TEXT DEFAULT 'other',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT,
  external_url TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- ============================================
-- GALLERY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_album ON gallery(album_name);

-- ============================================
-- OPPORTUNITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  type TEXT DEFAULT 'full-time',
  description TEXT NOT NULL,
  application_url TEXT,
  deadline TIMESTAMPTZ,
  posted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMENTS TABLE (for events and announcements)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_type TEXT NOT NULL, -- 'event' or 'announcement'
  parent_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_type, parent_id);

-- ============================================
-- KUDOS TABLE (for feedback wall)
-- ============================================
CREATE TABLE IF NOT EXISTS kudos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'appreciation', -- 'appreciation', 'thank you', 'shoutout'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kudos_to_user ON kudos(to_user_id);
CREATE INDEX IF NOT EXISTS idx_kudos_from_user ON kudos(from_user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users: All authenticated users can read, users can update their own profile
CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Interview Experiences: All can read, users can manage their own
CREATE POLICY "Experiences viewable by all authenticated" ON interview_experiences
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert experiences" ON interview_experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiences" ON interview_experiences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiences" ON interview_experiences
  FOR DELETE USING (auth.uid() = user_id);

-- Votes: Users can manage their own votes
CREATE POLICY "Votes viewable by all authenticated" ON votes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- Resumes: All can read, users can manage their own
CREATE POLICY "Resumes viewable by all authenticated" ON resumes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Events, Announcements, Resources, Gallery, Opportunities: Read for all
CREATE POLICY "Events viewable by all authenticated" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Announcements viewable by all authenticated" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create announcements" ON announcements
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Resources viewable by all authenticated" ON resources
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gallery viewable by all authenticated" ON gallery
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Opportunities viewable by all authenticated" ON opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Feedback: Users can insert, only admins can read
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Feedback viewable by admins" ON feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Comments: All authenticated can read, users can manage their own
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by all authenticated" ON comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Kudos: All authenticated can read, users can create
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kudos viewable by all authenticated" ON kudos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create kudos" ON kudos
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Run these in Supabase Dashboard > Storage

-- 1. Create 'resumes' bucket for CV uploads
-- 2. Create 'gallery' bucket for images  
-- 3. Create 'resources' bucket for study materials
-- 4. Create 'avatars' bucket for profile pictures

-- Storage policies should allow:
-- - Authenticated users to upload to their own folder
-- - All authenticated users to download files

-- ============================================
-- SAMPLE ADMIN USER (Replace with your email)
-- ============================================
-- INSERT INTO users (id, email, name, is_admin)
-- VALUES (
--   'your-supabase-auth-user-id',
--   'your-email@example.com',
--   'Admin Name',
--   true
-- );
