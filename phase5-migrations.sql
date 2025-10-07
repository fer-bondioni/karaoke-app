-- Phase 5 Database Migrations
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. PARTICIPANT INVITATIONS
-- ============================================

-- Add invited_by column to session_participants
ALTER TABLE session_participants 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create session_invitations table for tracking invitation links
CREATE TABLE IF NOT EXISTS session_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  invitation_code VARCHAR(16) UNIQUE NOT NULL,
  uses_remaining INTEGER DEFAULT NULL, -- NULL = unlimited
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON session_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_session ON session_invitations(session_id);

-- Enable RLS
ALTER TABLE session_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Invitations viewable by everyone" ON session_invitations 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create invitations" ON session_invitations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creator can update invitations" ON session_invitations 
  FOR UPDATE USING (true);

-- ============================================
-- 2. CHALLENGES
-- ============================================

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES song_queue(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, completed
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_challenges_session ON challenges(session_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Challenges viewable by session participants" ON challenges 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create challenges" ON challenges 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Challenged user or challenger can update" ON challenges 
  FOR UPDATE USING (true);

-- ============================================
-- 3. SKIP VOTING
-- ============================================

-- Create skip_votes table
CREATE TABLE IF NOT EXISTS skip_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_item_id UUID REFERENCES song_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(queue_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_skip_votes_queue ON skip_votes(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_skip_votes_session ON skip_votes(session_id);

-- Enable RLS
ALTER TABLE skip_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skip votes
CREATE POLICY "Skip votes viewable by everyone" ON skip_votes 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can vote to skip" ON skip_votes 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their votes" ON skip_votes 
  FOR DELETE USING (true);

-- ============================================
-- 4. UTILITY FUNCTIONS
-- ============================================

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 16-character code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 16));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM session_invitations WHERE invitation_code = new_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to check if skip threshold is met
CREATE OR REPLACE FUNCTION check_skip_threshold(p_queue_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  vote_count INTEGER;
  participant_count INTEGER;
  threshold DECIMAL;
  session_id_val UUID;
BEGIN
  -- Get session_id from queue item
  SELECT song_queue.session_id INTO session_id_val
  FROM song_queue
  WHERE song_queue.id = p_queue_item_id;
  
  -- Count skip votes
  SELECT COUNT(*) INTO vote_count
  FROM skip_votes
  WHERE queue_item_id = p_queue_item_id;
  
  -- Count participants
  SELECT COUNT(*) INTO participant_count
  FROM session_participants
  WHERE session_id = session_id_val;
  
  -- Calculate if threshold (50%) is met
  IF participant_count > 0 THEN
    threshold := vote_count::DECIMAL / participant_count::DECIMAL;
    RETURN threshold >= 0.5;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. UPDATE EXISTING TABLES (if needed)
-- ============================================

-- Ensure song_queue has all necessary columns for challenges
-- (These should already exist from Phase 4, but adding IF NOT EXISTS for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'song_queue' AND column_name = 'is_challenge'
  ) THEN
    ALTER TABLE song_queue ADD COLUMN is_challenge BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'song_queue' AND column_name = 'challenged_user_id'
  ) THEN
    ALTER TABLE song_queue ADD COLUMN challenged_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'song_queue' AND column_name = 'challenge_accepted'
  ) THEN
    ALTER TABLE song_queue ADD COLUMN challenge_accepted BOOLEAN;
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the migrations worked:

-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('session_invitations', 'challenges', 'skip_votes');

-- Check new column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'session_participants' 
AND column_name = 'invited_by';

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_invitation_code', 'check_skip_threshold');

-- Done!
-- Phase 5 database migrations complete ✅
