-- ============================================
-- INVENTORY TABLE RLS DIAGNOSTIC & FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if RLS is enabled on inventory table
SELECT
  'RLS Status' as check_name,
  CASE WHEN relrowsecurity = true THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as status
FROM pg_class
WHERE relname = 'inventory';

-- 2. List all RLS policies on inventory table
SELECT
  policyname as policy_name,
  CASE
    WHEN cmd = 'DELETE' THEN 'DELETE'
    WHEN cmd = '*' THEN 'ALL'
    ELSE cmd
  END as operation,
  roles
FROM pg_policies
WHERE tablename = 'inventory';

-- 3. Check current authenticated user role
SELECT
  'Current User' as info,
  current_setting('app.current_tenant', true) as tenant_id,
  current_setting('request.jwt.claim.sub', true) as user_id,
  current_user as pg_user;

-- 4. FIX: Create DELETE policy if it doesn't exist
-- Uncomment and run if delete is not working:

/*
-- Drop existing policies first (optional - only if you want to recreate)
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON inventory;
DROP POLICY IF EXISTS "Allow delete for owners" ON inventory;

-- Create a new DELETE policy that allows authenticated users to delete their own inventory items
CREATE POLICY "Allow delete for authenticated users"
ON inventory
FOR DELETE
TO authenticated
USING (
  -- Optional: Add tenant/user filter if you use multi-tenant
  -- created_by = auth.uid() OR
  true  -- Remove this 'true' and add user filter for production
);

-- Or for admin users:
CREATE POLICY "Allow delete for admins"
ON inventory
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin')
  )
);
*/

-- 5. Grant table permissions (if using service role)
GRANT DELETE ON inventory TO authenticated;
GRANT DELETE ON inventory TO service_role;

-- 6. Check for foreign key constraints that might block deletion
SELECT
  conname as constraint_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE confrelid = 'inventory'::regclass;
