import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'

export function useSupabase() {
  const [supabase, setSupabase] = useState<any>(supabaseClient)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const lastReconnectTime = useRef(0)

  // Reconnect/wake up Supabase on tab focus
  const wakeUp = useCallback(async () => {
    const now = Date.now()
    // Debounce: only reconnect once per 10 seconds
    if (now - lastReconnectTime.current < 10000) {
      return
    }
    lastReconnectTime.current = now

    if (!supabase) {
      await initializeSupabase()
      return
    }

    try {
      // Quick ping to verify connection
      const { error } = await supabase.from('products').select('id').limit(1).timeout(3000)
      
      if (error) {
        console.log('🔄 [useSupabase] Connection stale, refreshing session...')
        setIsReconnecting(true)
        
        // Refresh auth session
        await supabase.auth.refreshSession()
        
        // Try again
        const { error: retryError } = await supabase.from('products').select('id').limit(1).timeout(3000)
        
        if (retryError) {
          console.error('❌ [useSupabase] Refresh failed, reinitializing...')
          await initializeSupabase()
        } else {
          console.log('✅ [useSupabase] Connection restored')
        }
      } else {
        console.log('✅ [useSupabase] Connection OK')
      }
    } catch (err) {
      console.log('🔄 [useSupabase] Ping failed, refreshing...')
      setIsReconnecting(true)
      
      try {
        await supabase.auth.refreshSession()
        console.log('✅ [useSupabase] Session refreshed')
      } catch (refreshErr) {
        console.error('❌ [useSupabase] Refresh failed, reinitializing...')
        await initializeSupabase()
      }
    } finally {
      setIsReconnecting(false)
    }
  }, [supabase])

  // Initialize/re-initialize Supabase client
  const initializeSupabase = useCallback(async () => {
    try {
      // Dynamic import to get fresh client
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
        const newClient = createClient(supabaseUrl, supabaseAnonKey)
        setSupabase(newClient)
        console.log('✅ [useSupabase] Client re-initialized')
        return newClient
      }
    } catch (err) {
      console.error('❌ [useSupabase] Failed to initialize:', err)
    }
    return null
  }, [])

  // Set up visibility change listener to wake up on tab focus
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [useSupabase] Tab became visible, waking up...')
        await wakeUp()
      }
    }

    const handleFocus = async () => {
      console.log('🎯 [useSupabase] Window focused, waking up...')
      await wakeUp()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [wakeUp])

  // Pre-flight connection check before critical operations
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!supabase) {
      return !!(await initializeSupabase())
    }

    try {
      const { error } = await supabase.from('products').select('id').limit(1).timeout(5000)
      return !error
    } catch {
      return false
    }
  }, [supabase, initializeSupabase])

  return {
    supabase,
    isReconnecting,
    wakeUp,
    initializeSupabase,
    checkConnection
  }
}

// Helper to add timeout to Supabase queries
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`))
    }, ms)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}
