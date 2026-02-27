-- Fix RLS policies for roles table to allow authenticated users to read roles

-- Drop existing policies on roles table if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow service role to manage roles" ON roles;
DROP POLICY IF EXISTS "Allow anon to read roles" ON roles;

-- Create a policy that allows all authenticated users to read roles
CREATE POLICY "Allow authenticated users to read roles" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy that allows anon to read roles (needed for initial load)
CREATE POLICY "Allow anon to read roles" ON roles
  FOR SELECT
  TO anon
  USING (true);

-- Make sure RLS is enabled
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'roles';
