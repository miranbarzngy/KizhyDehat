-- Create profiles for existing auth users who don't have profiles yet
-- Run this in Supabase SQL Editor to create missing profile records

-- First, ensure we have the default admin role
INSERT INTO roles (name, permissions)
VALUES ('Admin', '{
  "dashboard": true,
  "sales": true,
  "inventory": true,
  "customers": true,
  "suppliers": true,
  "invoices": true,
  "expenses": true,
  "profits": true,
  "help": true,
  "admin": true
}')
ON CONFLICT (name) DO NOTHING;

-- Create profiles for all auth users who don't have profiles yet
INSERT INTO profiles (id, role_id, created_at)
SELECT
  au.id,
  (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1), -- Get the admin role ID
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Update existing profiles with basic information
-- Since user metadata structure may vary, we'll use email-based defaults
UPDATE profiles
SET
  name = COALESCE(
    profiles.name,
    split_part(auth.users.email, '@', 1)
  ),
  email = COALESCE(
    profiles.email,
    auth.users.email
  )
FROM auth.users
WHERE profiles.id = auth.users.id
  AND (
    profiles.name IS NULL
    OR profiles.email IS NULL
  );

-- Special handling for admin@pos.com user
UPDATE profiles
SET
  name = 'بەڕێوبەر',
  role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@pos.com'
);

-- Verify the profiles were created
SELECT
  p.id,
  p.name,
  p.email,
  p.phone,
  p.location,
  r.name as role_name,
  r.permissions
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
ORDER BY p.created_at DESC;