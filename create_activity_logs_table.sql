-- Create activity_logs table for system tracking
-- Run this SQL in your Supabase SQL Editor
-- This script is safe to run multiple times

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users' AND tablename = 'activity_logs'
  ) THEN
    ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable insert for authenticated users" ON activity_logs 
      FOR INSERT TO authenticated 
      WITH CHECK (true);
      
    CREATE POLICY "Enable select for authenticated users" ON activity_logs 
      FOR SELECT TO authenticated 
      USING (true);
  END IF;
END $$;

-- Create indexes (use IF NOT EXISTS to avoid errors)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Add foreign key constraint to profiles (use IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_logs_user_id_fkey' 
    AND table_name = 'activity_logs'
  ) THEN
    ALTER TABLE activity_logs 
      ADD CONSTRAINT activity_logs_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create improved function to automatically set user_name from profiles
-- This will ALWAYS overwrite user_name with profile name if user_id exists
CREATE OR REPLACE FUNCTION set_activity_log_user_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Always try to get name from profiles if user_id exists
  IF NEW.user_id IS NOT NULL THEN
    SELECT p.name INTO NEW.user_name 
    FROM profiles p 
    WHERE p.id = NEW.user_id;
    
    -- If still null, set default
    IF NEW.user_name IS NULL THEN
      NEW.user_name := 'بەکارهێنەری نەناسراو';
    END IF;
  ELSE
    -- If no user_id, set system default
    NEW.user_name := 'سیستەم';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before insert (always)
DROP TRIGGER IF EXISTS set_user_name_on_activity_log ON activity_logs;
CREATE TRIGGER set_user_name_on_activity_log
  BEFORE INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_activity_log_user_name();
