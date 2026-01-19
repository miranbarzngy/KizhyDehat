import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting supplier_transactions table migration...');

    // Create the supplier_transactions table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS supplier_transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
          item_name TEXT NOT NULL,
          total_price NUMERIC(10,2) NOT NULL,
          amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
          debt_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
          date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      // Try direct SQL execution
      const { error: directError } = await supabase.from('supplier_transactions').select('*').limit(1);
      if (directError && directError.message.includes('relation "public.supplier_transactions" does not exist')) {
        return NextResponse.json({
          error: 'Table does not exist. Please create it manually in Supabase SQL Editor with this query:',
          sql: `
            CREATE TABLE supplier_transactions (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
              item_name TEXT NOT NULL,
              total_price NUMERIC(10,2) NOT NULL,
              amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
              debt_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
              date DATE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Allow authenticated users to read supplier_transactions" ON supplier_transactions FOR SELECT USING (auth.role() = 'authenticated');
            CREATE POLICY "Allow authenticated users to insert supplier_transactions" ON supplier_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            CREATE POLICY "Allow authenticated users to update supplier_transactions" ON supplier_transactions FOR UPDATE USING (auth.role() = 'authenticated');
          `
        }, { status: 400 });
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.warn('RLS enable warning:', rlsError);
    }

    // Create policies
    const policies = [
      {
        sql: `DROP POLICY IF EXISTS "Allow authenticated users to read supplier_transactions" ON supplier_transactions;
              CREATE POLICY "Allow authenticated users to read supplier_transactions" ON supplier_transactions FOR SELECT USING (auth.role() = 'authenticated');`
      },
      {
        sql: `DROP POLICY IF EXISTS "Allow authenticated users to insert supplier_transactions" ON supplier_transactions;
              CREATE POLICY "Allow authenticated users to insert supplier_transactions" ON supplier_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
      },
      {
        sql: `DROP POLICY IF EXISTS "Allow authenticated users to update supplier_transactions" ON supplier_transactions;
              CREATE POLICY "Allow authenticated users to update supplier_transactions" ON supplier_transactions FOR UPDATE USING (auth.role() = 'authenticated');`
      }
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (policyError) {
        console.warn('Policy creation warning:', policyError);
      }
    }

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('supplier_transactions')
      .select('*')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        error: 'Table created but not accessible. Please check RLS policies.',
        details: testError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'supplier_transactions table created and configured successfully!',
      testResult: testData
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error
    }, { status: 500 });
  }
}
