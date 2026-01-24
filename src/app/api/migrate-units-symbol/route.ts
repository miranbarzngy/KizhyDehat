import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting units table symbol column migration...');

    // Test if the symbol column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('units')
      .select('symbol')
      .limit(1);

    if (testError && testError.code === '42703') {
      // Column doesn't exist, provide instructions for manual migration
      console.log('Symbol column does not exist, needs manual migration');

      return NextResponse.json({
        success: false,
        message: 'Symbol column does not exist in units table.',
        instructions: [
          'Please run the following SQL in your Supabase SQL Editor:',
          'ALTER TABLE units ADD COLUMN IF NOT EXISTS symbol TEXT;',
          '',
          'Or use the migration file: add_symbol_to_units_table.sql'
        ],
        sql: 'ALTER TABLE units ADD COLUMN IF NOT EXISTS symbol TEXT;'
      });
    } else if (testError) {
      return NextResponse.json({
        error: 'Error checking symbol column',
        details: testError
      }, { status: 500 });
    } else {
      // Column exists
      console.log('Symbol column already exists');

      // Test inserting/updating with symbol
      const { data: insertTest, error: insertError } = await supabase
        .from('units')
        .insert({
          name: 'test_unit_for_symbol',
          symbol: 'test'
        })
        .select();

      if (insertError) {
        console.error('Error testing symbol column:', insertError);
        return NextResponse.json({
          error: 'Symbol column exists but cannot be used',
          details: insertError
        }, { status: 500 });
      }

      // Clean up test data
      if (insertTest && insertTest.length > 0) {
        await supabase
          .from('units')
          .delete()
          .eq('name', 'test_unit_for_symbol');
      }

      return NextResponse.json({
        success: true,
        message: 'Symbol column already exists and is working correctly!',
        testResult: testData
      });
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error
    }, { status: 500 });
  }
}
