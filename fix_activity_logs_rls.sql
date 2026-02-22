-- Fix RLS for activity_logs table
-- Run this in Supabase SQL Editor

-- Enable RLS if not enabled
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON activity_logs;

-- Create permissive policies for activity_logs
CREATE POLICY "Enable insert for authenticated users" ON activity_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON activity_logs 
  FOR SELECT TO authenticated 
  USING (true);

-- Also ensure profiles table has RLS enabled and allows reads
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if exists
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;

-- Create profile read policy
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Verify the policies
SELECT 
    t.table_name,
    CASE WHEN c.relrowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
    AND t.table_name IN ('activity_logs', 'profiles')
GROUP BY t.table_name, c.relrowsecurity
ORDER BY t.table_name;
