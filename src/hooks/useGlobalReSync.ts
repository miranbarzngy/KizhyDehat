'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useGlobalReSync() {
  const router = useRouter()
  const isSyncing = useRef(false)
  const lastSyncTime = useRef(0)

  const performSync = useCallback(async () => {
    const now = Date.now()
    
    // Throttle: only sync once per 2 seconds
    if (now - lastSyncTime.current < 2000) {
      return
    }
    lastSyncTime.current = now

    // Don't sync if already syncing
    if (isSyncing.current) {
      return
    }
    isSyncing.current = true

    try {
      console.log('🔄 Global re-sync triggered')
      router.refresh()
      console.log('✅ Router refreshed')
    } catch (error) {
      console.error('❌ Sync error:', error)
    } finally {
      // Delay resetting isSyncing to prevent rapid re-syncs
      setTimeout(() => {
        isSyncing.current = false
      }, 2000)
    }
  }, [router]) // Only depends on router, not on changing values

  useEffect(() => {
    let syncTimeout: NodeJS.Timeout | null = null

    const scheduleSync = () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout)
      }
      // Delay to let browser stabilize after focus
      syncTimeout = setTimeout(() => {
        performSync()
      }, 200)
    }

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleSync()
      }
    }

    // Handle window focus
    const handleFocus = () => {
      scheduleSync()
    }

    // Handle online event
    const handleOnline = () => {
      scheduleSync()
    }

    // Handle popstate
    const handlePopState = () => {
      scheduleSync()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('popstate', handlePopState)
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [performSync]) // Only re-create effect if performSync changes
}
