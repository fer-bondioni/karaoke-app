'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { toast } from '@/hooks/use-toast'
import { Search, Plus, Music } from 'lucide-react'

interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
}

interface SongSearchProps {
  sessionId: string
  onSongAdded?: () => void
}

export function SongSearch({ sessionId, onSongAdded }: SongSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeVideo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const user = useUserStore((state) => state.user)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      toast({
        title: 'Search query required',
        description: 'Please enter a song name or artist',
        variant: 'destructive',
      })
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data)

      if (data.length === 0) {
        toast({
          title: 'No results',
          description: 'Try a different search term',
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Search failed',
        description: 'Unable to search for songs. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddToQueue = async (video: YouTubeVideo) => {
    if (!user) return

    setAddingIds((prev) => new Set(prev).add(video.id))

    try {
      const supabase = createClient()

      // Check if song exists in library
      let { data: existingSong } = await supabase
        .from('songs')
        .select('id')
        .eq('youtube_id', video.id)
        .single()

      let songId: string

      if (!existingSong) {
        // Add song to library
        const { data: newSong, error: songError } = await supabase
          .from('songs')
          .insert({
            youtube_id: video.id,
            title: video.title,
            artist: video.artist,
            duration: video.duration,
            thumbnail_url: video.thumbnail,
          })
          .select()
          .single()

        if (songError) throw songError
        songId = newSong.id
      } else {
        songId = existingSong.id
      }

      // Get current max queue position
      const { data: queueData } = await supabase
        .from('song_queue')
        .select('queue_position')
        .eq('session_id', sessionId)
        .order('queue_position', { ascending: false })
        .limit(1)

      const nextPosition = queueData && queueData.length > 0 
        ? queueData[0].queue_position + 1 
        : 0

      // Add to queue
      const { error: queueError } = await supabase
        .from('song_queue')
        .insert({
          session_id: sessionId,
          song_id: songId,
          requested_by: user.id,
          queue_position: nextPosition,
          status: 'queued',
        })

      if (queueError) throw queueError

      toast({
        title: 'Song added!',
        description: `${video.title} added to queue`,
      })

      onSongAdded?.()
    } catch (error) {
      console.error('Error adding song:', error)
      toast({
        title: 'Failed to add song',
        description: 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(video.id)
        return next
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Songs</CardTitle>
        <CardDescription>Search for karaoke songs on YouTube</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for a song or artist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? (
              <>Searching...</>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </form>

        {/* Results */}
        {isSearching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-24 h-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {results.map((video) => (
                <div
                  key={video.id}
                  className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {video.artist}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Music className="h-3 w-3 mr-1" />
                        {formatDuration(video.duration)}
                      </Badge>
                    </div>
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    onClick={() => handleAddToQueue(video)}
                    disabled={addingIds.has(video.id)}
                  >
                    {addingIds.has(video.id) ? (
                      'Adding...'
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Search for songs to add to the queue</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
