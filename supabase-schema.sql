-- Karaoke App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (anonymous users with display names)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  display_name VARCHAR(50) NOT NULL,
  avatar_emoji VARCHAR(10) DEFAULT '🎤',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Karaoke sessions
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Songs library (cached from YouTube/Spotify)
CREATE TABLE songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  youtube_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  genre VARCHAR(50),
  decade INTEGER,
  year INTEGER,
  duration INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Song queue for sessions
CREATE TABLE song_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  queue_position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  is_challenge BOOLEAN DEFAULT false,
  challenged_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  challenge_accepted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  played_at TIMESTAMP WITH TIME ZONE
);

-- Collaborators on a song (duets, group performances)
CREATE TABLE song_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_item_id UUID REFERENCES song_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings/Reactions
CREATE TABLE ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_item_id UUID REFERENCES song_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(queue_item_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_active ON sessions(is_active);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_song_queue_session ON song_queue(session_id);
CREATE INDEX idx_song_queue_status ON song_queue(status);
CREATE INDEX idx_songs_youtube ON songs(youtube_id);
CREATE INDEX idx_ratings_queue_item ON ratings(queue_item_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for anonymous users)
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update themselves" ON users FOR UPDATE USING (true);

CREATE POLICY "Sessions are viewable by everyone" ON sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Host can update session" ON sessions FOR UPDATE USING (true);

CREATE POLICY "Participants viewable by everyone" ON session_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join sessions" ON session_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can leave" ON session_participants FOR DELETE USING (true);

CREATE POLICY "Songs viewable by everyone" ON songs FOR SELECT USING (true);
CREATE POLICY "Anyone can add songs" ON songs FOR INSERT WITH CHECK (true);

CREATE POLICY "Queue viewable by everyone" ON song_queue FOR SELECT USING (true);
CREATE POLICY "Anyone can add to queue" ON song_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Queue items updatable by everyone" ON song_queue FOR UPDATE USING (true);

CREATE POLICY "Collaborators viewable by everyone" ON song_collaborators FOR SELECT USING (true);
CREATE POLICY "Anyone can invite collaborators" ON song_collaborators FOR INSERT WITH CHECK (true);
CREATE POLICY "Collaborators can update" ON song_collaborators FOR UPDATE USING (true);

CREATE POLICY "Ratings viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can rate" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their ratings" ON ratings FOR UPDATE USING (true);

-- Function to generate unique session codes
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  done BOOL;
BEGIN
  done := false;
  WHILE NOT done LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    done := NOT EXISTS(SELECT 1 FROM sessions WHERE sessions.code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sessions updated_at
CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set queue position
CREATE OR REPLACE FUNCTION set_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.queue_position IS NULL THEN
    SELECT COALESCE(MAX(queue_position), 0) + 1
    INTO NEW.queue_position
    FROM song_queue
    WHERE session_id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto queue position
CREATE TRIGGER auto_queue_position
  BEFORE INSERT ON song_queue
  FOR EACH ROW
  EXECUTE FUNCTION set_queue_position();
