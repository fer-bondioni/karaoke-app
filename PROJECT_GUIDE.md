# Karaoke App - Step-by-Step Development Guide

## 📋 Project Overview
A collaborative karaoke app where users can create sessions, queue songs, challenge friends, and rate performances with emojis.

## 🛠 Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend/Database**: Supabase (PostgreSQL + Realtime + Auth)
- **APIs**: YouTube Data API v3, Spotify Web API (optional)
- **Deployment**: Vercel
- **Version Control**: GitHub
- **Additional Suggestions**:
  - **React Query (TanStack Query)**: For server state management and caching
  - **Framer Motion**: For smooth animations and transitions
  - **Zod**: For schema validation
  - **React Hook Form**: For form handling
  - **Socket.io or Supabase Realtime**: For live updates during sessions

---

## 🎯 Phase 1: Project Setup & Foundation (Week 1)

### Step 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest karaoke-app --typescript --tailwind --app
cd karaoke-app
```

**Configuration choices:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router
- ✅ Import alias (@/*)

### Step 1.2: Install Core Dependencies
```bash
# UI Components
npx shadcn-ui@latest init

# State Management
npm install zustand

# Data Fetching & Caching
npm install @tanstack/react-query

# Form Handling & Validation
npm install react-hook-form zod @hookform/resolvers

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Animations
npm install framer-motion

# Utilities
npm install clsx tailwind-merge date-fns uuid
npm install -D @types/uuid

# YouTube API
npm install axios
```

### Step 1.3: Install shadcn/ui Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
```

### Step 1.4: Setup Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for admin operations)

### Step 1.5: Configure Environment Variables
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# YouTube API
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key

# Spotify (Optional)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 1.6: Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial project setup"
gh repo create karaoke-app --public --source=. --remote=origin
git push -u origin main
```

---

## 🗄 Phase 2: Database Design & Setup (Week 1-2)

### Step 2.1: Design Database Schema
Create `/supabase/schema.sql`:

```sql
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
  code VARCHAR(8) UNIQUE NOT NULL, -- Short shareable code
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
  duration INTEGER, -- in seconds
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
  status VARCHAR(20) DEFAULT 'queued', -- queued, playing, completed, skipped
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
  emoji VARCHAR(10) NOT NULL, -- 🔥, 👏, 😂, ❤️, 🎵, etc.
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

-- RLS Policies (Allow all for anonymous users - they authenticate via display name)
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

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 2.2: Setup Supabase Client
Create `/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### Step 2.3: Create TypeScript Types
Create `/types/database.ts`:
```typescript
export type User = {
  id: string
  display_name: string
  avatar_emoji: string
  created_at: string
  last_seen: string
}

export type Session = {
  id: string
  name: string
  code: string
  host_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SessionParticipant = {
  id: string
  session_id: string
  user_id: string
  joined_at: string
}

export type Song = {
  id: string
  youtube_id: string
  title: string
  artist: string | null
  genre: string | null
  decade: number | null
  year: number | null
  duration: number | null
  thumbnail_url: string | null
  created_at: string
}

export type QueueItem = {
  id: string
  session_id: string
  song_id: string
  requested_by: string
  queue_position: number
  status: 'queued' | 'playing' | 'completed' | 'skipped'
  is_challenge: boolean
  challenged_user_id: string | null
  challenge_accepted: boolean | null
  created_at: string
  played_at: string | null
}

export type SongCollaborator = {
  id: string
  queue_item_id: string
  user_id: string
  invited_by: string
  accepted: boolean
  created_at: string
}

export type Rating = {
  id: string
  queue_item_id: string
  user_id: string
  emoji: string
  created_at: string
}
```

---

## 🎨 Phase 3: Core UI Components (Week 2)

### Step 3.1: Setup Layout Structure
Create `/app/layout.tsx`:
```typescript
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Karaoke Night',
  description: 'Sing together, challenge friends, and have fun!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

### Step 3.2: Create Providers Component
Create `/components/providers.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Step 3.3: Build Key UI Components
These will be created in the `/components` directory:

1. **UserSetup Component** - Name entry and emoji selection
2. **SessionCreator Component** - Create new session
3. **SessionJoiner Component** - Join by code
4. **SessionView Component** - Main session interface
5. **SongSearch Component** - Search YouTube
6. **QueueDisplay Component** - Show current queue
7. **VideoPlayer Component** - YouTube embed
8. **ChallengeDialog Component** - Challenge users
9. **RatingPanel Component** - Emoji reactions
10. **ParticipantsList Component** - Show who's in session

---

## 🔧 Phase 4: State Management with Zustand (Week 3)

### Step 4.1: Create User Store
Create `/stores/user-store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types/database'

interface UserState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'karaoke-user-storage',
    }
  )
)
```

### Step 4.2: Create Session Store
Create `/stores/session-store.ts`:
```typescript
import { create } from 'zustand'
import { Session, QueueItem, User } from '@/types/database'

