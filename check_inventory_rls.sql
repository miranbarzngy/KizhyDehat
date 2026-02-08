-- ============================================
-- INVENTORY TABLE RLS DIAGNOSTIC & FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if RLS is enabled on inventory table
SELECT
  'RLS Status' as check_name,
  CASE WHEN relrowsecurity = true THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status
FROM pg_class
WHERE relname = 'inventory';

-- 2. List all RLS policies on inventory table
SELECT
  policy_name,
  action,
  roles,
  CASE
    WHEN operation = 'DELETE' THEN '✅ DELETE ALLOWED'
    WHEN operation = '*' THEN '✅ ALL OPERATIONS'
    ELSE '❌ MISSING DELETE'
  END as delete_status
FROM pg_policies
WHERE tablename = 'inventory';

-- 3. Check current authenticated user role
SELECT
  'Current User' as info,
  current_setting('app.current_tenant') as tenant_id,
  current_setting('request.jwt.claim.sub') as user_id,
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

-- 5. Test DELETE permissions
-- Run this to see if you can delete a specific record:
-- Replace 'YOUR_ITEM_UUID' with an actual item ID
/*
DO $$
DECLARE
  test_id uuid := 'YOUR_ITEM_UUID'; -- Replace with actual ID
BEGIN
  DELETE FROM inventory WHERE id = test_id;
  RAISE NOTICE '✅ Delete successful - RLS allows this action';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Delete failed: %', SQLERRM;
END $$;
*/

-- 6. Grant table permissions (if using service role)
GRANT DELETE ON inventory TO authenticated;
GRANT DELETE ON inventory TO service_role;

-- 7. Check for foreign key constraints that might block deletion
SELECT
  conname as constraint_name,
  conrelid::regclass as referencing_table,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE confrelid = 'inventory'::regclass;
