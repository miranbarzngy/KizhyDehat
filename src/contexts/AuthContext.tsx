'use client'

import { getSupabase } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

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
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: ProfileData | null
  profileLoading: boolean
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
  const [profileLoading, setProfileLoading] = useState(true)

  // Function to fetch profile with role and permissions
  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    const supabase = getSupabase()
    if (!supabase) return null

    // SUPER ADMIN: Check email first before fetching profile
    const SUPER_ADMIN_EMAIL = 'superadmin@clickgroup.com'
    const authEmail = userEmail?.toLowerCase()
    const isSuperAdmin = authEmail === SUPER_ADMIN_EMAIL.toLowerCase()

    // If super admin, return super admin permissions even without profile
    if (isSuperAdmin) {
      return {
        id: userId,
        name: 'سوپەر ئادمین',
        image: null,
        role_id: null,
        role: {
          name: 'سوپەر ئادمین',
          permissions: {
            dashboard: true,
            sales: true,
            inventory: true,
            customers: true,
            suppliers: true,
            invoices: true,
            expenses: true,
            profits: true,
            help: true,
            admin: true
          }
        },
        is_active: true
      }
    }

    try {
      // Use API to fetch profile data (bypasses RLS)
      let profileData: any = null
      
      try {
        const profileResponse = await fetch('/api/profiles')
        if (profileResponse.ok) {
          const { profiles } = await profileResponse.json()
          profileData = profiles?.find((p: any) => p.id === userId)
        }
      } catch (apiError) {
        console.warn('Failed to fetch profile via API, trying direct query:', apiError)
        // Fallback to direct query
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        profileData = data
      }

      if (!profileData) {
        console.log('No profile found for user:', userId)
        return null
      }

      // Check if user is inactive - if so, sign them out
      if (profileData.is_active === false) {
        console.log('User account is inactive:', userId)
        await supabase.auth.signOut()
        // Return a special flag to indicate inactive user
        return {
          id: profileData.id,
          name: profileData.name,
          image: profileData.image,
          role_id: profileData.role_id,
          role: null,
          is_active: false
        }
      }

      // Fetch role data if role_id exists
      let roleData: RoleData | null = null
      
      if (profileData.role_id) {
        // ALWAYS use the API route to bypass RLS issues
        // This ensures the client can always read roles
        try {
          const response = await fetch('/api/roles')
          if (response.ok) {
            const { roles } = await response.json()
            const role = roles?.find((r: any) => r.id === profileData.role_id)
            if (role) {
              console.log('✅ Role fetched via API:', role.name)
              roleData = {
                name: role.name,
                permissions: role.permissions || {}
              }
            } else {
              console.warn('⚠️ Role not found in API response, role_id:', profileData.role_id)
            }
          } else {
            console.error('❌ API /roles returned error:', response.status)
          }
        } catch (apiError) {
          console.error('❌ Failed to fetch roles via API:', apiError)
        }
      }

      return {
        id: profileData.id,
        name: profileData.name,
        image: profileData.image,
        role_id: profileData.role_id,
        role: roleData,
        is_active: profileData.is_active !== false
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
        const profileData = await fetchProfile(session.user.id, session.user.email || undefined)
        setProfile(profileData)
      }
      
      setLoading(false)
      setProfileLoading(false)
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
              const profileData = await fetchProfile(session.user.id, session.user.email || undefined)
              setProfile(profileData)
              
              // Check if user became inactive and redirect to login
              if (profileData && profileData.is_active === false) {
                console.log('User account became inactive, redirecting to login...')
                await supabase.auth.signOut()
                window.location.href = '/login?reason=inactive'
              }
            } else {
              setProfile(null)
            }
            setProfileLoading(false)
            break
        }
        setLoading(false)
      }
    )

    // Window focus listener - wake up session and refresh data
    const handleFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Window focused, waking up session...')
        try {
          // First try to get the current session from storage
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          
          if (currentSession) {
            // Session exists, try to refresh it
            const { data: { user: freshUser }, error: refreshError } = await supabase.auth.getUser()
            
            if (refreshError) {
              console.warn('⚠️ Session refresh error:', refreshError.message)
              // Try to recover by getting a new session
              const { data: { session: newSession }, error: sessionError } = await supabase.auth.refreshSession()
              if (sessionError || !newSession) {
                console.error('❌ Session recovery failed:', sessionError)
                // Session is invalid, sign out
                await supabase.auth.signOut()
                window.location.href = '/login?reason=session_expired'
                return
              }
              setSession(newSession)
              setUser(newSession.user)
            } else if (freshUser) {
              setUser(freshUser)
              setSession(currentSession)
            }
            
            // Also refresh profile data and check if user is still active
            const profileData = await fetchProfile(freshUser.id, freshUser.email || undefined)
            setProfile(profileData)
            
            // If user became inactive, redirect to login
            if (profileData && profileData.is_active === false) {
              console.log('User account became inactive (on focus), redirecting to login...')
              await supabase.auth.signOut()
              window.location.href = '/login?reason=inactive'
            }
          } else {
            // No session found - might be logged out, redirect to login
            console.log('⚠️ No session found on focus')
            setUser(null)
            setSession(null)
            setProfile(null)
            // Only redirect if we're not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?reason=session_expired'
            }
          }
        } catch (error: any) {
          console.warn('⚠️ Wake up failed:', error?.message)
          // Only redirect on actual auth errors
          if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('session')) {
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
    
    // Check if user's profile has is_active = false (using API to bypass RLS)
    if (data.user) {
      try {
        const response = await fetch('/api/profiles')
        if (response.ok) {
          const { profiles } = await response.json()
          const userProfile = profiles?.find((p: any) => p.id === data.user?.id)
          
          if (userProfile?.is_active === false) {
            // Sign out the user and throw error
            await supabase.auth.signOut()
            throw new Error('ئەم هەژمارە ڕاگیراوە، تکایە پەیوەندی بە بەڕێوەبەرەوە بکە.')
          }
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
    <AuthContext.Provider value={{ user, session, loading, profile, profileLoading, signIn, signUp, signOut }}>
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
