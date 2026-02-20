import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Enable RLS on products table if not already enabled
    const { error: enableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;'
    })

    // Create RLS policy to allow reading products
    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Allow public read access on products" 
            ON public.products 
            FOR SELECT 
            USING (true);`
    })

    if (enableError && !enableError.message.includes('already')) {
      console.error('Error enabling RLS:', enableError)
      return NextResponse.json({ 
        success: false, 
        error: enableError.message 
      }, { status: 500 })
    }

    if (policyError && !policyError.message.includes('already')) {
      console.error('Error creating policy:', policyError)
      return NextResponse.json({ 
        success: false, 
        error: policyError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RLS policy created successfully' 
    })
  } catch (error: any) {
    console.error('Error setting up RLS:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
