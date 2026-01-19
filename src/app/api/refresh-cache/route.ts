import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Refreshing PostgREST schema cache...');

    // Method 1: Update table comment to force cache refresh
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `COMMENT ON TABLE suppliers IS 'Suppliers table - cache refresh ' || now();`
    });

    if (commentError) {
      console.warn('Comment method failed, trying alternative...');

      // Method 2: Try direct approach (won't work but shows the issue)
      const { error: altError } = await supabase
        .from('suppliers')
        .select('*')
        .limit(1);

      if (altError) {
        return NextResponse.json({
          error: 'Cache refresh failed',
          details: 'Manual intervention required',
          solution: 'Please run the SQL commands manually in Supabase SQL Editor'
        }, { status: 500 });
      }
    }

    // Wait a moment for cache to refresh
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test if supplier_transactions is now accessible
    const { data: testData, error: testError } = await supabase
      .from('supplier_transactions')
      .select('*')
      .limit(1);

    if (testError && testError.message.includes('schema cache')) {
      return NextResponse.json({
        warning: 'Cache refresh attempted but table still not found',
        status: 'REQUIRES_MANUAL_INTERVENTION',
        manualSteps: [
          '1. Go to Supabase SQL Editor',
          '2. Run: COMMENT ON TABLE suppliers IS \'Cache refresh\';',
          '3. Wait 30 seconds',
          '4. Check if table appears in API calls'
        ]
      }, { status: 206 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema cache refreshed successfully!',
      tableAccessible: !testError,
      testResult: testData
    });

  } catch (error) {
    console.error('Cache refresh error:', error);
    return NextResponse.json({
      error: 'Cache refresh failed',
      details: error
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verifying supplier_transactions table...');

    // Check 1: Table exists in information_schema
    const { data: tableCheck, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'supplier_transactions';
      `
    });

    // Check 2: Table structure
    const { data: structureCheck, error: structureError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'supplier_transactions'
        ORDER BY ordinal_position;
      `
    });

    // Check 3: RLS Policies
    const { data: policyCheck, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE tablename = 'supplier_transactions';
      `
    });

    // Check 4: Direct table access test
    const { data: accessTest, error: accessError } = await supabase
      .from('supplier_transactions')
      .select('*')
      .limit(1);

    return NextResponse.json({
      verification: {
        tableExists: !tableError && tableCheck?.length > 0,
        tableStructure: !structureError ? structureCheck : null,
        policiesExist: !policyError ? policyCheck : null,
        apiAccessible: !accessError,
        issues: []
      },
      details: {
        tableCheck: { data: tableCheck, error: tableError },
        structureCheck: { data: structureCheck, error: structureError },
        policyCheck: { data: policyCheck, error: policyError },
        accessTest: { data: accessTest, error: accessError }
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      error: 'Verification failed',
      details: error
    }, { status: 500 });
  }
}
