import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Only allow this in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // First verify user is authenticated as super admin
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const SUPER_ADMIN_EMAIL = 'superadmin@clickgroup.com'
    if (session.user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Only super admin can run this fix' }, { status: 403 })
    }

    // Execute SQL to fix RLS
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `
        -- Drop existing policies on roles table if they exist
        DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
        DROP POLICY IF EXISTS "Allow service role to manage roles" ON roles;
        DROP POLICY IF EXISTS "Allow anon to read roles" ON roles;

        -- Create a policy that allows all authenticated users to read roles
        CREATE POLICY "Allow authenticated users to read roles" ON roles
          FOR SELECT
          TO authenticated
          USING (true);

        -- Create a policy that allows anon to read roles (needed for initial load)
        CREATE POLICY "Allow anon to read roles" ON roles
          FOR SELECT
          TO anon
          USING (true);

        -- Make sure RLS is enabled
        ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
      `
    })

    if (error) {
      console.error('Error fixing RLS:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'RLS policies fixed' })
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
