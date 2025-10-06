import { create } from 'zustand'
import { Session, QueueItem, User } from '@/types/database'

interface SessionState {
  currentSession: Session | null
  participants: User[]
  queue: QueueItem[]
  currentlyPlaying: QueueItem | null
  setSession: (session: Session) => void
  setParticipants: (participants: User[]) => void
  setQueue: (queue: QueueItem[]) => void
  setCurrentlyPlaying: (item: QueueItem | null) => void
  addParticipant: (participant: User) => void
  removeParticipant: (userId: string) => void
  addToQueue: (item: QueueItem) => void
  updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => void
  removeFromQueue: (itemId: string) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  participants: [],
  queue: [],
  currentlyPlaying: null,
  
  setSession: (session) => set({ currentSession: session }),
  
  setParticipants: (participants) => set({ participants }),
  
  setQueue: (queue) => set({ queue }),
  
  setCurrentlyPlaying: (item) => set({ currentlyPlaying: item }),
  
  addParticipant: (participant) => 
    set((state) => ({
      participants: [...state.participants, participant]
    })),
  
  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== userId)
    })),
  
  addToQueue: (item) =>
    set((state) => ({
      queue: [...state.queue, item]
    })),
  
  updateQueueItem: (itemId, updates) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    })),
  
  removeFromQueue: (itemId) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== itemId)
    })),
  
  clearSession: () => set({
    currentSession: null,
    participants: [],
    queue: [],
    currentlyPlaying: null,
  }),
}))
