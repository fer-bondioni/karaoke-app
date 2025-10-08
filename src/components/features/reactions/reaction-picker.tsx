'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/hooks/use-toast'
import { Smile } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const REACTION_EMOJIS = ['🔥', '👏', '❤️', '😂', '🎵', '⭐', '💯', '🎤']

interface ReactionPickerProps {
  queueItemId: string
  userId: string
  currentReaction?: string | null
}

export function ReactionPicker({ queueItemId, userId, currentReaction }: ReactionPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState(currentReaction)
  const [reactions, setReactions] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchReactions()
    subscribeToReactions()
  }, [queueItemId])

  const fetchReactions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('ratings')
      .select('emoji')
      .eq('queue_item_id', queueItemId)

    if (data) {
      const counts = data.reduce((acc, { emoji }) => {
        acc[emoji] = (acc[emoji] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      setReactions(counts)
    }
  }

  const subscribeToReactions = () => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reactions:${queueItemId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ratings',
        filter: `queue_item_id=eq.${queueItemId}`,
      }, () => {
        fetchReactions()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleReaction = async (emoji: string) => {
    try {
      const supabase = createClient()

      if (selectedEmoji) {
        // Update existing reaction
        await supabase
          .from('ratings')
          .update({ emoji })
          .eq('queue_item_id', queueItemId)
          .eq('user_id', userId)
      } else {
        // Create new reaction
        await supabase
          .from('ratings')
          .insert({
            queue_item_id: queueItemId,
            user_id: userId,
            emoji,
          })
      }

      setSelectedEmoji(emoji)
      setOpen(false)

      toast({
        title: 'Reaction added!',
        description: `You reacted with ${emoji}`,
      })
    } catch (error) {
      console.error('Error adding reaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Show reaction counts */}
      {Object.entries(reactions).slice(0, 3).map(([emoji, count]) => (
        <div key={emoji} className="flex items-center gap-1 text-xs">
          <span>{emoji}</span>
          <span className="text-muted-foreground">{count}</span>
        </div>
      ))}

      {/* Reaction picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            {selectedEmoji || <Smile className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="text-2xl p-2 h-auto"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
