'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo mode: automatically sign in as demo user ONLY if Supabase is not configured
    if (!supabase) {
      // Create a mock user for demo purposes
      const mockUser = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        user_metadata: { name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User

      const mockProfile = {
        id: 'demo-user-id',
        role_id: 'demo-role-id',
        role: {
          name: 'Admin',
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: true,
            payroll: true,
            profits: true
          }
        }
      } as Profile

      setUser(mockUser)
      setProfile(mockProfile)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('🔄 Initial session check:', !!session?.user)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        // No authenticated user - set loading to false, user remains null
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔄 Auth state changed:', event, !!session?.user)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          setProfile(null) // Clear profile while fetching
          await fetchProfile(session.user.id)
        } else {
          // No authenticated user - clear profile and set loading to false
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    console.log('🔍 Fetching profile for userId:', userId)
    if (!supabase) {
      console.log('❌ Supabase not available')
      return
    }

    try {
      // First fetch the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('📋 Profile data result:', { profileData: !!profileData, profileError: profileError?.message })

      if (profileError || !profileData) {
        console.log('⚠️ Profile not found, using fallback')
        const fallbackProfile: Profile = {
          id: userId,
          name: user?.email?.split('@')[0] || 'بەکارهێنەر',
          email: user?.email || '',
          role_id: 'admin-role',
          role: {
            name: 'Admin',
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
          }
        }
        console.log('✅ Using fallback profile:', fallbackProfile)
        setProfile(fallbackProfile)
        setLoading(false)
        return
      }

      // Now fetch the role data separately
      let roleData = null
      if (profileData.role_id) {
        const { data: roleResult, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', profileData.role_id)
          .single()

        if (!roleError && roleResult) {
          roleData = roleResult
        }
        console.log('📋 Role data result:', { roleData: !!roleData, roleError: roleError?.message })
      }

      // Create the complete profile
      const completeProfile: Profile = {
        id: profileData.id,
        name: profileData.name || user?.email?.split('@')[0] || 'بەکارهێنەر',
        image: profileData.image,
        phone: profileData.phone,
        location: profileData.location,
        email: profileData.email || user?.email || '',
        role_id: profileData.role_id,
        role: roleData ? {
          name: roleData.name,
          permissions: roleData.permissions || {}
        } : {
          name: 'Admin',
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
        }
      }

      console.log('✅ Complete profile loaded:', {
        name: completeProfile.name,
        image: !!completeProfile.image,
        role: completeProfile.role?.name,
        role_id: completeProfile.role_id
      })

      setProfile(completeProfile)
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      // Final fallback
      const fallbackProfile: Profile = {
        id: userId,
        name: user?.email?.split('@')[0] || 'بەکارهێنەر',
        email: user?.email || '',
        role_id: 'admin-role',
        role: {
          name: 'Admin',
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
        }
      }
      setProfile(fallbackProfile)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting login with:', email)
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('🔑 Login result:', { user: data.user, error })

    if (error) {
      console.error('❌ Login error:', error)
      throw error
    }

    console.log('✅ Login successful for user:', data.user?.email)
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}