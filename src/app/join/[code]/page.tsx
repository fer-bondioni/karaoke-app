'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { Loader2 } from 'lucide-react'

const AVATAR_EMOJIS = [
  '🎤', '🎸', '🎹', '🎺', '🎷', '🥁',
  '🎵', '🎶', '🎼', '🎧', '🎯', '⭐',
  '🔥', '💫', '✨', '🌟', '💎', '👑',
  '🦄', '🐉', '🦁', '🐯', '🦅', '🦋'
]

export default function QuickJoinPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser } = useUserStore()
  
  const [sessionCode, setSessionCode] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎤')
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  
  useEffect(() => {
    const code = params.code as string
    if (code) {
      setSessionCode(code.toUpperCase())
      verifySession(code)
    }
  }, [params.code])
  
  // If user already exists, redirect them to join the session
  useEffect(() => {
    if (user && sessionCode) {
      handleJoinSession()
    }
  }, [user, sessionCode])
  
  const verifySession = async (code: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        toast({
          title: 'Invalid session',
          description: 'This session could not be found',
          variant: 'destructive',
        })
        router.push('/')
        return
      }
      
      setSessionName(data.name)
    } catch (error) {
      console.error('Error verifying session:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your display name',
        variant: 'destructive',
      })
      return
    }
    
    setIsJoining(true)
    
    try {
      const supabase = createClient()
      
      // Create user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          display_name: displayName.trim(),
          avatar_emoji: selectedEmoji,
        })
        .select()
        .single()
      
      if (userError) throw userError
      
      setUser(newUser)
      
      // The useEffect will trigger join automatically
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to create user profile',
        variant: 'destructive',
      })
      setIsJoining(false)
    }
  }
  
  const handleJoinSession = async () => {
    if (!user) return
    
    try {
      const supabase = createClient()
      
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', sessionCode)
        .single()
      
      if (sessionError) throw sessionError
      
      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .single()
      
      if (!existingParticipant) {
        // Join session
        const { error: joinError } = await supabase
          .from('session_participants')
          .insert({
            session_id: session.id,
            user_id: user.id,
            invited_by: null, // Could track inviter if available
          })
        
        if (joinError) throw joinError
        
        toast({
          title: 'Joined session!',
          description: `Welcome to ${session.name}`,
        })
      }
      
      // Redirect to session
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      console.error('Error joining session:', error)
      toast({
        title: 'Error',
        description: 'Failed to join session',
        variant: 'destructive',
      })
      setIsJoining(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">🎤 Karaoke Night</h1>
          <p className="text-muted-foreground">
            You've been invited to join!
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Join Session</CardTitle>
            <CardDescription>
              You're joining: <strong>{sessionName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sessionCode" className="text-sm font-medium">
                  Session Code
                </label>
                <Input
                  id="sessionCode"
                  value={sessionCode}
                  readOnly
                  className="font-mono text-center text-lg tracking-wider"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Your Name
                </label>
                <Input
                  id="displayName"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isJoining}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose Your Avatar</label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-2xl p-2 rounded hover:bg-muted transition-colors ${
                        selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                      }`}
                      disabled={isJoining}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isJoining}>
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Session'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          🎵 Ready to sing your heart out? 🎶
        </p>
      </div>
    </div>
  )
}
