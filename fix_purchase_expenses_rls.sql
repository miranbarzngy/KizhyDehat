-- RLS Policies for purchase_expenses table
-- Run this in Supabase SQL Editor

-- First, enable RLS on purchase_expenses if not already enabled
ALTER TABLE purchase_expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read purchase_expenses" ON purchase_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to insert purchase_expenses" ON purchase_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update purchase_expenses" ON purchase_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete purchase_expenses" ON purchase_expenses;

-- Allow authenticated users to read purchase_expenses
CREATE POLICY "Allow authenticated users to read purchase_expenses" ON purchase_expenses
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert purchase_expenses
CREATE POLICY "Allow authenticated users to insert purchase_expenses" ON purchase_expenses
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update purchase_expenses
CREATE POLICY "Allow authenticated users to update purchase_expenses" ON purchase_expenses
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete purchase_expenses
CREATE POLICY "Allow authenticated users to delete purchase_expenses" ON purchase_expenses
FOR DELETE USING (auth.role() = 'authenticated');
