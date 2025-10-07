# 🚀 Phase 5 - Advanced Features Implementation Plan

**Start Date:** 2025-10-07  
**Status:** In Progress  
**Goal:** Add challenge system, collaborations, emoji reactions, and participant invitations

---

## 📋 Overview

Phase 5 builds upon the solid foundation of Phase 4 by adding social and interactive features that make the karaoke experience more engaging and collaborative.

### ✨ New Features

1. **Participant Invitation System** 🆕
2. **Challenge System** 
3. **Duets/Collaborations**
4. **Emoji Reactions & Rating System**
5. **Enhanced Queue Management**

---

## 🎯 Feature 1: Participant Invitation System (NEW)

### Concept
Allow existing participants to invite new users to join the session by sharing an invitation link or having new users join with a simplified flow.

### Components to Create

#### 1. `InviteParticipantDialog` Component
**Location:** `src/components/features/session/invite-participant-dialog.tsx`

**Features:**
- Share button in session header
- Copy invitation link to clipboard
- QR code generation for easy mobile joining
- Direct "Add Participant" button
- Show invitation link with session code

**UI Elements:**
- Dialog with tabs: "Share Link" | "Add New User"
- Copyable invitation URL
- QR code display
- Quick add form (name + emoji)

#### 2. `QuickJoinPage` Component
**Location:** `src/app/join/[code]/page.tsx`

**Features:**
- Pre-filled session code from URL
- Quick user setup (name + emoji)
- Auto-join after user creation
- "Invited by [user]" indicator

#### 3. Update `ParticipantsList` Component
**Enhancements:**
- Add "Invite" button in header
- Show who invited whom
- Welcome message for newly joined users

### Database Changes
```sql
-- Add invited_by column to session_participants
ALTER TABLE session_participants 
ADD COLUMN invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add invitation tracking
CREATE TABLE session_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  invitation_code VARCHAR(16) UNIQUE NOT NULL,
  uses_remaining INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_code ON session_invitations(invitation_code);
CREATE INDEX idx_invitations_session ON session_invitations(session_id);
```

### Implementation Steps
1. ✅ Create invitation link generator utility
2. ✅ Build InviteParticipantDialog component
3. ✅ Create QuickJoinPage route
4. ✅ Add QR code generation
5. ✅ Update ParticipantsList with invite button
6. ✅ Test multi-user invitation flow

---

## 🎯 Feature 2: Challenge System

### Concept
Users can challenge other participants to sing specific songs, creating friendly competition.

### Components to Create

#### 1. `ChallengeDialog` Component
**Location:** `src/components/features/challenge/challenge-dialog.tsx`

**Features:**
- Select participant to challenge
- Choose song from search
- Add optional message/note
- Send challenge

#### 2. `ChallengeNotification` Component
**Location:** `src/components/features/challenge/challenge-notification.tsx`

**Features:**
- Toast notification when challenged
- Accept/Decline buttons
- Show challenger and song details
- Challenge status indicator

#### 3. `ChallengesList` Component
**Location:** `src/components/features/challenge/challenges-list.tsx`

**Features:**
- Display active challenges
- Show challenge status (pending, accepted, declined, completed)
- Filter by status
- Challenge leaderboard

### Database Updates
```sql
-- Challenges tracking table
CREATE TABLE challenges (
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

CREATE INDEX idx_challenges_session ON challenges(session_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX idx_challenges_status ON challenges(status);
```

### Queue Integration
- Update `song_queue` table usage:
  - Use existing `is_challenge` field
  - Use existing `challenged_user_id` field
  - Use existing `challenge_accepted` field
- Display challenge badge on queue items
- Highlight challenged user's songs

### Implementation Steps
1. ✅ Create challenge database table and queries
2. ✅ Build ChallengeDialog component
3. ✅ Create challenge notification system
4. ✅ Add challenge badges to queue items
5. ✅ Implement accept/decline logic
6. ✅ Add real-time challenge updates
7. ✅ Test challenge flow end-to-end

---

## 🎯 Feature 3: Duets/Collaborations

### Concept
Multiple users can sing a song together as a duet or group performance.

### Components to Create

#### 1. `CollaboratorInviteDialog` Component
**Location:** `src/components/features/collaboration/collaborator-invite-dialog.tsx`

**Features:**
- Invite button on queue items
- Select participants for collaboration
- Send collaboration invites
- Show pending invitations

#### 2. `CollaboratorsList` Component
**Location:** `src/components/features/collaboration/collaborators-list.tsx`

