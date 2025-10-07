'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Play, Pause, SkipForward, Volume2 } from 'lucide-react'

interface VideoPlayerProps {
  sessionId: string
  currentVideoId: string | null
  currentQueueItemId: string | null
  onVideoEnd?: () => void
}

export function VideoPlayer({
  sessionId,
  currentVideoId,
  currentQueueItemId,
  onVideoEnd,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true)
      }
    } else {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isReady || !currentVideoId) return

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy()
    }

    // Create new player
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: currentVideoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false)
          } else if (event.data === window.YT.PlayerState.ENDED) {
            handleVideoEnd()
          }
        },
      },
    })

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [isReady, currentVideoId])

  const handleVideoEnd = async () => {
    if (!currentQueueItemId) return

    try {
      const supabase = createClient()

      // Mark current song as completed
      await supabase
        .from('song_queue')
        .update({ status: 'completed', played_at: new Date().toISOString() })
        .eq('id', currentQueueItemId)

      toast({
        title: 'Song completed',
        description: 'Moving to next song...',
      })

      onVideoEnd?.()
    } catch (error) {
      console.error('Error completing song:', error)
    }
  }

  const handlePlayPause = () => {
    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const handleSkip = () => {
    handleVideoEnd()
  }

  if (!currentVideoId) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-4xl">🎤</div>
              <p className="text-muted-foreground">No song playing</p>
              <p className="text-sm text-muted-foreground">
                Add songs to the queue and hit play!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Now Playing</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePlayPause}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleSkip}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <div id="youtube-player" className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
