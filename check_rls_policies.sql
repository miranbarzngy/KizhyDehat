-- Check if RLS policies exist for key tables
-- Run this in Supabase SQL Editor to verify policies were created

-- Check supplier_transactions policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'supplier_transactions'
ORDER BY policyname;

-- Check products policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- Check inventory policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'inventory'
ORDER BY policyname;

-- Check if RLS is enabled on these tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('supplier_transactions', 'products', 'inventory', 'suppliers')
AND schemaname = 'public'
ORDER BY tablename;
