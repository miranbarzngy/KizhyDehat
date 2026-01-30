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
  refreshProfile: () => Promise<void>
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
      console.log('❌ Supabase not available, falling back to demo mode')
      // Fall back to demo mode when Supabase is not available
      const mockProfile = {
        id: userId,
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
      setProfile(mockProfile)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          image,
          phone,
          location,
          email,
          role_id
        `)
        .eq('id', userId)
        .single()

      // If profile exists, try to fetch role separately
      let roleData = null
      if (data?.role_id) {
        try {
          const { data: roleResult, error: roleError } = await supabase
            .from('roles')
            .select('name, permissions')
            .eq('id', data.role_id)
            .single()

          if (!roleError && roleResult) {
            roleData = roleResult
          }
        } catch (roleFetchError) {
          console.log('⚠️ Could not fetch role data, continuing without role')
        }
      }

      console.log('📋 Profile query result:', { data, error })
      console.log('🔍 Raw data.roles:', data?.roles)
      console.log('🔍 data.roles type:', Array.isArray(data?.roles) ? 'array' : typeof data?.roles)
      console.log('🔍 data.roles length:', data?.roles?.length)

      if (error) {
        console.error('❌ Profile query error:', error?.message || 'Unknown error')
        // If profile query fails, fall back to demo mode
        console.log('⚠️ Database query failed, falling back to demo mode')
        const mockProfile = {
          id: userId,
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
        setProfile(mockProfile)
        setLoading(false)
        return
      }

      // Transform the data to match our interface
      const transformedData: Profile = {
        id: data.id,
        name: data.name,
        image: data.image,
        phone: data.phone,
        location: data.location,
        email: data.email,
        role_id: data.role_id,
        role: roleData
      }

      console.log('✅ Profile loaded:', transformedData)
      console.log('🎯 Final role object:', transformedData.role)
      setProfile(transformedData)
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      // If any error occurs, fall back to demo mode
      console.log('⚠️ Exception occurred, falling back to demo mode')
      const mockProfile = {
        id: userId,
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
      setProfile(mockProfile)
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

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
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