'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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

// Cookie utilities
const COOKIE_NAMES = {
  USER_ID: 'pos_user_id',
  USER_EMAIL: 'pos_user_email',
  USER_NAME: 'pos_user_name',
  USER_IMAGE: 'pos_user_image',
  ROLE_ID: 'pos_role_id',
  ROLE_NAME: 'pos_role_name',
  SESSION_EXPIRY: 'pos_session_expiry'
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = `${name}=`
  const ca = document.cookie.split(';')
  for (let c of ca) {
    c = c.trim()
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length))
    }
  }
  return null
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

function clearAuthCookies() {
  Object.values(COOKIE_NAMES).forEach(name => deleteCookie(name))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncKey, setSyncKey] = useState(0) // For forcing re-mount
  
  const isSyncing = useRef(false)
  const userIdRef = useRef<string | null>(null)

  // Force read from cookies
  const forceReadFromCookies = useCallback((): Profile | null => {
    if (typeof document === 'undefined') return null
    
    const userId = getCookie(COOKIE_NAMES.USER_ID)
    const userName = getCookie(COOKIE_NAMES.USER_NAME)
    const userImage = getCookie(COOKIE_NAMES.USER_IMAGE)
    const roleId = getCookie(COOKIE_NAMES.ROLE_ID)
    const roleName = getCookie(COOKIE_NAMES.ROLE_NAME)
    const sessionExpiry = getCookie(COOKIE_NAMES.SESSION_EXPIRY)

    if (!userId || !roleId) return null
    if (sessionExpiry) {
      const expiry = new Date(sessionExpiry)
      if (expiry < new Date()) return null
    }

    return {
      id: userId,
      name: userName || '',
      image: userImage || '',
      role_id: roleId,
      role: {
        name: roleName || '',
        permissions: {
          dashboard: true, sales: true, inventory: true, customers: true,
          suppliers: true, invoices: true, expenses: true, profits: true,
          help: true, admin: true
        }
      }
    }
  }, [])

  // Save to cookies
  const saveToCookies = useCallback((profileData: Profile | null, userData: User | null) => {
    if (profileData) {
      setCookie(COOKIE_NAMES.USER_ID, profileData.id)
      setCookie(COOKIE_NAMES.USER_NAME, profileData.name || '', 30)
      setCookie(COOKIE_NAMES.USER_IMAGE, profileData.image || '', 30)
      setCookie(COOKIE_NAMES.ROLE_ID, profileData.role_id)
      setCookie(COOKIE_NAMES.ROLE_NAME, profileData.role?.name || '', 30)
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 7)
      setCookie(COOKIE_NAMES.SESSION_EXPIRY, expiry.toISOString(), 7)
    } else {
      clearAuthCookies()
    }
  }, [])

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (userId: string, userEmail?: string): Promise<Profile | null> => {
    if (!supabase) return null

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) return null

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
        phone: profileData.phone,
        location: profileData.location,
        email: profileData.email || userEmail || '',
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

  // Refresh session with heartbeat
  const refreshSession = useCallback(async () => {
    const cachedProfile = forceReadFromCookies()
    if (cachedProfile) {
      console.log('🚀 FORCE RESTORE FROM COOKIES:', cachedProfile.name)
      setProfile(cachedProfile)
    }
    
    if (supabase) {
      try {
        await supabase.auth.getUser()
        console.log('💓 Supabase auth.getUser() heartbeat')
      } catch {
        console.log('⚠️ Heartbeat failed')
      }
    }
    setLoading(false)
  }, [forceReadFromCookies])

  useEffect(() => {
    // Demo mode
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
      setLoading(false)
      return
    }

    // Immediate cookie restore
    const cachedProfile = forceReadFromCookies()
    if (cachedProfile && cachedProfile.name) {
      console.log('🚀 IMMEDIATE cookie restore:', cachedProfile.name)
      setProfile(cachedProfile)
      userIdRef.current = cachedProfile.id
    }

    // Get session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        setUser(session.user)
        userIdRef.current = session.user.id
        
        const freshProfile = await fetchProfile(session.user.id, session.user.email || undefined)
        if (freshProfile) {
          setProfile(freshProfile)
          saveToCookies(freshProfile, session.user)
        }
      }
      setLoading(false)
    })

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state:', event)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          userIdRef.current = session.user.id
          const freshProfile = await fetchProfile(session.user.id, session.user.email || undefined)
          if (freshProfile) {
            setProfile(freshProfile)
            saveToCookies(freshProfile, session.user)
          }
        } else {
          const cached = forceReadFromCookies()
          if (cached) {
            setProfile(cached)
          }
        }
        setLoading(false)
      }
    )

    // Tab wake-up with Supabase heartbeat
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isSyncing.current) {
        isSyncing.current = true
        console.log('👁️ Tab became visible')
        
        // Increment syncKey to force re-mount of components
        setSyncKey(prev => prev + 1)
        
        // Force restore from cookies
        const cached = forceReadFromCookies()
        if (cached) {
          setProfile(cached)
          console.log('🍪 Profile restored from cookies')
        }
        
        // Supabase heartbeat
        if (supabase) {
          try {
            await supabase.auth.getUser()
            console.log('💓 Supabase heartbeat on focus')
          } catch {
            console.log('⚠️ Supabase heartbeat failed')
          }
        }
        
        // Try server refresh
        if (userIdRef.current) {
          try {
            const freshProfile = await fetchProfile(userIdRef.current)
            if (freshProfile) {
              setProfile(freshProfile)
              saveToCookies(freshProfile, { id: userIdRef.current } as User)
            }
          } catch {
            console.log('⚠️ Server refresh failed')
          }
        }
        
        isSyncing.current = false
      }
    }

    // Window focus
    const handleFocus = async () => {
      if (!isSyncing.current) {
        console.log('🎯 Window focus')
        
        const cached = forceReadFromCookies()
        if (cached) {
          setProfile(cached)
        }
        
        if (supabase) {
          try {
            await supabase.auth.getUser()
          } catch {}
        }
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
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured')
    clearAuthCookies()
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
