-- Assign specific role to user profile
-- Run this in Supabase SQL Editor to assign role to user

-- Update the user's profile with the specified role_id
UPDATE profiles
SET role_id = '6dc4d359-8907-4815-baa7-9e003b662f2a'
WHERE id = 'af1f1d2d-1229-43de-b4e6-adda36e4c326';

-- Verify the update was successful
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

-- Alternative: If you want to assign by role name instead of ID
-- Uncomment the line below and replace 'ROLE_NAME' with the actual role name
-- UPDATE profiles SET role_id = (SELECT id FROM roles WHERE name = 'ROLE_NAME' LIMIT 1) WHERE id = 'af1f1d2d-1229-43de-b4e6-adda36e4c326';
