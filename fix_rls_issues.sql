-- Fix RLS issues for inventory and other tables
-- Run this in Supabase SQL Editor

-- First, enable RLS on tables that should have it
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated users to read inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to delete inventory" ON inventory;

DROP POLICY IF EXISTS "Allow authenticated users to read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to delete suppliers" ON suppliers;

-- Recreate policies for inventory
CREATE POLICY "Allow authenticated users to read inventory" ON inventory
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert inventory" ON inventory
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update inventory" ON inventory
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete inventory" ON inventory
FOR DELETE USING (auth.role() = 'authenticated');

-- Recreate policies for suppliers
CREATE POLICY "Allow authenticated users to read suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert suppliers" ON suppliers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update suppliers" ON suppliers
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete suppliers" ON suppliers
FOR DELETE USING (auth.role() = 'authenticated');

-- Double-check that all critical tables have RLS enabled and policies
SELECT
    t.table_name,
    t.table_schema,
    CASE WHEN c.relrowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.table_schema)
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
WHERE t.table_schema = 'public'
    AND t.table_name IN ('inventory', 'products', 'supplier_transactions', 'suppliers', 'expenses')
GROUP BY t.table_name, t.table_schema, c.relrowsecurity
ORDER BY t.table_name;
