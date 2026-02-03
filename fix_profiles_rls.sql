-- Fix RLS policies for profiles table
-- Run this in Supabase SQL Editor to fix the profile query error

-- First, ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Create proper RLS policies for profiles table
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update profiles" ON profiles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Also ensure roles table has proper policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete roles" ON roles;

CREATE POLICY "Allow authenticated users to read roles" ON roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert roles" ON roles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update roles" ON roles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete roles" ON roles
FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('profiles', 'roles')
ORDER BY tablename, policyname;