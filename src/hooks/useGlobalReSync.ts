'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useGlobalReSync() {
  const router = useRouter()
  const isSyncing = useRef(false)
  const lastSyncTime = useRef(0)

  // Navigation wake-up: click listener for frozen Links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (!link) return
      
      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/dashboard')) return

      // Check if navigation is taking too long
      const startNav = Date.now()
      const checkNav = () => {
        if (Date.now() - startNav > 500 && !href.includes('#')) {
          console.log('🔧 Router frozen, forcing navigation')
          window.location.href = href
        }
      }
      setTimeout(checkNav, 500)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const performSync = useCallback(async () => {
    const now = Date.now()
    
    // Throttle: only sync once per 2 seconds
    if (now - lastSyncTime.current < 2000) {
      return
    }
    lastSyncTime.current = now

    if (isSyncing.current) {
      return
    }
    isSyncing.current = true

    try {
      console.log('🔄 Global re-sync triggered')
      router.refresh()
      console.log('✅ Router refreshed')

      // Force CSS recalculation
      const html = document.documentElement
      void html.offsetHeight
      console.log('🎨 CSS recalculated')
      
      // Ensure font
      document.documentElement.style.setProperty('--font-uni-salar', 'UniSalar')
      document.body.style.fontFamily = 'var(--font-uni-salar), sans-serif'
      console.log('🔤 Font re-applied')
      
    } catch (error) {
      console.error('❌ Sync error:', error)
    } finally {
      setTimeout(() => {
        isSyncing.current = false
      }, 2000)
    }
  }, [router])

  useEffect(() => {
    let syncTimeout: NodeJS.Timeout | null = null

    const scheduleSync = () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout)
      }
      syncTimeout = setTimeout(() => {
        performSync()
      }, 200)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleSync()
      }
    }

    const handleFocus = () => {
      scheduleSync()
    }

    const handleOnline = () => {
      scheduleSync()
    }

    const handleOffline = () => {
      console.log('📴 Network lost')
    }

    const handlePopState = () => {
      scheduleSync()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('popstate', handlePopState)
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [performSync])
}
