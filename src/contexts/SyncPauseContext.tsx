'use client'

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react'

interface SyncPauseContextType {
  isPaused: () => boolean
  pauseSync: (duration?: number) => void
  resumeSync: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SyncPauseContext = createContext<SyncPauseContextType | undefined>(undefined)

export function SyncPauseProvider({ children }: { children: ReactNode }) {
  const pauseCountRef = useRef(0)

  const isPaused = useCallback(() => {
    return pauseCountRef.current > 0
  }, [])

  const pauseSync = useCallback((duration: number = 5000) => {
    pauseCountRef.current++
    console.log('🔇 Sync paused (count:', pauseCountRef.current, ')')
    
    // Auto-resume after duration
    setTimeout(() => {
      if (pauseCountRef.current > 0) {
        pauseCountRef.current--
        console.log('🔊 Sync auto-resumed (count:', pauseCountRef.current, ')')
      }
    }, duration)
  }, [])

  const resumeSync = useCallback(() => {
    if (pauseCountRef.current > 0) {
      pauseCountRef.current--
      console.log('🔊 Sync resumed (count:', pauseCountRef.current, ')')
    }
  }, [])

  return (
    <SyncPauseContext.Provider value={{ isPaused, pauseSync, resumeSync }}>
      {children}
    </SyncPauseContext.Provider>
  )
}

export function useSyncPause() {
  const context = useContext(SyncPauseContext)
  
  if (!context) {
    // Return default values if context is not available
    return {
      isPaused: () => false,
      pauseSync: () => { console.log('⚠️ SyncPauseContext not available, sync pause ignored') },
      resumeSync: () => { console.log('⚠️ SyncPauseContext not available, sync resume ignored') },
    }
  }
  
  return context
}
