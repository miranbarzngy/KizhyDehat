'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
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
    // Demo mode: automatically sign in as demo user if Supabase is not configured
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
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
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
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role_id,
          roles (
            name,
            permissions
          )
        `)
        .eq('id', userId)
        .single()

      console.log('📋 Profile query result:', { data, error })
      console.log('🔍 Raw data.roles:', data?.roles)
      console.log('🔍 data.roles type:', Array.isArray(data?.roles) ? 'array' : typeof data?.roles)
      console.log('🔍 data.roles length:', data?.roles?.length)

      if (error) {
        console.error('❌ Profile query error:', error)
        throw error
      }

      // Transform the data to match our interface
      // Supabase returns joined data as an object, not an array
      const transformedData: Profile = {
        id: data.id,
        role_id: data.role_id,
        role: data.roles && typeof data.roles === 'object' && !Array.isArray(data.roles) ? data.roles : undefined
      }

      console.log('✅ Profile loaded:', transformedData)
      console.log('🎯 Final role object:', transformedData.role)
      setProfile(transformedData)
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
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
