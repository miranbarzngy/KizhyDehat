import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// Singleton pattern for Supabase client - initialized at module load time
let supabaseInstance: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
    throw new Error('Supabase: Missing environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Use a more reliable storage mechanism
      storage: {
        getItem: (key: string): string | null => {
          if (typeof window === 'undefined') return null
          try {
            return window.localStorage.getItem(key)
          } catch (e) {
            console.error('Error reading from localStorage:', e)
            return null
          }
        },
        setItem: (key: string, value: string): void => {
          if (typeof window === 'undefined') return
          try {
            window.localStorage.setItem(key, value)
          } catch (e) {
            console.error('Error writing to localStorage:', e)
          }
        },
        removeItem: (key: string): void => {
          if (typeof window === 'undefined') return
          try {
            window.localStorage.removeItem(key)
          } catch (e) {
            console.error('Error removing from localStorage:', e)
          }
        }
      },
      onRefreshToken: (token) => {
        console.log('🔄 Supabase: Token refreshed', token?.access_token?.slice(0, 10) + '...')
      },
      onAccessTokenExpired: () => {
        console.log('⚠️ Supabase: Access token expired, attempting refresh...')
      }
    },
    global: {
      headers: { 'x-application-name': 'posup' }
    },
    // Add retry configuration for network issues
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })

  console.log('🚀 Supabase: Client initialized')
  return supabaseInstance
}

// Export the singleton instance for convenience
export const supabase = getSupabase()
