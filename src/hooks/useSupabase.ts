import { getSupabase } from '@/lib/supabase'
import { useCallback, useState } from 'react'

export function useSupabase() {
  const [isReconnecting, setIsReconnecting] = useState(false)
  
  const supabase = getSupabase()

  const wakeUp = useCallback(async () => {
    if (!supabase) return

    setIsReconnecting(true)
    try {
      // Just verify session is still valid
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Session expired, redirect to login
        window.location.href = '/login'
      }
    } catch (error) {
      console.warn('⚠️ useSupabase wakeUp error:', error)
    } finally {
      setIsReconnecting(false)
    }
  }, [supabase])

  const checkConnection = useCallback(async () => {
    if (!supabase) return false
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }, [supabase])

  return {
    supabase,
    isReconnecting,
    wakeUp,
    checkConnection
  }
}
