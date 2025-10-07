'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useSessionStore } from '@/stores/session-store'
import { useUserStore } from '@/stores/user-store'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@/types/database'
import { ParticipantsList } from '@/components/features/session/participants-list'
import { SongSearch } from '@/components/features/song/song-search'
import { QueueDisplay } from '@/components/features/song/queue-display'
import { VideoPlayer } from '@/components/features/song/video-player'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [currentQueueItemId, setCurrentQueueItemId] = useState<string | null>(null)
  const [queueKey, setQueueKey] = useState(0)
  const user = useUserStore((state) => state.user)
  const currentSession = useSessionStore((state) => state.currentSession)
  const setCurrentSession = useSessionStore((state) => state.setSession)

  useEffect(() => {
    const loadSession = async () => {
      if (!user) {
        router.push('/')
        return
      }

      try {
        const supabase = createClient()

        // Fetch session details
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code.toUpperCase())
          .eq('is_active', true)
          .single()

        if (error || !data) {
          console.error('Session not found:', error)
          router.push('/')
          return
        }

        setSession(data)
        setCurrentSession(data)
      } catch (error) {
        console.error('Error loading session:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [code, user, router, setCurrentSession])

  const handlePlaySong = useCallback(async (queueItemId: string, youtubeId: string) => {
    try {
      const supabase = createClient()

      // Mark current song as playing
      await supabase
        .from('song_queue')
        .update({ status: 'playing' })
        .eq('id', queueItemId)

      setCurrentVideoId(youtubeId)
      setCurrentQueueItemId(queueItemId)
    } catch (error) {
      console.error('Error starting song:', error)
    }
  }, [])

  const handleVideoEnd = useCallback(() => {
    setCurrentVideoId(null)
    setCurrentQueueItemId(null)
    setQueueKey(prev => prev + 1)
  }, [])

  const handleSongAdded = useCallback(() => {
    setQueueKey(prev => prev + 1)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl">{session.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>Session Code:</span>
                  <Badge variant="secondary" className="font-mono text-lg">
                    {session.code}
                  </Badge>
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push('/')}>
                Leave Session
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Area */}
          <div className="lg:col-span-2">
            <VideoPlayer
              sessionId={session.id}
              currentVideoId={currentVideoId}
              currentQueueItemId={currentQueueItemId}
              onVideoEnd={handleVideoEnd}
            />
          </div>

          {/* Participants & Queue */}
          <div className="space-y-6">
            {/* Participants */}
            <ParticipantsList 
              sessionId={session.id}
              sessionCode={session.code}
              sessionName={session.name}
            />

            {/* Queue */}
            <QueueDisplay
              key={queueKey}
              sessionId={session.id}
              onPlaySong={handlePlaySong}
            />
          </div>
        </div>

        {/* Song Search */}
        <SongSearch sessionId={session.id} onSongAdded={handleSongAdded} />
      </div>
    </div>
  )
}
