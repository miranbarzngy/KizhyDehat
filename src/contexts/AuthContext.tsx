'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  userProfileStore,
  setUserProfile,
  clearUserProfile,
  getUserProfile
} from '@/lib/persistentStore'

interface Profile {
  id: string
  name?: string
  image?: string
  phone?: string
  location?: string
  email?: string
  role_id: string
  role?: {
    name: string
    permissions: Record<string, boolean>
  }
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const isInitialized = useRef(false)

  // Build Profile from persistent store (SYNCHRONOUS)
  const buildProfileFromStore = useCallback((): Profile | null => {
    const storeState = getUserProfile()
    
    if (!storeState.isAuthenticated || !storeState.userId || !storeState.roleId) {
      return null
    }

    return {
      id: storeState.userId,
      name: storeState.userName || 'بەکارهێنەر',
      image: storeState.userImage || '',
      email: storeState.userEmail || '',
      role_id: storeState.roleId,
      role: {
        name: storeState.roleName || 'Admin',
        permissions: {
          dashboard: true, sales: true, inventory: true, customers: true,
          suppliers: true, invoices: true, expenses: true, profits: true,
          help: true, admin: true
        }
      }
    }
  }, [])

  // Save profile to persistent store
  const persistProfile = useCallback((userData: User | null, profileData: Profile | null) => {
    if (profileData) {
      setUserProfile({
        userId: profileData.id,
        userName: profileData.name || '',
        userEmail: profileData.email || userData?.email || '',
        userImage: profileData.image || '',
        roleId: profileData.role_id,
        roleName: profileData.role?.name || '',
        isAuthenticated: true,
        lastSync: Date.now()
      })
    }
  }, [])

  // Fetch fresh profile from Supabase
  const fetchFreshProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileData) return null

      let roleData = null
      if (profileData.role_id) {
        const { data: roleResult } = await supabase
          .from('roles')
          .select('*')
          .eq('id', profileData.role_id)
          .single()
        roleData = roleResult
      }

      return {
        id: profileData.id,
        name: profileData.name || '',
        image: profileData.image,
        email: profileData.email || '',
        role_id: profileData.role_id,
        role: roleData ? {
          name: roleData.name,
          permissions: roleData.permissions || {}
        } : undefined
      }
    } catch {
      return null
    }
  }, [])

  // Initial restore from store (only once)
  const initialRestore = useCallback(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    
    const cachedProfile = buildProfileFromStore()
    if (cachedProfile) {
      setProfile(cachedProfile)
    }
    setLoading(false)
  }, [buildProfileFromStore])

  // Refresh session with Supabase
  const refreshSession = useCallback(async () => {
    initialRestore()
    
    if (supabase) {
      try {
        await supabase.auth.getUser()
      } catch {
        // Silently fail - we have cached data
      }
    }
  }, [initialRestore])

  useEffect(() => {
    // DEMO MODE
    if (!supabase) {
      const mockUser = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        user_metadata: { name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User

      const mockProfile: Profile = {
        id: 'demo-user-id',
        name: 'Demo User',
        image: '',
        role_id: 'demo-role-id',
        role: {
          name: 'Admin',
          permissions: {
            dashboard: true, sales: true, inventory: true, customers: true,
            suppliers: true, invoices: true, expenses: true, profits: true,
            help: true, admin: true
          }
        }
      }

      setUser(mockUser)
      setProfile(mockProfile)
      persistProfile(mockUser, mockProfile)
      setLoading(false)
      return
    }

    // Initial restore from persistent store
    initialRestore()

    // Get session from Supabase (only once on mount)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        setUser(session.user)
        
        // Fetch fresh profile and persist
        const freshProfile = await fetchFreshProfile(session.user.id)
        if (freshProfile) {
          setProfile(freshProfile)
          persistProfile(session.user, freshProfile)
        }
      }
      setLoading(false)
    })

    // Listen for auth changes (only for actual sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only react to actual auth events, not visibility changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            const freshProfile = await fetchFreshProfile(session.user.id)
            if (freshProfile) {
              setProfile(freshProfile)
              persistProfile(session.user, freshProfile)
            }
          } else {
            // On sign out, clear profile but keep cached
            setProfile(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    if (data.user) {
      const profile = await fetchFreshProfile(data.user.id)
      if (profile) {
        setProfile(profile)
        persistProfile(data.user, profile)
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured')
    clearUserProfile()
    setUser(null)
    setProfile(null)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshSession }}>
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
