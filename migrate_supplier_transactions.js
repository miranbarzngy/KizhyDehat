// Migration script to create supplier_transactions table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSupplierTransactionsTable() {
  try {
    console.log('Creating supplier_transactions table...');

    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create supplier_transactions table
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

        -- Enable Row Level Security
        ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;

        -- Create basic policies (allow authenticated users to read/write)
        DROP POLICY IF EXISTS "Allow authenticated users to read supplier_transactions" ON supplier_transactions;
        DROP POLICY IF EXISTS "Allow authenticated users to insert supplier_transactions" ON supplier_transactions;
        DROP POLICY IF EXISTS "Allow authenticated users to update supplier_transactions" ON supplier_transactions;

        CREATE POLICY "Allow authenticated users to read supplier_transactions" ON supplier_transactions FOR SELECT USING (auth.role() = 'authenticated');
        CREATE POLICY "Allow authenticated users to insert supplier_transactions" ON supplier_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Allow authenticated users to update supplier_transactions" ON supplier_transactions FOR UPDATE USING (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('✅ supplier_transactions table created successfully!');

    // Test if we can query the table
    const { data: testData, error: testError } = await supabase
      .from('supplier_transactions')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('Error testing table:', testError);
    } else {
      console.log('✅ Table is accessible and working!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

createSupplierTransactionsTable();
