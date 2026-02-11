-- Add is_active column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing profiles to be active by default
UPDATE profiles SET is_active = TRUE WHERE is_active IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.is_active IS 'User account active status - TRUE = active, FALSE = blocked';