**Features:**
- Display collaborators on queue item
- Show invitation status
- Accept/decline invitations
- Remove collaborators

#### 3. Update `QueueDisplay` Component
**Enhancements:**
- Show collaborator avatars
- "Duet" or "Group" badge
- Collaboration indicator
- Multi-user highlighting

### Database (Already Exists!)
```sql
-- Use existing song_collaborators table
-- Columns: queue_item_id, user_id, invited_by, accepted
```

### Implementation Steps
1. ✅ Build CollaboratorInviteDialog
2. ✅ Create invitation notification system
3. ✅ Update QueueDisplay with collaborator display
4. ✅ Add accept/decline logic
5. ✅ Implement real-time collaboration updates
6. ✅ Show "Duet" badges on queue
7. ✅ Test collaboration flow

---

## 🎯 Feature 4: Emoji Reactions & Rating System

### Concept
Users can react to performances in real-time with emoji reactions, creating an engaging feedback system.

### Components to Create

#### 1. `ReactionPicker` Component
**Location:** `src/components/features/reactions/reaction-picker.tsx`

**Features:**
- Emoji picker interface
- Quick reaction buttons (🔥👏❤️😂🎵⭐)
- One reaction per user per song
- Update existing reaction

#### 2. `ReactionsDisplay` Component
**Location:** `src/components/features/reactions/reactions-display.tsx`

**Features:**
- Show all reactions for a song
- Aggregate count by emoji type
- Animated reaction additions
- Top reactions highlighted

#### 3. `PerformanceRatings` Component
**Location:** `src/components/features/reactions/performance-ratings.tsx`

**Features:**
- Leaderboard of top-rated performances
- Filter by session or all-time
- Show reaction breakdown
- Award badges for achievements

### Database (Already Exists!)
```sql
-- Use existing ratings table
-- Columns: queue_item_id, user_id, emoji
```

### Real-time Features
- Supabase real-time subscription for reactions
- Animated emoji floating effect
- Live reaction count updates
- Reaction notifications

### Implementation Steps
1. ✅ Create ReactionPicker component
2. ✅ Build ReactionsDisplay component
3. ✅ Add real-time reaction updates
4. ✅ Implement reaction animations
5. ✅ Create performance leaderboard
6. ✅ Add reaction badges to queue items
7. ✅ Test real-time reactions across clients

---

## 🎯 Feature 5: Enhanced Queue Management

### Concept
Improve queue functionality with drag-and-drop reordering, voting, and better visual feedback.

### Components to Update

#### 1. Update `QueueDisplay` Component
**New Features:**
- Drag-and-drop reordering (dnd-kit library)
- Vote to skip button
- Queue position swapping
- Compact/expanded view toggle
- Filter queued vs completed songs

#### 2. `QueueControls` Component
**Location:** `src/components/features/song/queue-controls.tsx`

**Features:**
- Clear completed songs
- Shuffle queue
- Sort by: date added, duration, popularity
- Queue statistics

#### 3. `SkipVoting` Component
**Location:** `src/components/features/song/skip-voting.tsx`

**Features:**
- Vote to skip current song
- Show vote count
- Auto-skip at threshold (e.g., 50% of participants)
- Vote timeout

### Database Updates
```sql
-- Add skip voting table
CREATE TABLE skip_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_item_id UUID REFERENCES song_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(queue_item_id, user_id)
);

CREATE INDEX idx_skip_votes_queue ON skip_votes(queue_item_id);
```

### Implementation Steps
1. ✅ Install dnd-kit library
2. ✅ Add drag-and-drop to queue
3. ✅ Create skip voting system
4. ✅ Add queue controls component
5. ✅ Implement queue filtering
6. ✅ Add compact view toggle
7. ✅ Test queue management features

---

## 🗂 New File Structure

```
src/
├── components/
│   └── features/
│       ├── session/
│       │   ├── invite-participant-dialog.tsx     🆕
│       │   └── participants-list.tsx            (Updated)
│       ├── challenge/
│       │   ├── challenge-dialog.tsx             🆕
│       │   ├── challenge-notification.tsx       🆕
│       │   └── challenges-list.tsx              🆕
│       ├── collaboration/
│       │   ├── collaborator-invite-dialog.tsx   🆕
│       │   └── collaborators-list.tsx           🆕
│       ├── reactions/
│       │   ├── reaction-picker.tsx              🆕
│       │   ├── reactions-display.tsx            🆕
│       │   └── performance-ratings.tsx          🆕
│       └── song/
│           ├── queue-controls.tsx               🆕
│           ├── skip-voting.tsx                  🆕
│           └── queue-display.tsx               (Updated)
├── app/
│   └── join/
│       └── [code]/
│           └── page.tsx                         🆕
├── lib/
│   ├── invitations.ts                           🆕
│   └── qr-code.ts                               🆕
└── types/
    └── database.ts                             (Updated)
```