interface SessionState {
  currentSession: Session | null
  participants: User[]
  queue: QueueItem[]
  currentlyPlaying: QueueItem | null
  setSession: (session: Session) => void
  setParticipants: (participants: User[]) => void
  setQueue: (queue: QueueItem[]) => void
  setCurrentlyPlaying: (item: QueueItem | null) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  participants: [],
  queue: [],
  currentlyPlaying: null,
  setSession: (session) => set({ currentSession: session }),
  setParticipants: (participants) => set({ participants }),
  setQueue: (queue) => set({ queue }),
  setCurrentlyPlaying: (item) => set({ currentlyPlaying: item }),
  clearSession: () => set({
    currentSession: null,
    participants: [],
    queue: [],
    currentlyPlaying: null,
  }),
}))
```

---

## 🔌 Phase 5: API Integration (Week 3-4)

### Step 5.1: Setup YouTube API Service
Create `/lib/youtube.ts`:
```typescript
import axios from 'axios'

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

export interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
}

export async function searchYouTubeKaraoke(
  query: string,
  filters?: {
    genre?: string
    decade?: number
    year?: number
  }
): Promise<YouTubeVideo[]> {
  let searchQuery = `${query} karaoke`
  
  if (filters?.genre) searchQuery += ` ${filters.genre}`
  if (filters?.year) searchQuery += ` ${filters.year}`
  
  const response = await axios.get(
    'https://www.googleapis.com/youtube/v3/search',
    {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 20,
        key: YOUTUBE_API_KEY,
      },
    }
  )

  // Get video details for duration
  const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',')
  const detailsResponse = await axios.get(
    'https://www.googleapis.com/youtube/v3/videos',
    {
      params: {
        part: 'contentDetails',
        id: videoIds,
        key: YOUTUBE_API_KEY,
      },
    }
  )

  return response.data.items.map((item: any, index: number) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: parseDuration(detailsResponse.data.items[index].contentDetails.duration),
  }))
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  const hours = parseInt(match?.[1] || '0') || 0
  const minutes = parseInt(match?.[2] || '0') || 0
  const seconds = parseInt(match?.[3] || '0') || 0
  return hours * 3600 + minutes * 60 + seconds
}
```

### Step 5.2: Create API Routes
Create `/app/api/youtube/search/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { searchYouTubeKaraoke } from '@/lib/youtube'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const genre = searchParams.get('genre')
  const year = searchParams.get('year')

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const results = await searchYouTubeKaraoke(query, {
      genre: genre || undefined,
      year: year ? parseInt(year) : undefined,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: 'Failed to search YouTube' },
      { status: 500 }
    )
  }
}
```

---

## 🚀 Phase 6: Core Features Implementation (Week 4-6)

### Step 6.1: User Authentication Flow
1. Landing page with name entry
2. Avatar emoji selection
3. Store user in Supabase
4. Persist in Zustand store

### Step 6.2: Session Management
1. Create session with unique code
2. Share session code
3. Join session by code
4. Real-time participant updates using Supabase Realtime

### Step 6.3: Song Queue System
1. Search and add songs
2. Display queue with positions
3. Drag-and-drop reordering
4. Mark as playing/completed
5. Auto-advance queue

### Step 6.4: Video Player Integration
1. YouTube iframe embed
2. Player controls
3. Sync playback state across users
4. Auto-play next in queue

### Step 6.5: Challenge System
1. Select user to challenge
2. Send challenge invitation
3. Accept/decline challenges
4. Display challenges in UI

### Step 6.6: Collaboration/Duets
1. Invite users to sing together
2. Show collaborators on queue items
3. Accept/decline invitations

### Step 6.7: Rating System
1. Emoji reaction picker
2. Display reactions in real-time
3. Aggregate ratings per performance

---

## 📱 Phase 7: Real-time Features (Week 6-7)

### Step 7.1: Setup Supabase Realtime
Create `/lib/realtime.ts`:
```typescript
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function subscribeToSession(
  sessionId: string,
  callbacks: {
    onParticipantJoined?: (participant: any) => void
    onParticipantLeft?: (participant: any) => void
    onQueueUpdated?: (queue: any) => void
    onNowPlaying?: (item: any) => void
    onRatingAdded?: (rating: any) => void
  }
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => callbacks.onParticipantJoined?.(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => callbacks.onParticipantLeft?.(payload.old)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'song_queue',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => callbacks.onQueueUpdated?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ratings',
      },
      (payload) => callbacks.onRatingAdded?.(payload.new)
    )
    .subscribe()

  return channel
}
```

### Step 7.2: Implement Real-time Updates in Components
- Subscribe to session changes on mount
- Update local state when changes occur
- Unsubscribe on unmount

---

## 🎭 Phase 8: UI/UX Polish (Week 7-8)

### Step 8.1: Animations
- Page transitions with Framer Motion
- Queue item animations
- Emoji reaction animations
- Loading states

### Step 8.2: Responsive Design
- Mobile-first approach
- Tablet optimizations
- Desktop layout

### Step 8.3: Dark Mode (Optional)
- Theme toggle
- Color scheme definitions

### Step 8.4: Error Handling
- Toast notifications
- Error boundaries
- Retry mechanisms

---

## 🧪 Phase 9: Testing (Week 8)

### Step 9.1: Setup Testing Tools
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
npm install -D @playwright/test
```

