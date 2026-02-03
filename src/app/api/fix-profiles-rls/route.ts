import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  try {
    console.log('Fixing profiles RLS policies...')

    // Read the fix_profiles_rls.sql file
    const sqlPath = path.join(process.cwd(), 'fix_profiles_rls.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('SQL file loaded, attempting to execute policies...')

    // Since we can't run DDL directly via the API, we'll try to create the policies
    // using individual statements that might work

    const policies = [
      // Profiles policies
      {
        table: 'profiles',
        name: 'Allow authenticated users to read profiles',
        sql: `CREATE POLICY "Allow authenticated users to read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');`
      },
      {
        table: 'profiles',
        name: 'Allow authenticated users to insert profiles',
        sql: `CREATE POLICY "Allow authenticated users to insert profiles" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
      },
      {
        table: 'profiles',
        name: 'Allow authenticated users to update profiles',
        sql: `CREATE POLICY "Allow authenticated users to update profiles" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');`
      },
      {
        table: 'profiles',
        name: 'Allow users to update own profile',
        sql: `CREATE POLICY "Allow users to update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);`
      },
      // Roles policies
      {
        table: 'roles',
        name: 'Allow authenticated users to read roles',
        sql: `CREATE POLICY "Allow authenticated users to read roles" ON roles FOR SELECT USING (auth.role() = 'authenticated');`
      },
      {
        table: 'roles',
        name: 'Allow authenticated users to insert roles',
        sql: `CREATE POLICY "Allow authenticated users to insert roles" ON roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
      },
      {
        table: 'roles',
        name: 'Allow authenticated users to update roles',
        sql: `CREATE POLICY "Allow authenticated users to update roles" ON roles FOR UPDATE USING (auth.role() = 'authenticated');`
      },
      {
        table: 'roles',
        name: 'Allow authenticated users to delete roles',
        sql: `CREATE POLICY "Allow authenticated users to delete roles" ON roles FOR DELETE USING (auth.role() = 'authenticated');`
      }
    ]

    const results = []

    for (const policy of policies) {
      try {
        console.log(`Attempting to create policy: ${policy.name}`)

        // Try to drop existing policy first (this might fail if it doesn't exist)
        try {
          await supabase.rpc('exec_sql', {
            sql: `DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`
          })
        } catch (dropError) {
          console.log(`Drop policy failed (might not exist): ${dropError}`)
        }

        // Try to create the policy
        const { error: createError } = await supabase.rpc('exec_sql', { sql: policy.sql })

        if (createError) {
          console.log(`Policy creation failed: ${createError.message}`)
          results.push({
            policy: policy.name,
            status: 'failed',
            error: createError.message
          })
        } else {
          console.log(`Policy created successfully: ${policy.name}`)
          results.push({
            policy: policy.name,
            status: 'success'
          })
        }
      } catch (error) {
        console.log(`Unexpected error for policy ${policy.name}:`, error)
        results.push({
          policy: policy.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Test if the policies work by trying a simple query
    console.log('Testing profile access...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (testError) {
        console.log('Profile access test failed:', testError)
        return NextResponse.json({
          success: false,
          message: 'RLS policies may not be properly applied. Please run the SQL file manually in Supabase.',
          results,
          testError: testError.message,
          instructions: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the contents of fix_profiles_rls.sql',
            '4. Execute the SQL statements'
          ]
        })
      } else {
        console.log('Profile access test successful')
      }
    } catch (testError) {
      console.log('Profile access test error:', testError)
    }

    return NextResponse.json({
      success: true,
      message: 'Profiles RLS policies setup attempted. Check the results below.',
      results,
      note: 'If some policies failed to create, you may need to run the SQL file manually in Supabase SQL Editor.'
    })

  } catch (error) {
    console.error('Fix profiles RLS error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix profiles RLS policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}