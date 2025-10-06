import { createClient } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface SessionCallbacks {
  onParticipantJoined?: (participant: any) => void
  onParticipantLeft?: (participant: any) => void
  onQueueUpdated?: (payload: any) => void
  onNowPlaying?: (item: any) => void
  onRatingAdded?: (rating: any) => void
}

export function subscribeToSession(
  sessionId: string,
  callbacks: SessionCallbacks
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

export function unsubscribeFromSession(channel: RealtimeChannel) {
  channel.unsubscribe()
}
