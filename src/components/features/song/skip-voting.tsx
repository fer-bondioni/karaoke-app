'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { SkipForward } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SkipVotingProps {
  queueItemId: string
  sessionId: string
  userId: string
  onSkip?: () => void
}

export function SkipVoting({ queueItemId, sessionId, userId, onSkip }: SkipVotingProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const [participantCount, setParticipantCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchVotes()
    fetchParticipants()
    subscribeToVotes()
  }, [queueItemId, sessionId])

  const fetchVotes = async () => {
    const supabase = createClient()
    
    // Check if user has voted
    const { data: userVote } = await supabase
      .from('skip_votes')
      .select('*')
      .eq('queue_item_id', queueItemId)
      .eq('user_id', userId)
      .single()

    setHasVoted(!!userVote)

    // Get total votes
    const { count } = await supabase
      .from('skip_votes')
      .select('*', { count: 'exact', head: true })
      .eq('queue_item_id', queueItemId)

    setVoteCount(count || 0)
  }

  const fetchParticipants = async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    setParticipantCount(count || 0)
  }

  const subscribeToVotes = () => {
    const supabase = createClient()
    const channel = supabase
      .channel(`skip_votes:${queueItemId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'skip_votes',
        filter: `queue_item_id=eq.${queueItemId}`,
      }, () => {
        fetchVotes()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleVote = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (hasVoted) {
        // Remove vote
        await supabase
          .from('skip_votes')
          .delete()
          .eq('queue_item_id', queueItemId)
          .eq('user_id', userId)

        setHasVoted(false)
        toast({
          title: 'Vote removed',
          description: 'Your skip vote has been removed',
        })
      } else {
        // Add vote
        await supabase
          .from('skip_votes')
          .insert({
            queue_item_id: queueItemId,
            user_id: userId,
            session_id: sessionId,
          })

        setHasVoted(true)

        // Check if threshold is met (50%)
        const newVoteCount = voteCount + 1
        if (newVoteCount >= participantCount / 2 && onSkip) {
          toast({
            title: 'Song skipped!',
            description: 'Majority voted to skip this song',
          })
          onSkip()
        } else {
          toast({
            title: 'Vote counted',
            description: `${newVoteCount}/${participantCount} votes to skip`,
          })
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: 'Error',
        description: 'Failed to process vote',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const votePercentage = participantCount > 0 ? (voteCount / participantCount) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={hasVoted ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleVote}
        disabled={isLoading}
      >
        <SkipForward className="h-4 w-4 mr-1" />
        Skip
      </Button>
      {voteCount > 0 && (
        <Badge variant="secondary">
          {voteCount}/{participantCount} ({Math.round(votePercentage)}%)
        </Badge>
      )}
    </div>
  )
}
