-- Fix role names to use Kurdish versions
-- Run this in Supabase SQL Editor to update role names

-- Update the specific role to use Kurdish name
UPDATE roles
SET name = 'ئادمین', updated_at = NOW()
WHERE id = '6dc4d359-8907-4815-baa7-9e003b662f2a';

-- Update all roles to use Kurdish names
UPDATE roles SET name = 'ئادمین', updated_at = NOW() WHERE name = 'Admin';
UPDATE roles SET name = 'بەڕێوەبەر', updated_at = NOW() WHERE name = 'Manager';
UPDATE roles SET name = 'کاشیەر', updated_at = NOW() WHERE name = 'Cashier';

-- Verify the updates
SELECT id, name, permissions FROM roles ORDER BY name;

-- Check the user's current role assignment
SELECT
  p.id as user_id,
  p.name,
  p.email,
  r.id as role_id,
  r.name as role_name,
  r.permissions
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.id = 'af1f1d2d-1229-43de-b4e6-adda36e4c326';
