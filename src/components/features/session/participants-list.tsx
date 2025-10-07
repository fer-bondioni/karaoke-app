'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { useUserStore } from '@/stores/user-store'
import { InviteParticipantDialog } from './invite-participant-dialog'

interface ParticipantsListProps {
  sessionId: string
  sessionCode: string
  sessionName: string
}

export function ParticipantsList({ sessionId }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const currentUser = useUserStore((state) => state.user)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial participants
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('session_participants')
        .select('user_id, users(*)') 
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error fetching participants:', error)
        setIsLoading(false)
        return
      }

      // Extract users from the joined data
      const users = data
        .map((p: any) => p.users)
        .filter(Boolean) as User[]

      setParticipants(users)
      setIsLoading(false)
    }

    fetchParticipants()

    // Subscribe to participant changes
    const channel = supabase
      .channel(`session_participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the new user's data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          if (userData) {
            setParticipants((prev) => {
              // Avoid duplicates
              if (prev.some(p => p.id === userData.id)) return prev
              return [...prev, userData]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setParticipants((prev) =>
            prev.filter((p) => p.id !== payload.old.user_id)
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Participants</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{participants.length}</Badge>
            <InviteParticipantDialog 
              sessionCode={sessionCode}
              sessionName={sessionName}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl">{participant.avatar_emoji}</span>
                <span className="text-sm font-medium flex-1">
                  {participant.display_name}
                </span>
                {currentUser?.id === participant.id && (
                  <Badge variant="outline" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
