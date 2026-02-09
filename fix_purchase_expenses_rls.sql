-- Fix RLS policies for purchase_expenses to allow DELETE operations

-- First, check existing policies
SELECT * FROM pg_policies WHERE tablename = 'purchase_expenses';

-- Drop existing DELETE policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Allow authenticated users to delete purchase expenses" ON purchase_expenses;

-- Create DELETE policy for authenticated users
CREATE POLICY "Allow authenticated users to delete purchase expenses"
ON purchase_expenses
FOR DELETE
USING (auth.role() = 'authenticated');

-- Also check if RLS is enabled
ALTER TABLE purchase_expenses ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'purchase_expenses';