### Step 9.2: Write Tests
1. Unit tests for utilities
2. Component tests
3. Integration tests
4. E2E tests with Playwright

---

## 🚀 Phase 10: Deployment (Week 9)

### Step 10.1: Prepare for Production
1. Environment variables in Vercel
2. Database optimization
3. Performance testing
4. Security audit

### Step 10.2: Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 10.3: Setup Custom Domain (Optional)
Configure in Vercel dashboard

### Step 10.4: Monitoring
- Vercel Analytics
- Error tracking (Sentry)
- User feedback collection

---

## 📚 Phase 11: Documentation (Week 9)

### Create Documentation Files:
1. `README.md` - Project overview, setup instructions
2. `CONTRIBUTING.md` - Contribution guidelines
3. `API.md` - API documentation
4. `DEPLOYMENT.md` - Deployment guide

---

## 🎯 Feature Roadmap (Post-MVP)

### Phase 12: Enhanced Features
1. **Leaderboards**: Track best performers
2. **Playlists**: Save favorite songs
3. **Voting System**: Vote to skip songs
4. **Recording**: Record and save performances
5. **Profiles**: User profiles with stats
6. **Badges/Achievements**: Gamification
7. **Themes**: Custom session themes
8. **Chat**: Text chat during sessions
9. **Audio Effects**: Voice modulation (pitch, reverb)
10. **Mobile Apps**: React Native version
11. **Spotify Integration**: Expanded music search
12. **Social Sharing**: Share performances on social media

---

## 💡 Best Practices to Follow

### Code Organization
```
/app
  /api
  /(routes)
    /session/[code]
/components
  /ui (shadcn)
  /features
    /session
    /queue
    /player
/lib
  /supabase
  /youtube
  /utils
/stores
/types
/hooks
```

### Git Workflow
- Feature branches
- Conventional commits
- Pull request reviews
- Continuous integration

### Performance
- Code splitting
- Image optimization
- Lazy loading
- Caching strategies

### Security
- Input validation
- SQL injection prevention
- XSS protection
- Rate limiting on API routes

---

## 📋 Weekly Milestones

**Week 1-2**: Setup + Database
**Week 3-4**: Core features + API integration
**Week 5-6**: Advanced features (challenges, ratings)
**Week 7-8**: UI polish + Real-time
**Week 9**: Testing + Deployment
**Week 10+**: Iterations based on feedback

---

## 🔗 Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand)

---

## 🎉 Getting Started

Start with Phase 1 and work through each step systematically. Don't rush - focus on building a solid foundation before adding advanced features. Test frequently and iterate based on feedback.

Good luck with your karaoke app! 🎤🎶
