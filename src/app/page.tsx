'use client'

import { useState, useEffect } from 'react'
import { UserSetup } from '@/components/features/user/user-setup'
import { SessionCreator } from '@/components/features/session/session-creator'
import { SessionJoiner } from '@/components/features/session/session-joiner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/stores/user-store'

export default function Home() {
  const [showSetup, setShowSetup] = useState(true)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    // Check if user already exists in store
    if (user) {
      setShowSetup(false)
    }
  }, [user])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎤 Karaoke Night
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Sing together, challenge friends, and have fun!
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center">
          {showSetup ? (
            <UserSetup onComplete={() => setShowSetup(false)} />
          ) : (
            <div className="w-full max-w-2xl space-y-6">
              {/* Welcome message */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl">{user?.avatar_emoji}</span>
                  <h2 className="text-2xl font-semibold">
                    Welcome, {user?.display_name}!
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  Create a new session or join an existing one
                </p>
              </div>

              <Separator />

              {/* Session options */}
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">Create Session</TabsTrigger>
                  <TabsTrigger value="join">Join Session</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="flex justify-center mt-6">
                  <SessionCreator />
                </TabsContent>
                <TabsContent value="join" className="flex justify-center mt-6">
                  <SessionJoiner />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>🎵 Ready to sing your heart out? 🎶</p>
        </div>
      </div>
    </main>
  )
}
