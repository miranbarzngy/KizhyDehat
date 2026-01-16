import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  key: supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : null,
  urlValid: supabaseUrl && supabaseUrl !== 'your_supabase_url_here',
  keyValid: !!supabaseAnonKey
})

// Only create Supabase client if valid credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

console.log('🚀 Supabase client created:', !!supabase)
