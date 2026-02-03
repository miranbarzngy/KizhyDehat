import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        error: 'Database connection not available',
        details: 'Supabase client is not initialized. Please check your environment variables.'
      }, { status: 500 })
    }

    // Add is_archived column to inventory table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN inventory.is_archived IS 'Whether this item is archived (out of stock)';
      `
    })

    if (alterError) {
      console.error('Error adding is_archived column:', alterError)
      // Try direct approach
      const { error: directError } = await supabase
        .from('inventory')
        .select('id')
        .limit(1)

      if (directError) {
        return NextResponse.json({
          error: 'Database connection issue',
          details: directError.message
        }, { status: 500 })
      }

      // If we can select, try to add column through a different approach
      return NextResponse.json({
        message: 'Please run the migration manually in Supabase SQL Editor',
        sql: `
          ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
          COMMENT ON COLUMN inventory.is_archived IS 'Whether this item is archived (out of stock)';
        `
      })
    }

    return NextResponse.json({
      message: 'Archive column added successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}