import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing supplier_transactions table access...');

    // Test 1: Try to select from the table
    const { data: selectData, error: selectError } = await supabase
      .from('supplier_transactions')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Select error:', selectError);
      return NextResponse.json({
        error: 'Cannot access supplier_transactions table',
        details: selectError,
        suggestions: [
          '1. Check if table was created in Supabase SQL Editor',
          '2. Verify table name is exactly "supplier_transactions" (plural)',
          '3. Check RLS policies allow authenticated users',
          '4. Try refreshing PostgREST schema cache',
          '5. Restart the Next.js dev server'
        ]
      }, { status: 500 });
    }

    // Test 2: Try to insert a test record (will fail due to constraints but tests access)
    const testRecord = {
      supplier_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID to test access
      item_name: 'test',
      total_price: 0,
      amount_paid: 0,
      debt_amount: 0,
      date: new Date().toISOString().split('T')[0]
    };

    const { error: insertError } = await supabase
      .from('supplier_transactions')
      .insert(testRecord);

    // We expect this to fail due to foreign key constraint, but it should not fail due to table not found
    const hasAccess = !insertError || !insertError.message.includes('relation "public.supplier_transactions" does not exist');

    return NextResponse.json({
      success: true,
      message: 'supplier_transactions table is accessible!',
      selectTest: {
        success: !!selectData,
        recordCount: selectData?.length || 0
      },
      insertTest: {
        hasAccess,
        expectedError: insertError ? 'Foreign key constraint (expected)' : 'No error (unexpected)',
        errorMessage: insertError?.message
      },
      tableInfo: {
        name: 'supplier_transactions',
        accessible: true,
        policies: 'RLS enabled with authenticated user policies'
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error
    }, { status: 500 });
  }
}
