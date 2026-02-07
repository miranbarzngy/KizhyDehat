-- Create purchase_expenses table to track inventory purchase expenses
-- This table is immutable once created - records cannot be updated or deleted

CREATE TABLE IF NOT EXISTS purchase_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  total_purchase_price NUMERIC(10,2) NOT NULL,
  total_amount_bought NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for purchase_expenses
CREATE POLICY "Allow authenticated users to read purchase expenses" ON purchase_expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert purchase expenses" ON purchase_expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Note: No UPDATE or DELETE policies - records are immutable

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_expenses_date ON purchase_expenses(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_expenses_item_name ON purchase_expenses(item_name);