---

## 📦 New Dependencies

```bash
# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# QR Code generation
npm install qrcode.react

# Additional icons
npm install lucide-react # (already installed)
```

---

## 🔄 Implementation Order

### Week 1: Foundation & Invitations
1. **Day 1-2:** Participant Invitation System
   - Database migration
   - InviteParticipantDialog
   - QuickJoinPage
   - QR code integration

2. **Day 3-4:** Challenge System
   - Database setup
   - ChallengeDialog component
   - Challenge notifications
   - Accept/decline flow

3. **Day 5:** Challenge Integration
   - Queue item badges
   - Real-time updates
   - Testing

### Week 2: Collaborations & Reactions
1. **Day 1-2:** Duets/Collaborations
   - CollaboratorInviteDialog
   - CollaboratorsList
   - Queue integration
   - Real-time updates

2. **Day 3-4:** Emoji Reactions
   - ReactionPicker
   - ReactionsDisplay
   - Real-time reaction updates
   - Reaction animations

3. **Day 5:** Performance Ratings
   - Leaderboard component
   - Aggregate statistics
   - Achievement badges

### Week 3: Queue Enhancements & Polish
1. **Day 1-2:** Enhanced Queue Management
   - Drag-and-drop
   - Skip voting
   - Queue controls

2. **Day 3-4:** Polish & Testing
   - Animation improvements
   - Mobile responsiveness
   - Cross-browser testing

3. **Day 5:** Documentation & Deployment
   - Update documentation
   - Deploy to production
   - Create Phase 5 completion report

---

## 🧪 Testing Checklist

### Invitation System
- [ ] Generate invitation link
- [ ] Copy link to clipboard
- [ ] QR code displays correctly
- [ ] Quick join works with pre-filled code
- [ ] New user joins session automatically
- [ ] Invitation tracking works

### Challenge System
- [ ] Create challenge
- [ ] Receive challenge notification
- [ ] Accept challenge adds song to queue
- [ ] Decline challenge removes it
- [ ] Challenge badges display correctly
- [ ] Real-time challenge updates work

### Collaborations
- [ ] Invite collaborators
- [ ] Receive collaboration invitation
- [ ] Accept/decline invitations
- [ ] Collaborators show on queue items
- [ ] Duet badges display
- [ ] Real-time collaboration updates

### Reactions
- [ ] Add emoji reaction
- [ ] Update existing reaction
- [ ] Reactions display in real-time
- [ ] Reaction count aggregates correctly
- [ ] Leaderboard updates
- [ ] Reaction animations work

### Queue Management
- [ ] Drag-and-drop reordering
- [ ] Skip voting works
- [ ] Vote threshold triggers skip
- [ ] Queue filtering works
- [ ] Sort options function
- [ ] Clear completed songs

---

## 🎨 UI/UX Considerations

### Design Principles
1. **Non-intrusive:** Notifications shouldn't block the main experience
2. **Clear feedback:** Every action should have visual confirmation
3. **Mobile-first:** All features must work well on mobile
4. **Accessible:** Proper ARIA labels and keyboard navigation

### Animation Guidelines
- Use Framer Motion for smooth transitions
- Keep animations under 300ms
- Respect `prefers-reduced-motion`
- Animate on state changes, not constantly

### Color Coding
- **Challenges:** Orange/Amber badges
- **Collaborations:** Purple/Blue badges
- **Reactions:** Colorful emoji-based
- **Skip votes:** Red warning indicators

---

## 🚀 Success Metrics

### Phase 5 will be considered complete when:
1. ✅ All 5 major features are implemented
2. ✅ Real-time updates work across all features
3. ✅ Mobile experience is smooth
4. ✅ All tests pass
5. ✅ Documentation is updated
6. ✅ No critical bugs remain

---

## 📚 Resources

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [QRCode.react](https://github.com/zpao/qrcode.react)
- [Framer Motion](https://www.framer.com/motion/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## 🎯 Next Steps

Ready to start? Let's begin with:
1. Installing new dependencies
2. Creating database migrations
3. Building the Invitation System first (most requested feature)
4. Then moving to Challenge System

Let's make Phase 5 amazing! 🎤🎶✨
