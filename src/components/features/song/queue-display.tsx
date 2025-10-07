'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Play, Trash2, Music2 } from 'lucide-react'

interface QueueItemWithDetails {
  id: string
  queue_position: number
  status: string
  song: {
    id: string
    title: string
    artist: string | null
    thumbnail_url: string | null
    youtube_id: string
    duration: number | null
  }
  user: {
    id: string
    display_name: string
    avatar_emoji: string
  }
}

interface QueueDisplayProps {
  sessionId: string
  onPlaySong?: (queueItemId: string, youtubeId: string) => void
}

export function QueueDisplay({ sessionId, onPlaySong }: QueueDisplayProps) {
  const [queue, setQueue] = useState<QueueItemWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial queue
    const fetchQueue = async () => {
      const { data, error } = await supabase
        .from('song_queue')
        .select(`
          id,
          queue_position,
          status,
          song:songs(id, title, artist, thumbnail_url, youtube_id, duration),
          user:users!song_queue_requested_by_fkey(id, display_name, avatar_emoji)
        `)
        .eq('session_id', sessionId)
        .order('queue_position', { ascending: true })

      if (error) {
        console.error('Error fetching queue:', error)
        setIsLoading(false)
        return
      }

      setQueue(data as any)
      setIsLoading(false)
    }

    fetchQueue()

    // Subscribe to queue changes
    const channel = supabase
      .channel(`song_queue:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'song_queue',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch queue on any change
          fetchQueue()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId])

  const handlePlay = (item: QueueItemWithDetails) => {
    onPlaySong?.(item.id, item.song.youtube_id)
  }

  const handleRemove = async (itemId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('song_queue')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      toast({
        title: 'Song removed',
        description: 'Song removed from queue',
      })
    } catch (error) {
      console.error('Error removing song:', error)
      toast({
        title: 'Failed to remove',
        description: 'Unable to remove song from queue',
        variant: 'destructive',
      })
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const queuedSongs = queue.filter((item) => item.status === 'queued')
  const playingSong = queue.find((item) => item.status === 'playing')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Queue</CardTitle>
          <Badge variant="secondary">{queuedSongs.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Queue is empty</p>
              <p className="text-sm mt-1">Add songs to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    item.status === 'playing'
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  } transition-colors`}
                >
                  <div className="flex gap-3">
                    {/* Position/Status */}
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-muted text-sm font-medium">
                      {item.status === 'playing' ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Thumbnail */}
                    {item.song.thumbnail_url && (
                      <img
                        src={item.song.thumbnail_url}
                        alt={item.song.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.song.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.song.artist || 'Unknown Artist'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.user.avatar_emoji} {item.user.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {formatDuration(item.song.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {item.status === 'queued' && index === 0 && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handlePlay(item)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {item.status !== 'playing' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {item.status === 'playing' && (
                    <Badge variant="default" className="mt-2 text-xs">
                      Now Playing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
