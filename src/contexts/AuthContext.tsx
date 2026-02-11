'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetInactivityTimer: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoLogoutMinutesRef = useRef<number>(15)

  // Fetch auto logout settings
  const fetchAutoLogoutSettings = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return 15
    
    try {
      const { data } = await supabase
        .from('invoice_settings')
        .select('auto_logout_minutes')
        .single()
      
      const minutes = data?.auto_logout_minutes || 15
      autoLogoutMinutesRef.current = minutes
      return minutes
    } catch (error) {
      console.warn('Could not fetch auto logout settings:', error)
      return 15
    }
  }, [])

  // Clear inactivity timer
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(async () => {
    if (!user) return
    
    clearInactivityTimer()
    
    // Fetch current timeout setting
    const minutes = await fetchAutoLogoutSettings()
    
    inactivityTimerRef.current = setTimeout(async () => {
      console.log('🔒 Inactivity timeout reached, logging out...')
      
      // Sign out from Supabase
      const supabase = getSupabase()
      if (supabase) {
        await supabase.auth.signOut()
      }
      
      // Redirect to login with security message
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('autoLogoutMessage', 'بەهۆی بێچالاكی، سیستەمەکە بە شێوەیەکی پارێزراو چووە دەرەوە.')
        window.location.href = '/login'
      }
    }, minutes * 60 * 1000) // Convert minutes to milliseconds
  }, [user, clearInactivityTimer, fetchAutoLogoutSettings])

  // Set up activity listeners
  useEffect(() => {
    if (!user) return

    // Reset timer on these events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetInactivityTimer()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Initial timer setup
    resetInactivityTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearInactivityTimer()
    }
  }, [user, resetInactivityTimer, clearInactivityTimer])

  // Check for auto logout message on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const message = sessionStorage.getItem('autoLogoutMessage')
      if (message) {
        // Store in localStorage for the login page to display
        localStorage.setItem('authError', message)
        sessionStorage.removeItem('autoLogoutMessage')
      }
    }
  }, [])

  // Single source of truth: onAuthStateChange
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Fetch and set auto logout settings when session exists
      if (session?.user) {
        fetchAutoLogoutSettings()
      }
    })

    // Listen for auth state changes - this is our single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event)
        
        switch (event) {
          case 'SIGNED_IN':
          case 'SIGNED_OUT':
          case 'TOKEN_REFRESHED':
          case 'INITIAL_SESSION':
            setSession(session)
            setUser(session?.user ?? null)
            
            // Fetch and set auto logout settings when user signs in
            if (session?.user) {
              fetchAutoLogoutSettings()
            } else {
              clearInactivityTimer()
            }
            break
        }
        setLoading(false)
      }
    )

    // Window focus listener - wake up session
    const handleFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Window focused, waking up session...')
        try {
          const { data: { user: freshUser } } = await supabase.auth.getUser()
          if (freshUser) {
            setUser(freshUser)
            setSession(await supabase.auth.getSession())
          }
        } catch (error: any) {
          console.warn('⚠️ Wake up failed:', error?.message)
          // Only redirect on actual auth errors
          if (error?.message?.includes('401') || error?.message?.includes('403')) {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
      clearInactivityTimer()
    }
  }, [fetchAutoLogoutSettings, clearInactivityTimer])

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    
    // Sign in first
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    // Check if user's profile has is_active = false
    if (data.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.is_active === false) {
          // Sign out the user and throw error
          await supabase.auth.signOut()
          throw new Error('ئەم هەژمارە ڕاگیراوە، تکایە پەیوەندی بە بەڕێوەبەرەوە بکە.')
        }
      } catch (profileError: any) {
        // If profile fetch fails, allow login (profile might not exist yet)
        console.warn('Could not fetch profile for is_active check:', profileError)
      }
    }
    
    // Fetch auto logout settings after successful login
    await fetchAutoLogoutSettings()
  }

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    clearInactivityTimer()
    
    const supabase = getSupabase()
    if (!supabase) {
      // Still redirect even without client
      window.location.href = '/login'
      return
    }
    
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetInactivityTimer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
