import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Add sold_by column to sales table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS sold_by TEXT;
        COMMENT ON COLUMN sales.sold_by IS 'Name of the user who issued the invoice';
      `
    })

    if (alterError) {
      console.error('Error adding sold_by column:', alterError)
      // Try direct approach
      const { error: directError } = await supabase
        .from('sales')
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
          ALTER TABLE sales ADD COLUMN IF NOT EXISTS sold_by TEXT;
          COMMENT ON COLUMN sales.sold_by IS 'Name of the user who issued the invoice';
        `
      })
    }

    return NextResponse.json({
      message: 'Sold by column added successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}