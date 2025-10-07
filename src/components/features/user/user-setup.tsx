'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/stores/user-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

const EMOJI_OPTIONS = [
  '🎤', '🎸', '🎹', '🎺', '🎷', '🥁',
  '🎵', '🎶', '🎼', '🎧', '🎯', '⭐',
  '🔥', '💫', '✨', '🌟', '💎', '👑',
  '🦄', '🐉', '🦁', '🐯', '🦅', '🦋',
]

interface UserSetupProps {
  onComplete: () => void
}

export function UserSetup({ onComplete }: UserSetupProps) {
  const [displayName, setDisplayName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎤')
  const [isLoading, setIsLoading] = useState(false)
  const setUser = useUserStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your display name',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Create user in database
      const { data, error } = await supabase
        .from('users')
        .insert({
          display_name: displayName.trim(),
          avatar_emoji: selectedEmoji,
        })
        .select()
        .single()

      if (error) throw error

      // Store user in local state
      setUser(data)

      toast({
        title: 'Welcome!',
        description: `You're all set, ${displayName}! 🎉`,
      })

      onComplete()
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to Karaoke Night!</CardTitle>
        <CardDescription>Choose your name and avatar to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="displayName"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Choose Your Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-3xl p-2 rounded-lg transition-all hover:scale-110 ${
                    selectedEmoji === emoji
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  disabled={isLoading}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
