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
CREATE POLICY "Allow authenticated users to read supplier_transactions" ON supplier_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert supplier_transactions" ON supplier_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update supplier_transactions" ON supplier_transactions FOR UPDATE USING (auth.role() = 'authenticated');
