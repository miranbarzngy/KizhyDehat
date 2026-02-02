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

    // Add payment_method column to sales table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
      `
    })

    if (alterError) {
      console.error('Error adding payment_method column:', alterError)
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
          ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
          UPDATE sales SET payment_method = 'cash' WHERE payment_method IS NULL;
        `
      })
    }

    // Update existing records
    const { error: updateError } = await supabase
      .from('sales')
      .update({ payment_method: 'cash' })
      .is('payment_method', null)

    if (updateError) {
      console.error('Error updating existing records:', updateError)
    }

    return NextResponse.json({
      message: 'Payment method column added successfully',
      updatedRecords: !updateError
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}