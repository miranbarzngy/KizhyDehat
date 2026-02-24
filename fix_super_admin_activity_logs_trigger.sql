-- Fix: Super Admin Activity Log Trigger
-- This fixes the issue where super admin shows as "بەکارهێنەری نەناسراو" in activity logs
-- Run this SQL in your Supabase SQL Editor

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS set_user_name_on_activity_log ON activity_logs;
DROP FUNCTION IF EXISTS set_activity_log_user_name();

-- Create improved function that:
-- 1. Respects already-provided user_name (doesn't overwrite)
-- 2. Handles super admin email check via auth.users
CREATE OR REPLACE FUNCTION set_activity_log_user_name()
RETURNS TRIGGER AS $$
DECLARE
  super_admin_email TEXT := 'superadmin@clickgroup.com';
  super_admin_name TEXT := 'سوپەر ئادمین';
  user_email TEXT;
BEGIN
  -- If user_name was already provided (not null/empty), keep it
  -- This allows the frontend to pass super admin name correctly
  IF NEW.user_name IS NOT NULL AND NEW.user_name != '' THEN
    RETURN NEW;
  END IF;
  
  -- If user_id exists, try to get name from profiles
  IF NEW.user_id IS NOT NULL THEN
    -- First try to get name from profiles table
    SELECT p.name INTO NEW.user_name 
    FROM profiles p 
    WHERE p.id = NEW.user_id;
    
    -- If profile has no name, check if this user is super admin
    IF NEW.user_name IS NULL OR NEW.user_name = '' THEN
      -- Get the user's email from auth.users
      SELECT u.email INTO user_email
      FROM auth.users u
      WHERE u.id = NEW.user_id;
      
      -- If email matches super admin, use super admin name
      IF user_email IS NOT NULL AND LOWER(user_email) = LOWER(super_admin_email) THEN
        NEW.user_name := super_admin_name;
      ELSE
        -- Otherwise set default
        NEW.user_name := 'بەکارهێنەری نەناسراو';
      END IF;
    END IF;
  ELSE
    -- If no user_id, check if there's a session user (could be super admin)
    -- This handles cases where we have email but no user_id yet
    BEGIN
      SELECT u.email INTO user_email
      FROM auth.users u
      WHERE u.id = NEW.user_id;
      
      IF user_email IS NOT NULL AND LOWER(user_email) = LOWER(super_admin_email) THEN
        NEW.user_name := super_admin_name;
      ELSE
        NEW.user_name := 'سیستەم';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NEW.user_name := 'سیستەم';
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before insert
CREATE TRIGGER set_user_name_on_activity_log
  BEFORE INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_activity_log_user_name();

-- Verify the trigger is working
SELECT 'Trigger created successfully!' AS result;
