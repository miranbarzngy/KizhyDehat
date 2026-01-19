-- Add profile fields to the profiles table
-- Run this in Supabase SQL Editor to add the missing fields for user profiles

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update RLS policies to include the new fields
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;

-- Allow authenticated users to read profiles
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert profiles
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update profiles
CREATE POLICY "Allow authenticated users to update profiles" ON profiles
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow users to update their own profiles
CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
