-- Fix RLS policies for invoice_settings table to allow updating auto_logout_minutes

-- First, check if RLS is enabled
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update shop settings" ON invoice_settings;
DROP POLICY IF EXISTS "Users can view shop settings" ON invoice_settings;

-- Create policy to allow authenticated users to view settings
CREATE POLICY "Users can view shop settings" ON invoice_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update settings (including auto_logout_minutes)
CREATE POLICY "Users can update shop settings" ON invoice_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON invoice_settings TO authenticated;

-- Verify the column exists and has correct type
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'invoice_settings' 
AND column_name = 'auto_logout_minutes';
