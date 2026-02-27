import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET() {
  try {
    // Use admin client to bypass RLS - no session check needed
    const adminClient = getAdminClient()
    
    const { data: roles, error } = await adminClient
      .from('roles')
      .select('id, name, permissions')
    
    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ roles: roles || [] })
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
