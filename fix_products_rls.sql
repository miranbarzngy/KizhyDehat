-- Fix RLS for products table
-- Run this in Supabase SQL Editor to fix read access
-- Step 1: Check existing policies
SELECT policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'products';
-- Step 2: Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to access products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;
-- Step 3: Create proper RLS policies for SELECT (READ)
CREATE POLICY "Products readable by authenticated users" ON products FOR
SELECT USING (
    auth.role() IN ('authenticated', 'authenticated')
  );
-- Step 4: Create policy for INSERT
CREATE POLICY "Products insertable by authenticated users" ON products FOR
INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'authenticated')
  );
-- Step 5: Create policy for UPDATE
CREATE POLICY "Products updatable by authenticated users" ON products FOR
UPDATE USING (
    auth.role() IN ('authenticated', 'authenticated')
  );
-- Step 6: Create policy for DELETE
CREATE POLICY "Products deletable by authenticated users" ON products FOR DELETE USING (
  auth.role() IN ('authenticated', 'authenticated')
);
-- Step 7: Disable RLS temporarily for testing (commented out)
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- Verify policies are created
SELECT *
FROM pg_policies
WHERE tablename = 'products';
-- Test: Select count
-- SELECT COUNT(*) FROM products;