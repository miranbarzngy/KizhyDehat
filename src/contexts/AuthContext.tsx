'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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
    }
  }, [])

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
  }

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
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
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
