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
    // Use admin client to bypass RLS
    const adminClient = getAdminClient()
    
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id, name, email, image, phone, location, role_id, is_active')
    
    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ profiles: profiles || [] })
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
