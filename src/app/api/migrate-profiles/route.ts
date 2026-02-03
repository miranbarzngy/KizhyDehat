import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('Migrating profiles for existing users...')

    // Read the migration SQL file
    const sqlPath = path.join(process.cwd(), 'create_profiles_for_existing_users.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('SQL file loaded, attempting to execute migration...')

    // Since we can't run complex DDL directly via the API, we'll try to create the missing profiles
    // using individual operations

    console.log('Checking for users without profiles...')

    // First, ensure the admin role exists
    const { error: roleError } = await supabase
      .from('roles')
      .upsert({
        id: 'admin-role',
        name: 'Admin',
        permissions: {
          dashboard: true,
          sales: true,
          inventory: true,
          customers: true,
          suppliers: true,
          invoices: true,
          expenses: true,
          profits: true,
          help: true,
          admin: true
        }
      })

    if (roleError) {
      console.log('Role creation error:', roleError)
    } else {
      console.log('Admin role ensured')
    }

    // Get all auth users (this might not work due to RLS, but let's try)
    try {
      // Try to get users who don't have profiles
      // This is a complex query that might not work via the API
      console.log('Attempting to create profiles for existing users...')

      // Since we can't directly query auth.users from the client, we'll need to
      // rely on the SQL file being run manually
      return NextResponse.json({
        success: false,
        message: 'Profile migration requires manual SQL execution',
        instructions: [
          '1. Go to your Supabase project dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the contents of create_profiles_for_existing_users.sql',
          '4. Execute the SQL statements'
        ],
        note: 'This migration creates profile records for existing auth users who don\'t have profiles yet.'
      })

    } catch (error) {
      console.log('Migration via API failed, manual execution required')
      return NextResponse.json({
        success: false,
        message: 'Profile migration requires manual SQL execution',
        error: error instanceof Error ? error.message : 'Unknown error',
        instructions: [
          '1. Go to your Supabase project dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the contents of create_profiles_for_existing_users.sql',
          '4. Execute the SQL statements'
        ]
      })
    }

  } catch (error) {
    console.error('Profile migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to migrate profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}