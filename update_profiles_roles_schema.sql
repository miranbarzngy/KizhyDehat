-- Update Profiles and Roles Database Schema
-- Run this in Supabase SQL Editor to add missing fields to profiles table

-- ===========================================
-- 1. ADD MISSING FIELDS TO PROFILES TABLE
-- ===========================================

-- Add new columns to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ===========================================
-- 2. UPDATE ROLES TABLE (if needed)
-- ===========================================

-- Ensure roles table has all required fields
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ===========================================
-- 3. UPDATE EXISTING ROLES WITH KURDISH NAMES
-- ===========================================

-- Update existing roles to use Kurdish names if they exist
UPDATE roles SET name = 'ئادمین', updated_at = NOW() WHERE name = 'Admin';
UPDATE roles SET name = 'بەڕێوەبەر', updated_at = NOW() WHERE name = 'Manager';
UPDATE roles SET name = 'کاشیەر', updated_at = NOW() WHERE name = 'Cashier';

-- ===========================================
-- 4. INSERT DEFAULT KURDISH ROLES (if not exist)
-- ===========================================

INSERT INTO roles (name, permissions, description, is_default) VALUES
('ئادمین', '{"sales": true, "inventory": true, "customers": true, "suppliers": true, "payroll": true, "profits": true, "admin": true}', 'دەستپێڕاگەیشتنی تەواو بە هەموو بەشەکان', true),
('بەڕێوەبەر', '{"sales": true, "inventory": true, "customers": true, "suppliers": false, "payroll": false, "profits": true, "admin": false}', 'دەستپێڕاگەیشتن بە زۆرینەی بەشەکان بەڵام بەبێ دەستپێڕاگەیشتنی بەڕێوەبەرایەتی', false),
('کاشیەر', '{"sales": true, "inventory": false, "customers": false, "suppliers": false, "payroll": false, "profits": false, "admin": false}', 'دەستپێڕاگەیشتن بە تەنها فرۆشتن', false)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 5. UPDATE RLS POLICIES FOR PROFILES
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Create updated policies
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update profiles" ON profiles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- ===========================================
-- 6. UPDATE RLS POLICIES FOR ROLES
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete roles" ON roles;

-- Create updated policies
CREATE POLICY "Allow authenticated users to read roles" ON roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert roles" ON roles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update roles" ON roles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete roles" ON roles
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- 7. CREATE INDEXES FOR BETTER PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- ===========================================
-- 8. UPDATE EXISTING PROFILES (if needed)
-- ===========================================

-- Update any profiles that don't have email set (copy from auth.users if available)
-- Note: This is a complex operation that requires checking auth.users, so we'll skip it for now
-- Users can update their profile information through the UI

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database schema update completed successfully!';
    RAISE NOTICE 'Added fields: name, image, phone, location, email to profiles table';
    RAISE NOTICE 'Updated roles with Kurdish names and additional fields';
    RAISE NOTICE 'Updated RLS policies for both tables';
END $$;
