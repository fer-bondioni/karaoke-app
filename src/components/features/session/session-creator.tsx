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

export function SessionCreator() {
  const [sessionName, setSessionName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const user = useUserStore((state) => state.user)
  const setSession = useSessionStore((state) => state.setSession)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionName.trim()) {
      toast({
        title: 'Session name required',
        description: 'Please enter a name for your session',
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

      // Generate a unique session code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_session_code')

      if (codeError) throw codeError

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          name: sessionName.trim(),
          code: codeData,
          host_id: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Add host as participant
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user.id,
        })

      if (participantError) throw participantError

      // Store session in state
      setSession(session)

      toast({
        title: 'Session created!',
        description: `Share code: ${session.code}`,
      })

      // Navigate to session
      router.push(`/session/${session.code}`)
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a Session</CardTitle>
        <CardDescription>Start a new karaoke session and invite friends</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="sessionName" className="text-sm font-medium">
              Session Name
            </label>
            <Input
              id="sessionName"
              placeholder="e.g., Friday Night Karaoke"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
