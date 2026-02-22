'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

interface RoleData {
  name: string
  permissions: Record<string, boolean>
}

interface ProfileData {
  id: string
  name: string | null
  image: string | null
  role_id: string | null
  role: RoleData | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: ProfileData | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  // Function to fetch profile with role and permissions
  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase()
    if (!supabase) return null

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        console.log('No profile found for user:', userId)
        return null
      }

      // Fetch role data if role_id exists
      let roleData: RoleData | null = null
      if (profileData.role_id) {
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('name, permissions')
          .eq('id', profileData.role_id)
          .single()

        if (!roleError && role) {
          roleData = {
            name: role.name,
            permissions: role.permissions || {}
          }
        }
      }

      return {
        id: profileData.id,
        name: profileData.name,
        image: profileData.image,
        role_id: profileData.role_id,
        role: roleData
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Fetch profile with role after session is set
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      }
      
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
            
            // Fetch profile with role when user signs in
            if (session?.user) {
              const profileData = await fetchProfile(session.user.id)
              setProfile(profileData)
            } else {
              setProfile(null)
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
            // Also refresh profile data
            const profileData = await fetchProfile(freshUser.id)
            setProfile(profileData)
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
  }, [fetchProfile])

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
    <AuthContext.Provider value={{ user, session, loading, profile, signIn, signUp, signOut }}>
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
