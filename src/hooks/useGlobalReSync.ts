'use client'

import { useEffect, useRef } from 'react'
import { useSyncPause } from '@/contexts/SyncPauseContext'
import { getSubmissionLock } from '@/lib/submissionLock'

export function useGlobalReSync() {
  // Use the sync pause context
  const { isPaused } = useSyncPause()
  
  const lastSyncTime = useRef(0)
  const THROTTLE_MS = 30000 // 30 seconds throttle

  const performSync = useRef(() => {
    // BLOCK if submission is in progress
    if (getSubmissionLock()) {
      console.log('⏸️ Sync blocked - submission in progress')
      return
    }
    
    // Skip if sync is paused (deletion in progress)
    if (isPaused()) {
      return
    }
    
    const now = Date.now()
    
    // Throttle: only sync once per 30 seconds
    if (now - lastSyncTime.current < THROTTLE_MS) {
      return
    }
    
    lastSyncTime.current = now
    console.log('⚠️ Sync triggered (but should be blocked by lock)')
  })

  useEffect(() => {
    // Only handle visibility change - no router.refresh()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Just note the tab became visible, no action needed
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
