import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// Singleton pattern for Supabase client - initialized at module load time
let supabaseInstance: ReturnType<typeof createClient<Database>>

export function getSupabase() {
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
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      onRefreshToken: (token) => {
        console.log('🔄 Supabase: Token refreshed', token?.access_token?.slice(0, 10) + '...')
      }
    },
    global: {
      headers: { 'x-application-name': 'posup' }
    }
  })

  console.log('🚀 Supabase: Client initialized')
  return supabaseInstance
}

// Export the singleton instance for convenience
export const supabase = getSupabase()
