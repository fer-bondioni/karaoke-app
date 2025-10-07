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
  invited_by: string | null
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

// Extended types with relations for easier data handling
export type QueueItemWithDetails = QueueItem & {
  song: Song
  requester: User
  challenged_user?: User | null
  collaborators?: (SongCollaborator & { user: User })[]
  ratings?: Rating[]
}

export type SessionWithDetails = Session & {
  host: User
  participants: SessionParticipant[]
  queue: QueueItemWithDetails[]
}

// Phase 5 Types

export type SessionInvitation = {
  id: string
  session_id: string
  invited_by: string
  invitation_code: string
  uses_remaining: number | null
  expires_at: string | null
  created_at: string
}

export type Challenge = {
  id: string
  session_id: string
  challenger_id: string
  challenged_id: string
  song_id: string
  queue_item_id: string | null
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  message: string | null
  created_at: string
  responded_at: string | null
  completed_at: string | null
}

export type ChallengeWithDetails = Challenge & {
  challenger: User
  challenged: User
  song: Song
  queue_item?: QueueItem | null
}

export type SkipVote = {
  id: string
  queue_item_id: string
  user_id: string
  session_id: string
  created_at: string
}

export type SkipVoteWithUser = SkipVote & {
  user: User
}
