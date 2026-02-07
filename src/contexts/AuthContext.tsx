'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  userProfileStore,
  setUserProfile,
  clearUserProfile,
  getUserProfile,
  isUserAuthenticated
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
  syncKey: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncKey, setSyncKey] = useState(0)
  
  const isSyncing = useRef(false)
  const userIdRef = useRef<string | null>(null)

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
      console.log('💾 Profile persisted to localStorage')
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

  // Force refresh from persistent store - SYNCHRONOUS
  const forceRestoreFromStore = useCallback(() => {
    console.log('🚀 FORCE RESTORE FROM STORE')
    
    const cachedProfile = buildProfileFromStore()
    if (cachedProfile) {
      console.log('✅ Profile restored:', cachedProfile.name)
      setProfile(cachedProfile)
      userIdRef.current = cachedProfile.id
    } else {
      console.log('⚠️ No cached profile in store')
      userIdRef.current = null
    }
    setLoading(false)
  }, [buildProfileFromStore])

  // Refresh session with Supabase
  const refreshSession = useCallback(async () => {
    forceRestoreFromStore()
    
    if (supabase) {
      try {
        await supabase.auth.getUser()
        console.log('💓 Supabase getUser()')
      } catch (e) {
        console.log('⚠️ Supabase getUser failed:', e)
      }
    }
  }, [forceRestoreFromStore])

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
      userIdRef.current = mockUser.id
      persistProfile(mockUser, mockProfile)
      setLoading(false)
      return
    }

    // STEP 1: SYNCHRONOUS restore from persistent store FIRST
    forceRestoreFromStore()

    // STEP 2: Get session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        setUser(session.user)
        userIdRef.current = session.user.id
        
        // Fetch fresh profile and persist
        const freshProfile = await fetchFreshProfile(session.user.id)
        if (freshProfile) {
          setProfile(freshProfile)
          persistProfile(session.user, freshProfile)
        }
      }
      setLoading(false)
    })

    // STEP 3: Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state:', event)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          userIdRef.current = session.user.id
          const freshProfile = await fetchFreshProfile(session.user.id)
          if (freshProfile) {
            setProfile(freshProfile)
            persistProfile(session.user, freshProfile)
          }
        } else {
          forceRestoreFromStore()
        }
        setLoading(false)
      }
    )

    // STEP 4: TAB WAKE-UP - Handle visibility change
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isSyncing.current) {
        isSyncing.current = true
        console.log('👁️ Tab became visible')
        
        // Increment syncKey to force UI re-render
        setSyncKey(prev => prev + 1)
        
        // IMMEDIATE synchronous restore
        forceRestoreFromStore()
        
        // Refresh Supabase session
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            userIdRef.current = session.user.id
            
            // Fetch fresh profile
            const freshProfile = await fetchFreshProfile(session.user.id)
            if (freshProfile) {
              setProfile(freshProfile)
              persistProfile(session.user, freshProfile)
            }
          }
        } catch (e) {
          console.log('⚠️ Supabase refresh failed, using cached')
        }
        
        isSyncing.current = false
      }
    }

    // STEP 5: Window focus
    const handleFocus = async () => {
      console.log('🎯 Window focus')
      forceRestoreFromStore()
      
      if (supabase) {
        try {
          await supabase.auth.getSession()
        } catch {}
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
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
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshSession, syncKey }}>
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
