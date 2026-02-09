'use client'

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react'

interface SyncPauseContextType {
  isPaused: () => boolean
  pauseSync: (caller?: string) => void
  resumeSync: (caller?: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SyncPauseContext = createContext<SyncPauseContextType | undefined>(undefined)

export function SyncPauseProvider({ children }: { children: ReactNode }) {
  const pauseCountRef = useRef(0)

  const isPaused = useCallback(() => {
    return pauseCountRef.current > 0
  }, [])

  const pauseSync = useCallback((caller: string = 'unknown') => {
    pauseCountRef.current++
    console.log(`🔇 Sync PAUSED by "${caller}" (count: ${pauseCountRef.current})`)
    // NO auto-resume - caller MUST call resumeSync() manually
  }, [])

  const resumeSync = useCallback((caller: string = 'unknown') => {
    if (pauseCountRef.current > 0) {
      pauseCountRef.current--
      console.log(`🔊 Sync RESUMED by "${caller}" (count: ${pauseCountRef.current})`)
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
