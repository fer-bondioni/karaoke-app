'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Swords } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

interface ChallengeButtonProps {
  participant: User
  sessionId: string
  currentUserId: string
  songId?: string
}

export function ChallengeButton({ participant, sessionId, currentUserId, songId }: ChallengeButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChallenge = async () => {
    if (!songId) {
      toast({
        title: 'No song selected',
        description: 'Please select a song from the queue first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      await supabase.from('challenges').insert({
        session_id: sessionId,
        challenger_id: currentUserId,
        challenged_id: participant.id,
        song_id: songId,
        status: 'pending',
        message: `Challenge from user!`,
      })

      toast({
        title: 'Challenge sent!',
        description: `${participant.display_name} has been challenged`,
      })

      setOpen(false)
    } catch (error) {
      console.error('Error creating challenge:', error)
      toast({
        title: 'Error',
        description: 'Failed to send challenge',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (participant.id === currentUserId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Swords className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Challenge {participant.display_name}</DialogTitle>
          <DialogDescription>
            Challenge this participant to sing a song!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{participant.avatar_emoji}</span>
            <span className="font-medium">{participant.display_name}</span>
          </div>
          <Button onClick={handleChallenge} disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Send Challenge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
