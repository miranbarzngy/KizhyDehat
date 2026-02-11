-- Add auto_logout_minutes column to invoice_settings table
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS auto_logout_minutes INTEGER DEFAULT 15;

-- Update existing settings with default value
UPDATE invoice_settings SET auto_logout_minutes = 15 WHERE auto_logout_minutes IS NULL;

-- Add comment
COMMENT ON COLUMN invoice_settings.auto_logout_minutes IS 'Minutes of inactivity before auto logout';
