'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/stores/user-store'
import { useSessionStore } from '@/stores/session-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

export function SessionJoiner() {
  const [sessionCode, setSessionCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const user = useUserStore((state) => state.user)
  const setSession = useSessionStore((state) => state.setSession)
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionCode.trim()) {
      toast({
        title: 'Code required',
        description: 'Please enter a session code',
        variant: 'destructive',
      })
      return
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'Please set up your user profile first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Find session by code
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', sessionCode.trim().toUpperCase())
        .eq('is_active', true)
        .single()

      if (sessionError || !session) {
        toast({
          title: 'Session not found',
          description: 'Invalid or inactive session code',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .single()

      if (!existingParticipant) {
        // Add user as participant
        const { error: participantError } = await supabase
          .from('session_participants')
          .insert({
            session_id: session.id,
            user_id: user.id,
          })

        if (participantError) throw participantError
      }

      // Store session in state
      setSession(session)

      toast({
        title: 'Joined session!',
        description: `Welcome to ${session.name}`,
      })

      // Navigate to session
      router.push(`/session/${session.code}`)
    } catch (error) {
      console.error('Error joining session:', error)
      toast({
        title: 'Error',
        description: 'Failed to join session. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a Session</CardTitle>
        <CardDescription>Enter the session code to join your friends</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="sessionCode" className="text-sm font-medium">
              Session Code
            </label>
            <Input
              id="sessionCode"
              placeholder="Enter 8-character code"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              maxLength={8}
              disabled={isLoading}
              className="uppercase font-mono tracking-wider"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
