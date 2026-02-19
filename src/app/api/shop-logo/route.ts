import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a service role client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET() {
  try {
    // Use service role to bypass RLS and fetch shop settings
    const { data, error } = await supabaseAdmin
      .from('invoice_settings')
      .select('shop_logo, shop_name')
      .maybeSingle()

    if (error) {
      console.error('Error fetching shop settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shop settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      shop_logo: data?.shop_logo || null,
      shop_name: data?.shop_name || null
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
